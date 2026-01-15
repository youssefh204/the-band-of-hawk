import express from "express";
import {getAllTrips,getTripByID,createTrip, updateTrip, deleteTrip} from "../controllers/tripController.js";
const router = express.Router();

router.post('/', createTrip);
router.put('/:id', updateTrip);
router.get('/:id', getTripByID);
router.get('/', getAllTrips);
router.delete("/:id", deleteTrip);

export default router;