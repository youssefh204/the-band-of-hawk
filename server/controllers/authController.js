import bcrypt from "bcryptjs"; 
import jwt from "jsonwebtoken";
import crypto from "crypto";
import userModel from "../models/userModel.js";
import vendorModel from "../models/VendorModel.js"
import { sendVerificationEmail } from "../config/nodemailer.js";

export const checkAuth = async (req, res) => {
  try {
    // Accept token from Authorization header or cookie
    const headerToken = req.headers.authorization?.split(" ")[1];
    const cookieToken = req.cookies?.token;
    const token = headerToken || cookieToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No authentication token found.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Return full user record so frontend has attendedEvents and other details
    const user = await userModel.findById(decoded.id)
      .select('-password -verifyToken -resetOtp')
      .populate('attendedEvents.workshops')
      .populate('attendedEvents.trips')
      .populate('eventRegistrations.workshops.workshopId')
      .populate('eventRegistrations.trips.tripId');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user });
  } catch (err) {
    console.error("Auth check failed:", err.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

/**
 * REGISTER USER (Student/Staff/TA/Professor or Vendor)
 */
export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      studentId,
      companyName,
      email,
      password,
      role,
    } = req.body;

    // 1️⃣ Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    // 2️⃣ Role validation
    const allowedRoles = ["student", "staff", "ta", "professor", "vendor"];
    const userRole =
      role && allowedRoles.includes(role.toLowerCase())
        ? role.toLowerCase()
        : "student";

    // 3️⃣ Vendor registration
    if (userRole === "vendor") {
      if (!companyName) {
        return res.status(400).json({
          success: false,
          message: "Company name is required for vendors.",
        });
      }

      const existingVendor = await vendorModel.findOne({ email });
      if (existingVendor) {
        return res
          .status(400)
          .json({ success: false, message: "Email already registered." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Don't generate verification token yet - wait for admin approval
      const newVendor = new vendorModel({
        companyName,
        email,
        password: hashedPassword,
        verifyToken: null, // Will be set when admin approves
        verifyTokenExpiry: null, // Will be set when admin approves
        role: "vendor",
        isAccountVerified: false,
        isApproved: false,
      });

      await newVendor.save();

      return res.status(201).json({
        success: true,
        message: "Vendor registered successfully! Awaiting admin approval.",
        data: {
          userId: newVendor._id,
          email: newVendor.email,
          role: "vendor",
        },
      });
    }

    // 4️⃣ Student/Staff/TA/Professor registration
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required.",
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Don't generate verification token yet - wait for admin approval
    const newUser = new userModel({
      firstName,
      lastName,
      studentId,
      email,
      password: hashedPassword,
      verifyToken: null, // Will be set when admin approves
      verifyTokenExpiry: null, // Will be set when admin approves
      isAccountVerified: false,
      isApproved: false,
      role: userRole,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "Registration successful! Awaiting admin approval.",
      data: {
        userId: newUser._id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: userRole,
      },
    });
  } catch (err) {
    console.error("Registration Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again later.",
      error: err.message,
    });
  }
};

/**
 * SEND VERIFICATION EMAIL (To be called by admin when approving users)
 */
export const sendVerificationAfterApproval = async (req, res) => {
  try {
    const { userId, accountType = 'user' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required."
      });
    }

    let account;
    
    if (accountType === 'vendor') {
      account = await vendorModel.findById(userId);
    } else {
      account = await userModel.findById(userId);
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    if (account.isAccountVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account already verified'
      });
    }

    if (!account.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Account must be approved before sending verification email'
      });
    }

    // Generate verification token (expires in 1 hour)
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpiry = Date.now() + 1000 * 60 * 60;

    // Update account with verification token
    account.verifyToken = verifyToken;
    account.verifyTokenExpiry = verifyTokenExpiry;
    await account.save();

    // Send verification email
    let name, email;
    
    if (accountType === 'vendor') {
      name = account.companyName;
      email = account.email;
    } else {
      name = `${account.firstName} ${account.lastName}`;
      email = account.email;
    }

    await sendVerificationEmail(email, name, verifyToken);
    
    return res.status(200).json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Error sending verification after approval:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send verification email',
      error: error.message
    });
  }
};

/**
 * LOGIN
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required." 
      });
    }

    let account = null;
    let accountType = null;

    // Try to find user first
    account = await userModel.findOne({ email });
    if (account) {
      accountType = 'user';
    } else {
      // If not user, try vendor
      account = await vendorModel.findOne({ email });
      if (account) {
        accountType = 'vendor';
      }
    }

    // If no account found
    if (!account) {
      return res.status(404).json({ 
        success: false, 
        message: "This email is not registered." 
      });
    }

    // Check admin approval first
    if (!account.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your account is pending admin approval.",
      });
    }

    // Check email verification (only after admin approval)
    if (!account.isAccountVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in. Check your inbox for the verification link.",
      });
    }

    // Password check
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: "Incorrect password." 
      });
    }

    // Create token
    const token = jwt.sign(
      { 
        id: account._id, 
        role: account.role, 
        accountType: accountType 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Prepare response based on account type
    let userResponse = {
      id: account._id,
      email: account.email,
      role: account.role,
      accountType: accountType,
      isAccountVerified: account.isAccountVerified,
      isApproved: account.isApproved
    };

    // Add type-specific fields
    if (accountType === 'user') {
      userResponse.firstName = account.firstName;
      userResponse.lastName = account.lastName;
      userResponse.studentId = account.studentId;

      // include attended events and registrations so client remembers joined events
      try {
        const fullUser = await userModel.findById(account._id)
          .select('-password -verifyToken -resetOtp')
          .populate('attendedEvents.workshops')
          .populate('attendedEvents.trips');

        if (fullUser) {
          userResponse.attendedEvents = fullUser.attendedEvents || {};
          userResponse.eventRegistrations = fullUser.eventRegistrations || {};
        }
      } catch (e) {
        console.error('Failed to include attendedEvents in login response:', e);
      }
    } else if (accountType === 'vendor') {
      userResponse.companyName = account.companyName;
    }

    res.json({
      success: true,
      token,
      user: userResponse
    });

  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({
      success: false,
      message: "Server error during login.",
      error: err.message,
    });
  }
};

/**
 * LOGOUT
 */
export const logout = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.json({ success: true, message: "Logged out successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * VERIFY EMAIL
 */
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required.",
      });
    }

    // Check both user and vendor models
    let account = await userModel.findOne({
      verifyToken: token,
      verifyTokenExpiry: { $gt: Date.now() },
    });

    let accountType = 'user';
    
    if (!account) {
      account = await vendorModel.findOne({
        verifyToken: token,
        verifyTokenExpiry: { $gt: Date.now() },
      });
      accountType = 'vendor';
    }

    if (!account) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token.",
      });
    }

    // Check if account is approved by admin
    if (!account.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Your account is not yet approved by admin. Please wait for approval.",
      });
    }

    // If already verified
    if (account.isAccountVerified) {
      return res.status(200).json({
        success: true,
        message: "Email already verified. You can now log in.",
      });
    }

    // Update verification fields
    account.isAccountVerified = true;
    account.verifyToken = null;
    account.verifyTokenExpiry = null;
    await account.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now log in.",
      data: {
        email: account.email,
        name: account.firstName || account.companyName,
        accountType
      },
    });
  } catch (err) {
    console.error("Email Verification Error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Email verification failed. Please try again later.",
      error: err.message,
    });
  }
};