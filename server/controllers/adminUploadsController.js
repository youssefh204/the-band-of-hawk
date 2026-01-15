import Vendor from "../models/VendorModel.js";
import Application from "../models/application.js";

export const getAllUploads = async (req, res) => {
  try {
    const uploads = [];

    const vendors = await Vendor.find().select("companyName logoUrl taxCardUrl documents");
    vendors.forEach(v => {
      if (v.logoUrl) uploads.push({
        file: v.logoUrl,
        type: "Vendor Logo",
        owner: v.companyName,
        source: "Vendor",
        createdAt: v.createdAt
      });

      if (v.taxCardUrl) uploads.push({
        file: v.taxCardUrl,
        type: "Tax Card",
        owner: v.companyName,
        source: "Vendor",
        createdAt: v.createdAt
      });

      if (v.documents?.length) {
        v.documents.forEach(doc => uploads.push({
          file: doc.url,
          type: doc.name || "Vendor Document",
          owner: v.companyName,
          source: "Vendor",
          createdAt: doc.createdAt || v.createdAt
        }));
      }
    });

    const applications = await Application.find()
      .populate("vendorId", "companyName");

    applications.forEach(a => {
      if (!a.documents?.length) return;

      a.documents.forEach(doc => uploads.push({
        file: doc.url,
        type: doc.type || "Application Document",
        owner: a.vendorId?.companyName || "Unknown Vendor",
        source: a.type?.toUpperCase() || "Application",
        createdAt: a.createdAt
      }));
    });

    uploads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: uploads.length,
      data: uploads
    });

  } catch (err) {
    console.error("Error fetching uploads:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch uploads"
    });
  }
};
