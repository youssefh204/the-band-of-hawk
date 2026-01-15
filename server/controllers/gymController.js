import GymSession from '../models/gym.js';
import GymRegistration from '../models/GymRegistration.js';
import User from '../models/userModel.js';
import { sendNotificationToUser } from '../utils/socketUtils.js';
import getTransporter from '../config/nodemailer.js';

// Create a new gym session
export const createSession = async (req, res) => {
  try {
    const session = await GymSession.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Gym session created successfully',
      data: session
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get all sessions
export const getAllSessions = async (req, res) => {
  try {
    const { type, status, date } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (date) filter.date = new Date(date);

    const sessions = await GymSession.find(filter).sort({ date: 1, time: 1 });
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single session by ID
export const getSessionById = async (req, res) => {
  try {
    const session = await GymSession.findById(req.params.id);
    if (!session)
      return res.status(404).json({ success: false, message: 'Session not found' });
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update session (Event Office ONLY)
export const updateSession = async (req, res) => {
  try {
    const { date, time, duration } = req.body;

    const session = await GymSession.findById(req.params.id);
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    // Restrict editable fields
    if (date) session.date = date;
    if (time) session.time = time;
    if (duration) session.duration = duration;

    await session.save();

    // Notify registered users
    const registrations = await GymRegistration.find({ session: session._id, status: "registered" })
                                               .populate("user", "email firstName");

    const transporter = await getTransporter();
    const updates = registrations.map(async ({ user }) => {
      transporter.sendMail({
        from: `"Campus Events" <${process.env.GOOGLE_EMAIL}>`,
        to: user.email,
        subject: `📢 Gym Session Update: ${formatSessionTitle(session)}`,
        text: `The session's timing has been updated.\nNew schedule: ${session.date} at ${session.time}.`,
      });

      sendNotificationToUser(user._id, {
        type: "info",
        message: `Gym session updated: ${formatSessionTitle(session)}`
      });
    });

    await Promise.all(updates);

    res.status(200).json({ success: true, message: "Session updated successfully", data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete a session
export const deleteSession = async (req, res) => {
  try {
    const session = await GymSession.findByIdAndDelete(req.params.id);
    if (!session)
      return res.status(404).json({ success: false, message: 'Session not found' });

    res.status(200).json({ success: true, message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Join a session (Student/Staff/TA/Professor)
export const joinSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const sessionId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const session = await GymSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    // Check capacity manually
    if (session.currentParticipants >= session.capacity) {
      return res.status(400).json({ success: false, message: "Session is full" });
    }

    // Prevent duplicate registration
    const alreadyRegistered = await GymRegistration.findOne({ user: userId, session: sessionId });
    if (alreadyRegistered) {
      return res.status(400).json({ success: false, message: "Already registered" });
    }

    await GymRegistration.create({ user: userId, session: sessionId });
    session.currentParticipants += 1;
    await session.save();

    res.status(200).json({ success: true, message: "Joined successfully" });

  } catch (err) {
    console.error("joinSession error:", err);
    res.status(500).json({ success: false, message: "Internal server error while joining" });
  }
};

/// Cancel a session (Event Office ONLY)
export const cancelSession = async (req, res) => {
  try {
    const session = await GymSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found" });
    }

    session.status = "cancelled";
    await session.save();

    // Cancel registrations + notify users
    const registrations = await GymRegistration.find({ session: session._id, status: "registered" })
                                              .populate("user", "email firstName");

    await GymRegistration.updateMany({ session: session._id }, { status: "cancelled" });

    const transporter = await getTransporter();

    const notifications = registrations.map(async ({ user }) => {
      transporter.sendMail({
        from: `"Campus Events" <${process.env.GOOGLE_EMAIL}>`,
        to: user.email,
        subject: `❌ Gym Session Cancelled: ${formatSessionTitle(session)}`,
        text: `We are sorry to inform you that the session has been cancelled.`,
      });

      sendNotificationToUser(user._id, {
        type: "alert",
        message: `Gym session cancelled: ${formatSessionTitle(session)}`
      });
    });

    await Promise.all(notifications);

    res.status(200).json({ success: true, message: "Session cancelled & users notified" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get available sessions
export const getAvailableSessions = async (req, res) => {
  try {
    const sessions = await GymSession.findAvailable();
    res.status(200).json({ success: true, count: sessions.length, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
