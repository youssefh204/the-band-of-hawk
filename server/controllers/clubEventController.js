import ClubEvent from "../models/clubEvent.js";
import Club from "../models/club.js";

// =============================
// CREATE EVENT (club head or admin)
// =============================
export const createEvent = async (req, res) => {
  try {
    const { eventName, Description, clubId, eventDate } = req.body;

    if (!eventName || !clubId || !eventDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const clubExists = await Club.findById(clubId);
    if (!clubExists) return res.status(404).json({ message: "Club not found" });

    const event = await ClubEvent.create({
      eventName,
      Description,
      eventDate,
      club: clubId,
      createdBy: req.user.id, // from auth middleware
      status: "pending"
    });

    res.status(201).json({
      message: "Club event created successfully",
      event
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ message: "Server error creating event" });
  }
};

// =============================
// GET ALL EVENTS (admin or public)
// =============================
export const getAllEvents = async (req, res) => {
  try {
    const events = await ClubEvent.find()
      .populate("club", "clubName Genre")
      .populate("createdBy", "firstName lastName email");

    res.status(200).json({ events });
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ message: "Server error fetching events" });
  }
};

// =============================
// GET EVENT BY ID
// =============================
export const getEventById = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await ClubEvent.findById(eventId)
      .populate("club", "clubName Genre")
      .populate("createdBy", "firstName lastName email");

    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ event });
  } catch (error) {
    console.error("Get event by ID error:", error);
    res.status(500).json({ message: "Server error loading event" });
  }
};

// =============================
// UPDATE EVENT STATUS (Admin only)
// =============================
export const updateEventStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, adminMessage } = req.body;

    if (!["pending", "accepted", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const event = await ClubEvent.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.status = status;
    if (adminMessage) event.adminMessage = adminMessage;

    await event.save();

    res.status(200).json({
      message: "Event status updated",
      event
    });
  } catch (error) {
    console.error("Update event status error:", error);
    res.status(500).json({ message: "Server error updating event" });
  }
};

// =============================
// DELETE EVENT
// =============================
export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await ClubEvent.findByIdAndDelete(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ message: "Server error deleting event" });
  }
};
