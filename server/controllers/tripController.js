import Trip from "../models/TripModel.js";
import Notification from "../models/NotificationModel.js";


const isValidDate = (d) => d && !isNaN(new Date(d).getTime());

export const createTrip = async (req, res) => {
    try {
        console.log("Incoming Trip data: ", req.body);
        const data = req.body;
        
        // Required fields validation
        if (!data.tripName || !data.Destination || !data.startDateTime || !data.endDateTime) {
            return res.status(400).json({
                success: false,
                message: 'tripName, Destination, startDateTime and endDateTime are required.'
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

        // Price validation
        if (data.price && (isNaN(data.price) || data.price < 0)) {
            return res.status(400).json({ success: false, message: 'Price must be a positive number.' });
        }

        // Capacity validation
        if (data.capacity && (isNaN(data.capacity) || data.capacity < 0)) {
            return res.status(400).json({ success: false, message: 'Capacity must be a positive number.' });
        }

        // Normalize allowedRoles to lowercase strings
        const rawAllowed = Array.isArray(data.allowedRoles) ? data.allowedRoles : (data.allowedRoles ? [data.allowedRoles] : []);
        const allowedRoles = rawAllowed.map(r => String(r).trim()).filter(Boolean).map(r => r.toLowerCase());
        
        const newTrip = new Trip({
            tripName: data.tripName,
            Destination: data.Destination,
            startDateTime: start,
            endDateTime: end,
            price: data.price || 0, // 🆕 ADDED PRICE FIELD
            capacity: data.capacity || 0,
            currentRegistrations: data.currentRegistrations || 0,
            description: data.description || '',
            itinerary: data.itinerary || '',
            included: data.included || '',
            notIncluded: data.notIncluded || '',
            requirements: data.requirements || '',
            allowedRoles,
            status: data.status || 'active'
        });

        const savedTrip = await newTrip.save();
        console.log("Saved Trip: ", savedTrip);
        res.status(201).json({ 
            success: true, 
            message: "Trip created successfully",
            data: savedTrip 
        });
        // 🔔 Notify all allowed roles
        const io = req.app.get("io");
        if (io) {
        const notif = await Notification.create({
            message: `New Trip Added: ${savedTrip.tripName} ✈️`,
            link: `/trips/${savedTrip._id}`,
            userRoles: ["student", "staff", "ta", "professor", "eventoffice"]
        });

        io.emit("new-notification", notif);
        console.log("📢 Notification sent for new trip");
        }

    } catch (error) {
        console.error("Error creating Trip: ", error.message);
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
};

export const deleteTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTrip = await Trip.findByIdAndDelete(id);
        if (!deletedTrip) {
            return res.status(404).json({ 
                success: false, 
                message: "Trip doesn't exist" 
            });
        }
        res.status(200).json({ 
            success: true, 
            message: "Trip deleted successfully", 
            data: deletedTrip 
        });
    } catch (error) {
        console.error("Error deleting Trip:", error);
        res.status(500).json({ 
            success: false, 
            message: "Server error deleting Trip" 
        });
    }
};

export const updateTrip = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Date validation if provided
        if (updates.startDateTime && !isValidDate(updates.startDateTime)) {
            return res.status(400).json({ success: false, message: 'Invalid startDateTime.' });
        }
        if (updates.endDateTime && !isValidDate(updates.endDateTime)) {
            return res.status(400).json({ success: false, message: 'Invalid endDateTime.' });
        }
        if (updates.startDateTime && updates.endDateTime) {
            const start = new Date(updates.startDateTime);
            const end = new Date(updates.endDateTime);
            if (end <= start) {
                return res.status(400).json({ success: false, message: 'endDateTime must be after startDateTime.' });
            }
        }

        // Price validation
        if (updates.price && (isNaN(updates.price) || updates.price < 0)) {
            return res.status(400).json({ success: false, message: 'Price must be a positive number.' });
        }

        // Capacity validation
        if (updates.capacity && (isNaN(updates.capacity) || updates.capacity < 0)) {
            return res.status(400).json({ success: false, message: 'Capacity must be a positive number.' });
        }

        // Normalize allowedRoles if provided
        if (updates.allowedRoles) {
            const raw = Array.isArray(updates.allowedRoles) ? updates.allowedRoles : [updates.allowedRoles];
            updates.allowedRoles = raw.map(r => String(r).trim()).filter(Boolean).map(r => r.toLowerCase());
        }
        
        const updated = await Trip.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Trip not found"
            });
        }
        
        res.json({
            success: true,
            message: "Trip updated successfully",
            data: updated
        });
    } catch (error) {
        console.error("Error updating Trip:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getTripByID = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID format"
            });
        }
        const trip = await Trip.findById(id);
        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Trip not found"
            });
        }
        
        // Enforce allowedRoles: if trip.allowedRoles non-empty, require matching user role
        if (Array.isArray(trip.allowedRoles) && trip.allowedRoles.length > 0) {
            const reqRole = req.user?.role ? String(req.user.role).toLowerCase() : null;
            if (!reqRole || !trip.allowedRoles.map(r => r.toLowerCase()).includes(reqRole)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You are not allowed to view this trip.' 
                });
            }
        }
        
        res.json({
            success: true,
            data: trip
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Server Error retrieving Trip by ID"
        });
    }
};

export const getAllTrips = async (req, res) => {
    try {
        // Filter trips based on user role
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
            query = { 
                $or: [
                    { allowedRoles: { $exists: false } }, 
                    { allowedRoles: { $size: 0 } }
                ] 
            };
        }

        const trips = await Trip.find(query).sort({ startDateTime: 1 });
        res.json({
            success: true,
            count: trips.length,
            data: trips
        });
    } catch (error) {
        console.error("Error getting all trips:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 🆕 NEW FUNCTION: Get available trips with spots and price info
export const getAvailableTrips = async (req, res) => {
    try {
        const userRole = req.user?.role ? String(req.user.role).toLowerCase() : null;

        let query = {
            status: "active",
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

        const trips = await Trip.find(query)
            .select('tripName Destination startDateTime endDateTime price capacity currentRegistrations description')
            .sort({ startDateTime: 1 });

        res.json({
            success: true,
            count: trips.length,
            data: trips.map(t => ({
                ...t.toObject(),
                availableSpots: t.capacity - t.currentRegistrations,
                isFree: t.price === 0
            }))
        });
    } catch (error) {
        console.error('getAvailableTrips error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// 🆕 NEW FUNCTION: Get trips by status
export const getTripsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const userRole = req.user?.role ? String(req.user.role).toLowerCase() : null;

        let query = { status };
        
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

        const trips = await Trip.find(query).sort({ startDateTime: 1 });
        
        res.json({
            success: true,
            count: trips.length,
            data: trips
        });
    } catch (error) {
        console.error('getTripsByStatus error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};