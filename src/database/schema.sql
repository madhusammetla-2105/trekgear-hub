-- TrekGear Hub Database Schema
-- This file documents the SQL schema for reference

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Trekkers Table
CREATE TABLE IF NOT EXISTS trekkers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tents Table
CREATE TABLE IF NOT EXISTS tents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    size TEXT NOT NULL CHECK (size IN ('2-person', '4-person', '6-person')),
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'damaged')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rentals Table
CREATE TABLE IF NOT EXISTS rentals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trekker_id INTEGER NOT NULL,
    tent_id INTEGER NOT NULL,
    rental_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    return_date DATETIME NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'cancelled')),
    FOREIGN KEY (trekker_id) REFERENCES trekkers(id) ON DELETE RESTRICT,
    FOREIGN KEY (tent_id) REFERENCES tents(id) ON DELETE RESTRICT
);

-- Partial unique index to prevent double-renting (only one active rental per tent)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rentals_tent_active
ON rentals(tent_id)
WHERE status = 'active';

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rentals_trekker_id ON rentals(trekker_id);
CREATE INDEX IF NOT EXISTS idx_rentals_tent_id ON rentals(tent_id);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status);
CREATE INDEX IF NOT EXISTS idx_tents_size ON tents(size);
CREATE INDEX IF NOT EXISTS idx_tents_status ON tents(status);
CREATE INDEX IF NOT EXISTS idx_trekkers_email ON trekkers(email);