import express from 'express';
import {
  createRental,
  getAllRentals,
  getRentalById,
  updateRental,
  deleteRental,
  getRentalDetails
} from '../controllers/rentalController.js';
import { validateRental } from '../middleware/validation.js';

const router = express.Router();

router.post('/', validateRental, createRental);
router.get('/', getAllRentals);
router.get('/details', getRentalDetails);
router.get('/:id', getRentalById);
router.put('/:id', validateRental, updateRental);
router.delete('/:id', deleteRental);

export default router;