import { getDatabase, ALLOWED_RENTAL_STATUSES } from '../config/database.js';

export async function createRental(req, res) {
  const db = await getDatabase();
  const { trekker_id, tent_id } = req.body;

  // Check if trekker exists
  const trekker = await db.get('SELECT * FROM trekkers WHERE id = ?', [trekker_id]);
  if (!trekker) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Trekker not found'
    });
  }

  // Check if tent exists
  const tent = await db.get('SELECT * FROM tents WHERE id = ?', [tent_id]);
  if (!tent) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Tent not found'
    });
  }

  // Check if tent is available
  if (tent.status !== 'available') {
    return res.status(409).json({
      error: 'Conflict',
      message: `Tent is not available for rent. Current status: ${tent.status}`
    });
  }

  // Check for active rental (double-rent prevention - application level)
  const activeRental = await db.get(
    'SELECT * FROM rentals WHERE tent_id = ? AND status = ?',
    [tent_id, 'active']
  );

  if (activeRental) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Tent already has an active rental'
    });
  }

  // Use transaction for rental creation
  try {
    await db.exec('BEGIN TRANSACTION');

    // Create rental record
    const result = await db.run(
      'INSERT INTO rentals (trekker_id, tent_id, status) VALUES (?, ?, ?)',
      [trekker_id, tent_id, 'active']
    );

    // Update tent status to rented
    await db.run(
      'UPDATE tents SET status = ? WHERE id = ?',
      ['rented', tent_id]
    );

    await db.exec('COMMIT');

    const rental = await db.get('SELECT * FROM rentals WHERE id = ?', [result.lastID]);

    res.status(201).json({
      message: 'Tent rented successfully',
      rental
    });
  } catch (err) {
    await db.exec('ROLLBACK');
    throw err;
  }
}

export async function getAllRentals(req, res) {
  const db = await getDatabase();
  const rentals = await db.all('SELECT * FROM rentals ORDER BY rental_date DESC');

  res.status(200).json({
    count: rentals.length,
    rentals
  });
}

export async function getRentalById(req, res) {
  const db = await getDatabase();
  const { id } = req.params;

  const rental = await db.get('SELECT * FROM rentals WHERE id = ?', [id]);

  if (!rental) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Rental not found'
    });
  }

  res.status(200).json({ rental });
}

export async function updateRental(req, res) {
  const db = await getDatabase();
  const { id } = req.params;
  const { status, return_date } = req.body;

  const rental = await db.get('SELECT * FROM rentals WHERE id = ?', [id]);

  if (!rental) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Rental not found'
    });
  }

  // Validate status transitions
  if (status !== undefined) {
    const validTransitions = {
      active: ['returned', 'cancelled'],
      returned: [], // Cannot change from returned
      cancelled: [] // Cannot change from cancelled
    };

    if (!validTransitions[rental.status]?.includes(status)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Invalid status transition from ${rental.status} to ${status}`
      });
    }

    // Returned rentals must have return_date
    if (status === 'returned' && !return_date) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Return date is required when marking rental as returned'
      });
    }
  }

  try {
    await db.exec('BEGIN TRANSACTION');

    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (return_date !== undefined) {
      updates.push('return_date = ?');
      values.push(return_date);
    } else if (status === 'returned') {
      // Auto-set return date if not provided
      updates.push('return_date = ?');
      values.push(new Date().toISOString());
    }

    if (updates.length > 0) {
      values.push(id);
      await db.run(
        `UPDATE rentals SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    // Update tent status based on rental status
    if (status === 'returned' || status === 'cancelled') {
      // Check if tent is damaged
      const tent = await db.get('SELECT * FROM tents WHERE id = ?', [rental.tent_id]);
      if (tent && tent.status !== 'damaged') {
        await db.run(
          'UPDATE tents SET status = ? WHERE id = ?',
          ['available', rental.tent_id]
        );
      }
    }

    await db.exec('COMMIT');

    const updated = await db.get('SELECT * FROM rentals WHERE id = ?', [id]);

    res.status(200).json({
      message: 'Rental updated successfully',
      rental: updated
    });
  } catch (err) {
    await db.exec('ROLLBACK');
    throw err;
  }
}

export async function deleteRental(req, res) {
  const db = await getDatabase();
  const { id } = req.params;

  const rental = await db.get('SELECT * FROM rentals WHERE id = ?', [id]);

  if (!rental) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Rental not found'
    });
  }

  // Only allow deletion of cancelled rentals
  if (rental.status !== 'cancelled') {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Only cancelled rentals can be deleted'
    });
  }

  await db.run('DELETE FROM rentals WHERE id = ?', [id]);

  res.status(200).json({
    message: 'Rental deleted successfully'
  });
}

export async function getRentalDetails(req, res) {
  const db = await getDatabase();

  const rentals = await db.all(`
    SELECT
        rentals.id AS rental_id,
        trekkers.id AS trekker_id,
        trekkers.name AS trekker_name,
        tents.id AS tent_id,
        tents.name AS tent_name,
        tents.size AS tent_size,
        rentals.rental_date,
        rentals.return_date,
        rentals.status
    FROM rentals
    INNER JOIN trekkers
        ON rentals.trekker_id = trekkers.id
    INNER JOIN tents
        ON rentals.tent_id = tents.id
    ORDER BY rentals.rental_date DESC
  `);

  res.status(200).json({
    count: rentals.length,
    rentals
  });
}