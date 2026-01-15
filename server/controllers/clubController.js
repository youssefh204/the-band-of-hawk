import Club from "../models/club.js";
import User from "../models/userModel.js";


// ======================================================
// CREATE CLUB
// ======================================================
export const createClub = async (req, res) => {
  try {
    const { clubName, Genre, creationDate, Description, maxMemberNumbers } = req.body;

    const club = await Club.create({
      clubName,
      Genre,
      creationDate,
      Description,
      maxMemberNumbers,
      members: []
    });

    return res.status(201).json({
      success: true,
      message: "Club created successfully",
      club
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// DELETE CLUB
// ======================================================
export const deleteClub = async (req, res) => {
  try {
    const { clubId } = req.params;

    const club = await Club.findByIdAndDelete(clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }

    // Remove from all users
    await User.updateMany(
      { clubs: clubId },
      { $pull: { clubs: clubId } }
    );

    return res.status(200).json({
      success: true,
      message: "Club deleted successfully"
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// JOIN CLUB
// ======================================================
export const joinClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }

    // Already in club?
    if (club.members.includes(userId)) {
      return res.status(400).json({ success: false, message: "Already a member" });
    }

    // Check capacity
    if (club.members.length >= club.maxMemberNumbers) {
      return res.status(400).json({ success: false, message: "Club is full" });
    }

    // Add user to club
    await Club.findByIdAndUpdate(clubId, { $addToSet: { members: userId } });

    // Add club to user
    await User.findByIdAndUpdate(userId, { $addToSet: { clubs: clubId } });

    return res.status(200).json({
      success: true,
      message: "Joined club successfully"
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// LEAVE CLUB
// ======================================================
export const leaveClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const userId = req.user.id;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ success: false, message: "Club not found" });
    }

    // Check membership
    if (!club.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "You are not a member of this club"
      });
    }

    // Remove user from club
    await Club.findByIdAndUpdate(
      clubId,
      { $pull: { members: userId } }
    );

    // Remove club from user's list
    await User.findByIdAndUpdate(
      userId,
      { $pull: { clubs: clubId } }
    );

    return res.status(200).json({
      success: true,
      message: "Left club successfully"
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// GET ALL CLUBS
// ======================================================
export const getAllClubs = async (req, res) => {
  try {
    const clubs = await Club.find().select("-__v");

    return res.status(200).json({
      success: true,
      clubs
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// ======================================================
// GET CLUB BY ID (with populated members)
// ======================================================
export const getClubById = async (req, res) => {
  console.log("RAW PARAMS:", req.params);

  const clubId = req.params.clubId;   // FIXED

  console.log("Looking for club:", clubId);

  if (!clubId) {
    return res.status(400).json({ message: "Missing clubId in URL" });
  }

  try {
    const club = await Club.findById(clubId)
      .populate("members", "firstName lastName email")
      .populate("heads", "firstName lastName email");

    if (!club) return res.status(404).json({ message: "Club not found" });

    res.status(200).json({ success: true, club });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching club" });
  }
};
