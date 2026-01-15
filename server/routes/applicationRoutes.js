import express from 'express';
import {resetApplication, acceptApplication,rejectApplication,createApplication, createGeneralRequest, getAllApplications, getMyApplications } from '../controllers/applicationController.js';

const router = express.Router();

router.post('/', createApplication);                 // For specific bazaar applications
router.post('/general', createGeneralRequest); // For general booth requests
router.get('/my-applications', getMyApplications);
router.get('/all', getAllApplications);
router.put('/:id/accept', acceptApplication); 
router.put('/:id/reject', rejectApplication);
router.put('/:id/reset', resetApplication);

export default router;