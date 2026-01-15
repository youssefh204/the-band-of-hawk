import express from 'express';

import {
    createWorkshop,
    updateWorkshop,
    getAllWorkshops,
    getWorkshopById,
    getWorkshopsByCreator,
    deleteWorkshop,
    approveWorkshop, 
    rejectWorkshop, 
    requestWorkshopEdits,
    getProfessorWorkshops,
    archiveWorkshop // 👈 ADDED THIS IMPORT
} from '../controllers/workshopcontroller.js';

// Import the middleware
import { authMiddleware, authorizeRoles, optionalAuth } from "../middleware/AuthMiddleware.js";

const router = express.Router();

// --- PROFESSOR DASHBOARD ---
router.get('/professor/my-workshops', authMiddleware, getProfessorWorkshops);

// --- CREATE WORKSHOP ---
router.post('/', authMiddleware, createWorkshop); 

// --- STANDARD ROUTES ---
router.put('/:id', updateWorkshop);
router.get('/:id', optionalAuth, getWorkshopById);
router.get('/', optionalAuth, getAllWorkshops);
router.get('/creator/:creator', optionalAuth, getWorkshopsByCreator);
router.delete('/:id', deleteWorkshop);

// --- EVENTS OFFICE ACTIONS ---
router.patch(
  "/:id/approve",
  authMiddleware,
  authorizeRoles("eventoffice"),
  approveWorkshop
);

router.patch(
  "/:id/reject",
  authMiddleware,
  authorizeRoles("eventoffice"),
  rejectWorkshop
);

router.patch(
  "/:id/request-edits",
  authMiddleware,
  authorizeRoles("eventoffice"),
  requestWorkshopEdits
);

// 👇 NEW ARCHIVE ROUTE
router.patch(
  "/:id/archive",
  authMiddleware,
  authorizeRoles("eventoffice"),
  archiveWorkshop
);

export default router;