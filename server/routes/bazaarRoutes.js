import express from "express";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
import { createBazaar, getAllBazaars, getBazaarByID, updateBazaar, deleteBazaar, generateBazaarQR } from "../controllers/bazaarController.js";
import { authorizeRoles } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createBazaar);
router.post("/:id/qr", authorizeRoles("eventoffice", "admin"), generateBazaarQR);
router.get("/", getAllBazaars);
router.get("/:id", getBazaarByID);
router.put("/:id", updateBazaar);
router.delete("/:id", deleteBazaar);

export default router;
