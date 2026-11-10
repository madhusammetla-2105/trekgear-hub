import express from 'express';
import {
  createTent,
  getAllTents,
  getTentById,
  updateTent,
  deleteTent,
  searchTentsBySize
} from '../controllers/tentController.js';
import { validateTent, validateSearchSize } from '../middleware/validation.js';

const router = express.Router();

router.post('/', validateTent, createTent);
router.get('/', getAllTents);
router.get('/search', validateSearchSize, searchTentsBySize);
router.get('/:id', getTentById);
router.put('/:id', validateTent, updateTent);
router.delete('/:id', deleteTent);

export default router;