import User from "../models/userModel.js";
import { sendWarningEmail } from "../config/nodemailer.js";
import Workshop from "../models/Workshop.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -verifyToken -resetOtp');
    res.status(200).json(users);
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Server error while fetching users" });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true 
    }).select('-password -verifyToken -resetOtp');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User updated successfully",
      user
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ message: "Server error while updating user" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};

// Block user controller
export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { blockDuration, reason } = req.body; // duration in hours, reason for blocking

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let blockedUntil = null;
    if (blockDuration) {
      blockedUntil = new Date();
      blockedUntil.setHours(blockedUntil.getHours() + blockDuration);
    }

    user.isBlocked = true;
    user.blockedUntil = blockedUntil;
    
    // Add block reason to warnings
    if (reason) {
      user.warnings.push({
        reason: `Account blocked: ${reason}`,
        warningDate: new Date()
      });
    }

    await user.save();

    // Send notification email
    try {
      await sendWarningEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        "Account Blocked",
        reason || "Violation of terms of service",
        user.warnings.length
      );
    } catch (emailError) {
      console.error("Failed to send block notification email:", emailError);
    }

    res.status(200).json({
      message: `User ${blockDuration ? `blocked until ${blockedUntil}` : 'permanently blocked'}`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isBlocked: user.isBlocked,
        blockedUntil: user.blockedUntil,
        warnings: user.warnings.length
      }
    });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ message: "Server error while blocking user" });
  }
};

// Unblock user controller
export const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
        blockedUntil: null
      },
      { new: true }
    ).select('-password -verifyToken -resetOtp');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User unblocked successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isBlocked: user.isBlocked
      }
    });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ message: "Server error while unblocking user" });
  }
};

// Get blocked users
export const getBlockedUsers = async (req, res) => {
  try {
    const blockedUsers = await User.find({
      $or: [
        { isBlocked: true },
        { blockedUntil: { $gt: new Date() } }
      ]
    }).select('-password -verifyToken -resetOtp');

    res.status(200).json({
      count: blockedUsers.length,
      users: blockedUsers
    });
  } catch (error) {
    console.error("Get blocked users error:", error);
    res.status(500).json({ message: "Server error while fetching blocked users" });
  }
};

