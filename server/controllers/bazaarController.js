import Bazaar from "../models/bazaarModel.js";
import QRCode from "qrcode";
import crypto from "crypto";
const isValidDate = (d)=> d && !isNaN(new Date(d).getTime());

export const createBazaar = async (req, res) => {
  try {
    console.log("Incoming bazaar data:", req.body);

    const newBazaar = new Bazaar(req.body);
    const savedBazaar = await newBazaar.save();

    console.log("Saved Bazaar:", savedBazaar);
    res.status(201).json(savedBazaar); // ✅ send response to client
  } catch (err) {
    console.error("Error creating bazaar:", err.message);
    res.status(400).json({ error: err.message }); // ✅ send error to client
  }
};
export const updateBazaar = async (req, res) =>{
    const {id} = req.params;
    const updates = req.body;
    const updated = await Bazaar.findByIdAndUpdate(id,updates, {new: true});
    if(!updated)
        return res.status(404).json({success: false, message: 'Bazaar update failed'});
    return res.json({ success: true, data: updated });
}

export const deleteBazaar = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Bazaar.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Bazaar not found" });
    res.json({ success: true, message: 'Bazaar deleted', deleted });
  } catch (err) {
    console.error('deleteBazaar error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
export const getBazaarByID = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    const bazaar = await Bazaar.findById(id);
    if (!bazaar) return res.status(404).json({ error: "Bazaar not found" });
    res.json(bazaar);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllBazaars = async (req, res) => {
  try {
    const bazaars = await Bazaar.find();
    res.json(bazaars); // Must return array
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Generate a QR code for external visitor check-in
export const generateBazaarQR = async (req, res) => {
  try {
    const { id } = req.params;
    const { visitorName = '' } = req.body || {};
    const bazaar = await Bazaar.findById(id);
    if (!bazaar) return res.status(404).json({ error: 'Bazaar not found' });

    // Only EventOffice or Admin should generate QR (route will check auth)
    const token = crypto.randomBytes(16).toString('hex');

    const frontendBase = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    const checkinUrl = `${frontendBase}/external-checkin?type=bazaar&id=${id}&token=${token}`;

    const dataUrl = await QRCode.toDataURL(checkinUrl);

    bazaar.externalTokens = bazaar.externalTokens || [];
    bazaar.externalTokens.push({ token, visitorName, createdAt: new Date(), used: false });
    await bazaar.save();

    res.json({ success: true, token, qrDataUrl: dataUrl, checkinUrl });
  } catch (err) {
    console.error('generateBazaarQR error:', err);
    res.status(500).json({ error: err.message });
  }
};
