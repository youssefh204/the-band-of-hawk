import Conference from "../models/Conference.js";
import QRCode from "qrcode";
import crypto from "crypto";
import User from "../models/userModel.js";


const validDate = (d) => d && !isNaN(new Date(d).getTime());

export const createConference = async (req, res) => {
  try {
    const b = req.body;
    if (!b.name || !b.startDateTime || !b.endDateTime) {
      return res.status(400).json({ message: "name, startDateTime, endDateTime required" });
    }
    if (!validDate(b.startDateTime) || !validDate(b.endDateTime)) {
      return res.status(400).json({ message: "Invalid dates" });
    }
    if (new Date(b.endDateTime) <= new Date(b.startDateTime)) {
      return res.status(400).json({ message: "endDateTime must be after startDateTime" });
    }

    // Normalize allowedRoles to lowercase strings
    const rawAllowed = Array.isArray(b.allowedRoles) ? b.allowedRoles : (b.allowedRoles ? [b.allowedRoles] : []);
    const allowedRoles = rawAllowed.map(r => String(r).trim()).filter(Boolean).map(r => r.toLowerCase());

    const conf = new Conference({
      ...b,
      startDateTime: new Date(b.startDateTime),
      endDateTime: new Date(b.endDateTime),
      allowedRoles
    });

    const saved = await conf.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("createConference error:", err);
    res.status(500).json({ message: err.message });
  }
};

export const unregisterFromConference = async (req, res) => {
  try {
    const { id } = req.params; // conference ID
    const userId = req.user?.id; // Same as registerForConference

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated!" });
    }

    const user = await User.findById(userId);
    const conf = await Conference.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!conf) {
      return res.status(404).json({ message: "Conference not found" });
    }

    // Check if user was registered
    const wasRegistered = user.eventRegistrations.conferences.some(
      reg => reg.confId.toString() === id.toString()
    );

    if (!wasRegistered) {
      return res.status(400).json({ message: "You are not registered for this conference" });
    }

    // Remove registration from user model
    user.eventRegistrations.conferences = user.eventRegistrations.conferences.filter(
      reg => reg.confId.toString() !== id.toString()
    );

    await user.save();

    return res.status(200).json({
      message: "Successfully unregistered from the conference",
      registered: false,
    });

  } catch (err) {
    console.error("Conference unregister error:", err);
    return res.status(500).json({ message: "Server error while unregistering" });
  }
};



export const registerForConference = async (req, res) => {
  try {
    const { id } = req.params; // conference ID
    const userId = req.user.id;

    const user = await User.findById(userId);
    const conf = await Conference.findById(id);

    if (!conf) {
      return res.status(404).json({ success: false, message: "Conference not found" });
    }

    // Check duplicate registration
    const alreadyRegistered = user.eventRegistrations.conferences.some(
      reg => reg.confId.toString() === id.toString() && reg.status === "registered"
    );

    if (alreadyRegistered) {
      return res.status(400).json({ success: false, message: "Already registered for this conference" });
    }

    // Store inside User model (persists correctly)
    user.eventRegistrations.conferences.push({
      confId: id,
      status: "registered",
      registeredAt: new Date(),
      amountPaid: 0,
    });

    // Persist changes 🔥
    await user.save();

    res.status(200).json({
      success: true,
      message: "Registered successfully",
      conference: conf,
    });

  } catch (err) {
    console.error("Conference register error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};


export const getAllConferences = async (req, res) => {
  try {
    // Filter conferences based on user role
    const userRole = req.user?.role ? String(req.user.role).toLowerCase() : null;

    let query;
    if (userRole) {
      query = {
        $or: [
          { allowedRoles: { $exists: false } },
          { allowedRoles: { $size: 0 } },
          { allowedRoles: userRole },
        ],
      };
    } else {
      query = { $or: [{ allowedRoles: { $exists: false } }, { allowedRoles: { $size: 0 } }] };
    }

    const list = await Conference.find(query).sort({ startDateTime: 1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getConferenceById = async (req, res) => {
  try {
    const conf = await Conference.findById(req.params.id);
    if (!conf) return res.status(404).json({ message: "Conference not found" });
    
    // Enforce allowedRoles: if conference.allowedRoles non-empty, require matching user role
    if (Array.isArray(conf.allowedRoles) && conf.allowedRoles.length > 0) {
      const reqRole = req.user?.role ? String(req.user.role).toLowerCase() : null;
      if (!reqRole || !conf.allowedRoles.map(r => r.toLowerCase()).includes(reqRole)) {
        return res.status(403).json({ success: false, message: 'You are not allowed to view this conference.' });
      }
    }
    
    res.json({ success: true, data: conf });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateConference = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Normalize allowedRoles if provided
    if (updates.allowedRoles) {
      const raw = Array.isArray(updates.allowedRoles) ? updates.allowedRoles : [updates.allowedRoles];
      updates.allowedRoles = raw.map(r => String(r).trim()).filter(Boolean).map(r => r.toLowerCase());
    }
    
    const updated = await Conference.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Conference not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteConference = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Conference.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Conference not found" });
    res.json({ message: "Conference deleted", deleted });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const generateConferenceQR = async (req, res) => {
  try {
    const { id } = req.params;
    const { visitorName = '' } = req.body || {};
    const conf = await Conference.findById(id);
    if (!conf) return res.status(404).json({ message: 'Conference not found' });

    const token = crypto.randomBytes(16).toString('hex');
    const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    const checkinUrl = `${frontendBase}/external-checkin?type=conference&id=${id}&token=${token}`;
    const dataUrl = await QRCode.toDataURL(checkinUrl);

    conf.externalTokens = conf.externalTokens || [];
    conf.externalTokens.push({ token, visitorName, createdAt: new Date(), used: false });
    await conf.save();

    res.json({ success: true, token, qrDataUrl: dataUrl, checkinUrl });
  } catch (err) {
    console.error('generateConferenceQR error:', err);
    res.status(500).json({ message: err.message });
  }
};
