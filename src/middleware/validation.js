import { ALLOWED_TENT_SIZES, ALLOWED_TENT_STATUSES, ALLOWED_RENTAL_STATUSES } from '../config/database.js';

export function validateTrekker(req, res, next) {
  const { name, email, phone } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('Name is required and cannot be empty');
  }

  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Email must be a valid email format');
  }

  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    errors.push('Phone is required');
  } else if (!/^\d{10}$/.test(phone.replace(/\s/g, ''))) {
    errors.push('Phone must be a valid 10-digit number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join('; ')
    });
  }

  // Sanitize
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.phone = phone.trim();

  next();
}

export function validateTent(req, res, next) {
  const { name, size, status } = req.body;
  const errors = [];

  if (req.method === 'POST') {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      errors.push('Tent name is required and cannot be empty');
    }
    if (!size || typeof size !== 'string' || size.trim() === '') {
      errors.push('Tent size is required');
    }
  } else if (req.method === 'PUT') {
    // For PUT, name is optional but if provided must not be empty
    if (name !== undefined && (!name || typeof name !== 'string' || name.trim() === '')) {
      errors.push('Tent name cannot be empty');
    }
  }

  if (size !== undefined) {
    if (!ALLOWED_TENT_SIZES.includes(size)) {
      return res.status(400).json({
        error: 'Invalid tent size',
        message: `Allowed tent sizes are: ${ALLOWED_TENT_SIZES.join(', ')}`,
        allowedValues: ALLOWED_TENT_SIZES
      });
    }
  }

  if (status !== undefined) {
    if (!ALLOWED_TENT_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Invalid tent status',
        message: `Allowed tent statuses are: ${ALLOWED_TENT_STATUSES.join(', ')}`,
        allowedValues: ALLOWED_TENT_STATUSES
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join('; ')
    });
  }

  if (name) req.body.name = name.trim();
  next();
}

export function validateRental(req, res, next) {
  const { trekker_id, tent_id, status } = req.body;
  const errors = [];

  if (req.method === 'POST') {
    if (!trekker_id || typeof trekker_id !== 'number') {
      errors.push('trekker_id is required and must be a number');
    }
    if (!tent_id || typeof tent_id !== 'number') {
      errors.push('tent_id is required and must be a number');
    }
  }

  if (status !== undefined) {
    if (!ALLOWED_RENTAL_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Invalid rental status',
        message: `Allowed rental statuses are: ${ALLOWED_RENTAL_STATUSES.join(', ')}`,
        allowedValues: ALLOWED_RENTAL_STATUSES
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: errors.join('; ')
    });
  }

  next();
}

export function validateSearchSize(req, res, next) {
  const { size } = req.query;

  if (!size) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Size query parameter is required'
    });
  }

  if (!ALLOWED_TENT_SIZES.includes(size)) {
    return res.status(400).json({
      error: 'Invalid tent size',
      message: `Allowed tent sizes are: ${ALLOWED_TENT_SIZES.join(', ')}`,
      allowedValues: ALLOWED_TENT_SIZES
    });
  }

  next();
}