// Add workshop to user
export const addWorkshopToUser = async (req, res) => {
  try {
    const { userId, workshopId } = req.params;
    // Allow the user themselves to add a workshop; Admin/EventOffice can add for others
    if (String(req.user.id) !== String(userId) && !["admin", "eventoffice"].includes((req.user.role || '').toLowerCase())) {
      return res.status(403).json({ message: 'Access denied. Only the user themself or Admin/EventOffice can add workshops.' });
    }

    // enforce that the requester is the same user or an admin
    const requesterId = req.user?.id || req.user?._id;
    const requesterRole = req.user?.role ? String(req.user.role).toLowerCase() : null;
    if (!requesterId) return res.status(401).json({ message: 'Unauthorized' });
    if (requesterId !== userId && requesterRole !== 'admin') {
      return res.status(403).json({ message: 'You can only register yourself (or be Admin).' });
    }

    const workshop = await Workshop.findById(workshopId);
    if (!workshop) return res.status(404).json({ message: 'Workshop not found' });

    // If workshop has allowedRoles and it's non-empty, check the requester's role
    if (Array.isArray(workshop.allowedRoles) && workshop.allowedRoles.length > 0) {
      if (!requesterRole || !workshop.allowedRoles.map(r => r.toLowerCase()).includes(requesterRole)) {
        return res.status(403).json({ message: 'Your role is not allowed to register for this workshop.' });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already registered for this workshop
    const isAlreadyRegistered = user.eventRegistrations.workshops.some(
      reg => reg.workshopId.toString() === workshopId.toString()
    );

    if (isAlreadyRegistered) {
      return res.status(409).json({ message: "User is already registered for this workshop" });
    }

    user.eventRegistrations.workshops.push({
      workshopId: workshopId,
      registeredAt: new Date(),
      status: "registered",
      amountPaid: 0, // Assuming free workshop since this is the "add" endpoint
      certificateSent: false
    });

    await user.save();

    // Populate the newly added registration for the response
    const updatedUser = await User.findById(userId)
      .populate('eventRegistrations.workshops.workshopId')
      .select('-password -verifyToken -resetOtp');

    res.status(200).json({
      message: "Workshop added to user successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Add workshop to user error:", error);
    res.status(500).json({ message: "Server error while adding workshop to user" });
  }
};

// Add trip to user
export const addTripToUser = async (req, res) => {
  try {
    const { userId, tripId } = req.params;
    // Allow the user themselves to add a trip; Admin/EventOffice can add for others
    if (String(req.user.id) !== String(userId) && !["admin", "eventoffice"].includes((req.user.role || '').toLowerCase())) {
      return res.status(403).json({ message: 'Access denied. Only the user themself or Admin/EventOffice can add trips.' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { "attendedEvents.trips": tripId } },
      { new: true }
    ).select('-password -verifyToken -resetOtp');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Trip added to user successfully",
      user
    });
  } catch (error) {
    console.error("Add trip to user error:", error);
    res.status(500).json({ message: "Server error while adding trip to user" });
  }
};

// Remove workshop from user
export const removeWorkshopFromUser = async (req, res) => {
  try {
    const { userId, workshopId } = req.params;
    // Allow the user themselves to remove a workshop; Admin/EventOffice can remove for others
    if (String(req.user.id) !== String(userId) && !["admin", "eventoffice"].includes((req.user.role || '').toLowerCase())) {
      return res.status(403).json({ message: 'Access denied. Only the user themself or Admin/EventOffice can remove workshops.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the index of the registration to remove
    const registrationIndex = user.eventRegistrations.workshops.findIndex(
      reg => reg.workshopId.toString() === workshopId.toString()
    );

    if (registrationIndex === -1) {
      return res.status(404).json({ message: "Registration not found for this workshop" });
    }

    // Remove the registration from the array
    user.eventRegistrations.workshops.splice(registrationIndex, 1);

    await user.save();

    res.status(200).json({
      message: "Workshop removed from user successfully",
      user // Return the updated user object (though client mostly cares about success)
    });
  } catch (error) {
    console.error("Remove workshop from user error:", error);
    res.status(500).json({ message: "Server error while removing workshop from user" });
  }
};

// Remove trip from user
export const removeTripFromUser = async (req, res) => {
  try {
    const { userId, tripId } = req.params;
    // Allow the user themselves to remove a trip; Admin/EventOffice can remove for others
    if (String(req.user.id) !== String(userId) && !["admin", "eventoffice"].includes((req.user.role || '').toLowerCase())) {
      return res.status(403).json({ message: 'Access denied. Only the user themself or Admin/EventOffice can remove trips.' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { "attendedEvents.trips": tripId } },
      { new: true }
    ).select('-password -verifyToken -resetOtp');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Trip removed from user successfully",
      user
    });
  } catch (error) {
    console.error("Remove trip from user error:", error);
    res.status(500).json({ message: "Server error while removing trip from user" });
  }
};

// Get single user by id (return attended workshops/trips in expected shape)
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select('-password -verifyToken -resetOtp')
      .populate('eventRegistrations.workshops.workshopId')
      .populate('eventRegistrations.trips.tripId');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Return in the shape client expects: { data: { workshops: [...], trips: [...] } }
    // Now, workshops and trips in the response should be the populated registration objects
    res.status(200).json({ 
      success: true, 
      data: { 
        workshops: user.eventRegistrations?.workshops || [], 
        trips: user.eventRegistrations?.trips || [] 
      } 
    });
  } catch (error) {
    console.error('Get user by id error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching user' });
  }
};