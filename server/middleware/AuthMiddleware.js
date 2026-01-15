// middleware/AuthMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Vendor from "../models/VendorModel.js";

// ------------------------------------------------------
// MAIN AUTH MIDDLEWARE (supports BOTH users & vendors)
// ------------------------------------------------------
export const authMiddleware = async (req, res, next) => {
  const headerToken = req.headers.authorization?.split(" ")[1];
  const cookieToken = req.cookies?.token;
  const token = headerToken || cookieToken;

  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let account = null;

    // Try regular users first
    account = await User.findById(decoded.id);

    // If not found → try vendor collection
    if (!account) {
      account = await Vendor.findById(decoded.id);
    }

    if (!account) {
      return res.status(401).json({ message: "User/Vendor not found" });
    }

    // USER BLOCK CHECK (vendors don't use isBlocked)
    if (account.constructor.modelName === "User" && account.isBlocked) {

      const now = new Date();

      if (account.blockedUntil && account.blockedUntil > now) {
        return res.status(403).json({
          message: `Account is temporarily blocked until ${account.blockedUntil.toLocaleString()}`,
          blockedUntil: account.blockedUntil,
          isTemporary: true
        });
      }

      // If block expired → auto un-block
      if (account.blockedUntil && account.blockedUntil <= now) {
        account.isBlocked = false;
        account.blockedUntil = null;
        await account.save();
      }
    }

    // Attach authenticated data
    req.user = {
      id: decoded.id,
      role: decoded.role,
      accountType: decoded.accountType,  // "user" or "vendor"
      email: account.email
    };

    next();
  } catch (err) {
    console.error("authMiddleware error:", err);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token" });
    }

    return res.status(401).json({ message: "Authentication failed" });
  }
};

// ------------------------------------------------------
// ROLE AUTHORIZATION
// ------------------------------------------------------
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: "No role found in token" });
    }

    const userRole = req.user.role.toLowerCase();
    const allowedRoles = roles.map((r) => r.toLowerCase());

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: `Access denied. Allowed roles: ${roles.join(", ")}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};
export const requireEventOffice = (req, res, next) => {
  const role = req.user?.role;
  if (role === "Admin" || role === "EventOffice"||role ==="eventoffice") return next();
  return res.status(403).json({ success: false, message: "Not authorized" });
};

export const requireAdmin = (req, res, next) => {
  const role = req.user?.role;
  if (role === "Admin" || role === "admin" || role === "EventOffice"||role ==="eventoffice") return next();
  return res.status(403).json({ success: false, message: "Not authorized" });
};

// ------------------------------------------------------
// OPTIONAL AUTH (token is optional)
// ------------------------------------------------------
export const optionalAuth = (req, res, next) => {
  const headerToken = req.headers.authorization?.split(" ")[1];
  const cookieToken = req.cookies?.token;
  const token = headerToken || cookieToken;

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.warn("optionalAuth: invalid token");
    req.user = null;
    next();
  }
};
export default authMiddleware;
