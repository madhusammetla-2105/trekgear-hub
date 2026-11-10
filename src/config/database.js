import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../trekgear.db');
const schemaPath = path.join(__dirname, '../database/schema.sql');

let db = null;

export async function initializeDatabase() {
  if (db) return db;

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Enable foreign key constraints
  await db.exec('PRAGMA foreign_keys = ON;');

  // Read and execute schema
  const schema = readFileSync(schemaPath, 'utf-8');
  await db.exec(schema);

  console.log('Database initialized successfully');
  return db;
}

export async function getDatabase() {
  if (!db) {
    return await initializeDatabase();
  }
  return db;
}

export async function closeDatabase() {
  if (db) {
    await db.close();
    db = null;
  }
}

export const ALLOWED_TENT_SIZES = ['2-person', '4-person', '6-person'];
export const ALLOWED_TENT_STATUSES = ['available', 'rented', 'damaged'];
export const ALLOWED_RENTAL_STATUSES = ['active', 'returned', 'cancelled'];