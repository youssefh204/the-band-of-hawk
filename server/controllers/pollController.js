import Poll from "../models/pollModel.js";
import Vendor from "../models/VendorModel.js";
import User from "../models/userModel.js";

// 🆕 Create Poll (EventOffice/Admin only)
export const createPoll = async (req, res) => {
  try {
    const { title, vendorIds } = req.body;

    if (!title || !vendorIds?.length) {
      return res.status(400).json({ message: "Title and vendor IDs are required" });
    }

    // Validate vendor existence
    const vendors = await Vendor.find({ _id: { $in: vendorIds } });
    if (vendors.length !== vendorIds.length) {
      return res.status(404).json({ message: "One or more vendors not found" });
    }

    const newPoll = await Poll.create({
      title,
      vendors: vendorIds.map(id => ({ vendorId: id })),
      createdBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: "Poll created successfully",
      data: newPoll
    });

  } catch (err) {
    console.error("createPoll error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// 📥 Get All Active Polls (everyone can see)
export const getPolls = async (req, res) => {
  try {
    const polls = await Poll.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "vendors.vendorId",
        select: "companyName logo" // Show names + logos
      })
      .lean();

    res.status(200).json({ data: polls });
  } catch (err) {
    console.error("getPolls error:", err);
    res.status(500).json({ message: "Failed to load polls" });
  }
};


export const votePoll = async (req, res) => {
  try {
    const { pollId, vendorId } = req.body;
    const userId = req.user?.id;

    if (!pollId || !vendorId) {
      return res.status(400).json({ message: "Poll ID and Vendor ID required" });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    if (poll.voters.includes(userId)) {
      return res.status(400).json({ message: "You have already voted in this poll" });
    }

    const vendorOption = poll.vendors.find(
      (v) => v.vendorId.toString() === vendorId.toString()
    );

    if (!vendorOption) {
      return res.status(404).json({ message: "Vendor missing in poll" });
    }

    // Vote
    vendorOption.votes.push(userId);
    poll.voters.push(userId);

    await poll.save();

    return res.json({ success: true, message: "Vote registered!" });
  } catch (err) {
    console.error("votePoll error:", err);
    return res.status(500).json({ message: "Server error while voting" });
  }
};


// 🏁 Finalize Poll (only Event Office / Admin)
export const finalizePoll = async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await Poll.findById(id).populate("vendors.vendorId", "businessName");
    if (!poll) return res.status(404).json({ message: "Poll not found" });

    if (poll.isResolved) {
      return res.status(400).json({ message: "Poll is already finalized" });
    }

    // Get Vendor with most votes
    const winner = poll.vendors.reduce((max, v) =>
      v.votes > max.votes ? v : max
    );

    poll.isResolved = true;
    poll.winningVendor = winner.vendorId._id;
    await poll.save();

    return res.json({
      success: true,
      message: "Poll finalized!",
      winner: winner.vendorId.businessName
    });

  } catch (err) {
    console.error("finalizePoll error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
