import Workshop from '../models/Workshop.js';
import Notification from '../models/NotificationModel.js'; 
import User from '../models/userModel.js'; // Needed to find "EventsOffice" users

// Helper: basic date sanity checks
const isValidDate = (d) => d && !isNaN(new Date(d).getTime());

export const approveWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const w = await Workshop.findById(id);
    if (!w) return res.status(404).json({ success: false, message: "Workshop not found" });

    w.status = "approved";
    w.published = true;
    w.reviewNote = req.body?.note || "";
    await w.save();
    await Notification.create({
      userId: w.createdBy,
      message: `✅ Your workshop "${w.workshopName}" has been APPROVED.`,
      type: 'success'
    });

    res.status(200).json({ success: true, message: "Workshop approved & published", data: w });
  } catch (err) {
    console.error("approveWorkshop error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const w = await Workshop.findById(id);
    if (!w) return res.status(404).json({ success: false, message: "Workshop not found" });

    w.status = "rejected";
    w.published = false;
    w.reviewNote = req.body?.note || "";
    await w.save();
    await Notification.create({
      userId: w.createdBy,
      message: `❌ Your workshop "${w.workshopName}" has been REJECTED.`,
      type: 'warning'
    });

    res.status(200).json({ success: true, message: "Workshop rejected", data: w });
  } catch (err) {
    console.error("rejectWorkshop error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const requestWorkshopEdits = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body || {};
    const w = await Workshop.findById(id);
    if (!w) return res.status(404).json({ success: false, message: "Workshop not found" });

    w.status = "needs-edits";
    w.published = false;
    w.reviewNote = note || "Please revise the workshop details.";
    await w.save();
    await Notification.create({
      userId: w.createdBy,
      message: `📝 Edits requested for "${w.workshopName}": ${w.reviewNote}`,
      type: 'info'
    });

    res.status(200).json({ success: true, message: "Edit request recorded", data: w });
  } catch (err) {
    console.error("requestWorkshopEdits error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createWorkshop = async (req, res) => {
  try {
    const data = req.body;

    // Required fields
    if (!data.workshopName || !data.startDateTime || !data.endDateTime || !data.createdBy) {
      return res.status(400).json({
        success: false,
        message: 'workshopName, startDateTime, endDateTime and createdBy are required.',
      });
    }

    // Date validation
    if (!isValidDate(data.startDateTime) || !isValidDate(data.endDateTime)) {
      return res.status(400).json({ success: false, message: 'Invalid start/end datetime.' });
    }
    const start = new Date(data.startDateTime);
    const end = new Date(data.endDateTime);
    if (end <= start) {
      return res.status(400).json({ success: false, message: 'endDateTime must be after startDateTime.' });
    }

    if (data.registrationDeadline && !isValidDate(data.registrationDeadline)) {
      return res.status(400).json({ success: false, message: 'Invalid registrationDeadline.' });
    }

    // 🆕 IMPROVED PRICE VALIDATION - Handle string prices from frontend
    let priceValue = 0;
    if (data.price !== undefined && data.price !== null && data.price !== '') {
      priceValue = parseFloat(data.price);
      if (isNaN(priceValue) || priceValue < 0) {
        return res.status(400).json({ success: false, message: 'Price must be a valid positive number.' });
      }
    }

    // normalize allowedRoles to lowercase strings
    const rawAllowed = Array.isArray(data.allowedRoles) ? data.allowedRoles : (data.allowedRoles ? [data.allowedRoles] : []);
    const allowedRoles = rawAllowed.map(r => String(r).trim()).filter(Boolean).map(r => r.toLowerCase());

    const workshop = new Workshop({
      workshopName: data.workshopName,
      location: data.location,
      startDateTime: start,
      endDateTime: end,
      shortDescription: data.shortDescription,
      fullAgenda: data.fullAgenda,
      faculty: data.faculty,
      professors: Array.isArray(data.professors) ? data.professors : (data.professors ? [data.professors] : []),
      budget: data.budget || 0,
      price: priceValue, // 🆕 USE VALIDATED PRICE
      fundingSource: data.fundingSource || 'self-funded',
      extraResources: data.extraResources,
      capacity: data.capacity || 0,
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
      createdBy: data.createdBy,
      allowedRoles,
    });

    const saved = await workshop.save();

    // --- START NOTIFICATION LOGIC (Task 39) ---
    // Notify Events Office admins
    const admins = await User.find({ role: 'EventsOffice' }); // Check if your role is 'EventsOffice' or 'admin'
    
    if (admins.length > 0) {
      const notifications = admins.map(admin => ({
        userId: admin._id,
        message: `📢 New Workshop Request: "${saved.workshopName}"`, // We use 'saved' variable from your code
        type: 'info'
      }));
      await Notification.insertMany(notifications);
    }
    // --- END NOTIFICATION LOGIC ---
    
    // 🆕 DEBUG LOG
    console.log('✅ Created workshop with price:', saved.price);
    
    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    console.error('createWorkshop error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If dates provided, validate them
    if (updates.startDateTime && !isValidDate(updates.startDateTime)) {
      return res.status(400).json({ success: false, message: 'Invalid startDateTime.' });
    }
    if (updates.endDateTime && !isValidDate(updates.endDateTime)) {
      return res.status(400).json({ success: false, message: 'Invalid endDateTime.' });
    }
    if (updates.startDateTime && updates.endDateTime) {
      if (new Date(updates.endDateTime) <= new Date(updates.startDateTime)) {
        return res.status(400).json({ success: false, message: 'endDateTime must be after startDateTime.' });
      }
    }

    // 🆕 IMPROVED PRICE VALIDATION
    if (updates.price !== undefined && updates.price !== null && updates.price !== '') {
      const priceValue = parseFloat(updates.price);
      if (isNaN(priceValue) || priceValue < 0) {
        return res.status(400).json({ success: false, message: 'Price must be a valid positive number.' });
      }
      updates.price = priceValue;
    }

    // Convert professors to array if single string sent
    if (updates.professors && !Array.isArray(updates.professors)) {
      updates.professors = [updates.professors];
    }

    // Normalize allowedRoles if provided
    if (updates.allowedRoles) {
      const raw = Array.isArray(updates.allowedRoles) ? updates.allowedRoles : [updates.allowedRoles];
      updates.allowedRoles = raw.map(r => String(r).trim()).filter(Boolean).map(r => r.toLowerCase());
    }

    if(updates.fundingSource === undefined){
      delete updates.fundingSource;
    }


    const updated = await Workshop.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Workshop not found.' });

    // 🆕 DEBUG LOG
    console.log('✅ Updated workshop with price:', updated.price);
    
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('updateWorkshop error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getWorkshopById = async (req, res) => {
  try {
    const { id } = req.params;
    const workshop = await Workshop.findById(id);
    if (!workshop) {
      return res.status(404).json({ success: false, message: 'Workshop not found.' });
    }
    // Enforce allowedRoles: if workshop.allowedRoles non-empty, require matching user role
    if (Array.isArray(workshop.allowedRoles) && workshop.allowedRoles.length > 0) {
      const reqRole = req.user?.role ? String(req.user.role).toLowerCase() : null;
      if (!reqRole || !workshop.allowedRoles.map(r => r.toLowerCase()).includes(reqRole)) {
        return res.status(403).json({ success: false, message: 'You are not allowed to view this workshop.' });
      }
    }
    res.json({ success: true, data: workshop });
  } catch (err) {
    console.error('getWorkshopById error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getWorkshopsByCreator = async (req, res) => {
  try {
    const { creator } = req.params; // creator is a string (name or email)
    const workshops = await Workshop.find({ createdBy: creator }).sort({ startDateTime: 1 });
    res.json({ success: true, count: workshops.length, data: workshops });
  } catch (err) {
    console.error('getWorkshopsByCreator error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllWorkshops = async (req, res) => {
  try {
    // If requester is authenticated, return workshops that are public (allowedRoles empty)
    // or include the user's role. If unauthenticated, only return public workshops.
    const userRole = req.user?.role ? String(req.user.role).toLowerCase() : null;

    console.log('[debug] getAllWorkshops - req.user:', req.user);

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

    const workshops = await Workshop.find(query).sort({ startDateTime: 1 });
    
    // 🆕 DEBUG LOG - Check if workshops have price
    console.log('[debug] getAllWorkshops - found:', workshops.length);
    if (workshops.length > 0) {
      console.log('[debug] First workshop price:', workshops[0].price);
      console.log('[debug] Workshop data sample:', {
        name: workshops[0].workshopName,
        price: workshops[0].price,
        hasPrice: workshops[0].price !== undefined
      });
    }
    
    res.json({ success: true, count: workshops.length, data: workshops });
  } catch (err) {
    console.error('getAllWorkshops error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedWorkshop = await Workshop.findByIdAndDelete(id);
    if (!deletedWorkshop) {
      return res.status(404).json({ success: false, message: "Workshop doesn't exist" });
    }
    res.status(200).json({ success: true, message: "Workshop deleted successfully", data: deletedWorkshop });
  } catch (err) {
    console.error('delete error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get workshops with available spots and price info
export const getAvailableWorkshops = async (req, res) => {
  try {
    const userRole = req.user?.role ? String(req.user.role).toLowerCase() : null;

    let query = {
      status: "approved",
      published: true,
      $expr: { $lt: ["$currentRegistrations", "$capacity"] } // Available spots
    };

    // Apply role-based filtering
    if (userRole) {
      query.$or = [
        { allowedRoles: { $exists: false } },
        { allowedRoles: { $size: 0 } },
        { allowedRoles: userRole },
      ];
    } else {
      query.$or = [
        { allowedRoles: { $exists: false } },
        { allowedRoles: { $size: 0 } }
      ];
    }

    const workshops = await Workshop.find(query)
      .select('workshopName location startDateTime endDateTime price capacity currentRegistrations shortDescription faculty')
      .sort({ startDateTime: 1 });

    res.json({
      success: true,
      count: workshops.length,
      data: workshops.map(w => ({
        ...w.toObject(),
        availableSpots: w.capacity - w.currentRegistrations,
        isFree: w.price === 0
      }))
    });
  } catch (err) {
    console.error('getAvailableWorkshops error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get paid workshops for a user
export const getUserPaidWorkshops = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // This would typically join with Payment model
    // For now, return workshops where user is registered
    const userWorkshops = await Workshop.find({
      'registeredUsers.userId': userId,
      'registeredUsers.status': { $in: ['registered', 'attended'] }
    }).populate('registeredUsers.userId', 'firstName lastName email');

    res.json({
      success: true,
      count: userWorkshops.length,
      data: userWorkshops
    });
  } catch (err) {
    console.error('getUserPaidWorkshops error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
  
};
export const archiveWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 1. Find the workshop first (don't update yet)
    const workshop = await Workshop.findById(id);
    
    if (!workshop) {
      return res.status(404).json({ success: false, message: "Workshop not found" });
    }

    // 2. Check if the event has actually ended
    const now = new Date();
    const endDate = new Date(workshop.endDateTime);

    if (endDate > now) {
      // ❌ Error: Event is in the future
      return res.status(400).json({ 
        success: false, 
        message: "Cannot archive an active or upcoming workshop." 
      });
    }

    // 3. If date passed, proceed to archive
    workshop.status = 'archived';
    await workshop.save();

    res.status(200).json({ success: true, message: "Workshop archived successfully", data: workshop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// --- NEW FUNCTION FOR PROFESSOR DASHBOARD ---
export const getProfessorWorkshops = async (req, res) => {
  try {
    const currentUserId = req.user._id || req.user.id; 

    // Find workshops created by this user
    const workshops = await Workshop.find({ createdBy: currentUserId })
                                    .sort({ createdAt: -1 });

    const currentDate = new Date();
    const activeWorkshops = [];
    const archivedWorkshops = [];

    workshops.forEach(ws => {
      const doc = ws.toObject();
      // Calculate remaining spots
      doc.remainingSpots = Math.max(0, doc.capacity - doc.currentRegistrations);

      // Task 47: Archive logic
      if (new Date(doc.endDateTime) < currentDate) {
        archivedWorkshops.push(doc);
      } else {
        activeWorkshops.push(doc);
      }
    });

    res.status(200).json({ 
      success: true, 
      active: activeWorkshops, 
      archived: archivedWorkshops 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};