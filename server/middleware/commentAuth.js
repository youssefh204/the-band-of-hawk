// middleware/commentAuth.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const commentAuthMiddleware = async (req, res, next) => {
  const headerToken = req.headers.authorization?.split(" ")[1];
  const cookieToken = req.cookies?.token;
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.isBlocked) {
      const now = new Date();
      if (user.blockedUntil && user.blockedUntil > now) {
        return res.status(403).json({ 
          message: `Account is temporarily blocked until ${user.blockedUntil.toLocaleString()}`,
          blockedUntil: user.blockedUntil,
          isTemporary: true
        });
      } else if (!user.blockedUntil) {
        return res.status(403).json({ 
          message: "Account is permanently blocked. Please contact administrator.",
          isPermanent: true
        });
      }
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName
    };
    next();
  } catch (err) {
    console.error('commentAuthMiddleware error:', err);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    } else if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    res.status(403).json({ message: "Authentication failed" });
  }
};

export const commentAuthorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "No role found in token" });
    }

    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map(role => role.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};