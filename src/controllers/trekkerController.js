import { getDatabase } from '../config/database.js';

export async function createTrekker(req, res) {
  const db = await getDatabase();
  const { name, email, phone } = req.body;

  try {
    const result = await db.run(
      'INSERT INTO trekkers (name, email, phone) VALUES (?, ?, ?)',
      [name, email, phone]
    );

    const trekker = await db.get('SELECT * FROM trekkers WHERE id = ?', [result.lastID]);

    res.status(201).json({
      message: 'Trekker created successfully',
      trekker
    });
  } catch (err) {
    err.status = 409;
    throw err;
  }
}

export async function getAllTrekkers(req, res) {
  const db = await getDatabase();
  const trekkers = await db.all('SELECT * FROM trekkers ORDER BY created_at DESC');

  res.status(200).json({
    count: trekkers.length,
    trekkers
  });
}

export async function getTrekkerById(req, res) {
  const db = await getDatabase();
  const { id } = req.params;

  const trekker = await db.get('SELECT * FROM trekkers WHERE id = ?', [id]);

  if (!trekker) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Trekker not found'
    });
  }

  res.status(200).json({ trekker });
}

export async function updateTrekker(req, res) {
  const db = await getDatabase();
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const trekker = await db.get('SELECT * FROM trekkers WHERE id = ?', [id]);

  if (!trekker) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Trekker not found'
    });
  }

  try {
    await db.run(
      'UPDATE trekkers SET name = ?, email = ?, phone = ? WHERE id = ?',
      [name || trekker.name, email || trekker.email, phone || trekker.phone, id]
    );

    const updated = await db.get('SELECT * FROM trekkers WHERE id = ?', [id]);

    res.status(200).json({
      message: 'Trekker updated successfully',
      trekker: updated
    });
  } catch (err) {
    err.status = 409;
    throw err;
  }
}

export async function deleteTrekker(req, res) {
  const db = await getDatabase();
  const { id } = req.params;

  const trekker = await db.get('SELECT * FROM trekkers WHERE id = ?', [id]);

  if (!trekker) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Trekker not found'
    });
  }

  // Check if trekker has rental history
  const rentalCount = await db.get('SELECT COUNT(*) as count FROM rentals WHERE trekker_id = ?', [id]);

  if (rentalCount.count > 0) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Cannot delete trekker with rental history'
    });
  }

  await db.run('DELETE FROM trekkers WHERE id = ?', [id]);

  res.status(200).json({
    message: 'Trekker deleted successfully'
  });
}