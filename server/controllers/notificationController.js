import Notification from '../models/NotificationModel.js';
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    console.error("getNotifications ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load notifications",
    });
  }
};

export const getNotificationsByRole = async (req, res) => {
  try {
    const role = req.params.role.toLowerCase();

    const notifications = await Notification.find({
      userRoles: { $in: [role] }
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (err) {
    console.error("getNotificationsByRole error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const createNotification = async (req, res) => {
  try {
    const { message, type, userRoles, userId, link } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }

    const notif = await Notification.create({
      message,
      type: type || "info",
      userRoles: userRoles || [],
      userId: userId || null,
      link: link || ""
    });

    // Emit to socket subscribers
    const io = req.app.get("io");
    if (io) io.emit("new-notification", notif);

    res.status(201).json({ success: true, data: notif });
  } catch (err) {
    console.error("createNotification error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// PUT /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.status(200).json({ success: true, message: "Notification marked read" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
  
};