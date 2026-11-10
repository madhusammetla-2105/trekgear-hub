import express from 'express';
import {
  createTrekker,
  getAllTrekkers,
  getTrekkerById,
  updateTrekker,
  deleteTrekker
} from '../controllers/trekkerController.js';
import { validateTrekker } from '../middleware/validation.js';

const router = express.Router();

router.post('/', validateTrekker, createTrekker);
router.get('/', getAllTrekkers);
router.get('/:id', getTrekkerById);
router.put('/:id', validateTrekker, updateTrekker);
router.delete('/:id', deleteTrekker);

export default router;