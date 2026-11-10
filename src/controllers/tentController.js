import { getDatabase, ALLOWED_TENT_SIZES, ALLOWED_TENT_STATUSES } from '../config/database.js';

export async function createTent(req, res) {
  const db = await getDatabase();
  const { name, size } = req.body;

  const result = await db.run(
    'INSERT INTO tents (name, size, status) VALUES (?, ?, ?)',
    [name, size, 'available']
  );

  const tent = await db.get('SELECT * FROM tents WHERE id = ?', [result.lastID]);

  res.status(201).json({
    message: 'Tent added successfully',
    tent
  });
}

export async function getAllTents(req, res) {
  const db = await getDatabase();
  const tents = await db.all('SELECT * FROM tents ORDER BY created_at DESC');

  res.status(200).json({
    count: tents.length,
    tents
  });
}

export async function getTentById(req, res) {
  const db = await getDatabase();
  const { id } = req.params;

  const tent = await db.get('SELECT * FROM tents WHERE id = ?', [id]);

  if (!tent) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Tent not found'
    });
  }

  res.status(200).json({ tent });
}

export async function updateTent(req, res) {
  const db = await getDatabase();
  const { id } = req.params;
  const { name, size, status } = req.body;

  const tent = await db.get('SELECT * FROM tents WHERE id = ?', [id]);

  if (!tent) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Tent not found'
    });
  }

  // Check if tent has active rental and prevent invalid status changes
  if (tent.status === 'rented') {
    const activeRental = await db.get(
      'SELECT * FROM rentals WHERE tent_id = ? AND status = ?',
      [id, 'active']
    );

    if (activeRental) {
      // Cannot change status to available or damaged while rented
      if (status && (status === 'available' || status === 'damaged')) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cannot change status of a tent with active rental. Resolve the rental first.'
        });
      }

      // Cannot change size while rented
      if (size && size !== tent.size) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Cannot change size of a tent with active rental'
        });
      }
    }
  }

  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (size !== undefined) {
    updates.push('size = ?');
    values.push(size);
  }
  if (status !== undefined) {
    updates.push('status = ?');
    values.push(status);
  }

  if (updates.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'No fields to update'
    });
  }

  values.push(id);

  await db.run(
    `UPDATE tents SET ${updates.join(', ')} WHERE id = ?`,
    values
  );

  const updated = await db.get('SELECT * FROM tents WHERE id = ?', [id]);

  res.status(200).json({
    message: 'Tent updated successfully',
    tent: updated
  });
}

export async function deleteTent(req, res) {
  const db = await getDatabase();
  const { id } = req.params;

  const tent = await db.get('SELECT * FROM tents WHERE id = ?', [id]);

  if (!tent) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Tent not found'
    });
  }

  // Check if tent has active rental
  const activeRental = await db.get(
    'SELECT * FROM rentals WHERE tent_id = ? AND status = ?',
    [id, 'active']
  );

  if (activeRental) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Cannot delete tent with active rental'
    });
  }

  // Check if tent has any rental history
  const rentalCount = await db.get('SELECT COUNT(*) as count FROM rentals WHERE tent_id = ?', [id]);

  if (rentalCount.count > 0) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Cannot delete tent with rental history'
    });
  }

  await db.run('DELETE FROM tents WHERE id = ?', [id]);

  res.status(200).json({
    message: 'Tent deleted successfully'
  });
}

export async function searchTentsBySize(req, res) {
  const db = await getDatabase();
  const { size } = req.query;

  const tents = await db.all(
    'SELECT * FROM tents WHERE size = ? ORDER BY created_at DESC',
    [size]
  );

  res.status(200).json({
    count: tents.length,
    tents
  });
}