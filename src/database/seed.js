import { initializeDatabase, getDatabase, ALLOWED_TENT_SIZES, ALLOWED_TENT_STATUSES, ALLOWED_RENTAL_STATUSES } from '../config/database.js';

const sampleTrekkers = [
  { name: 'Rahul Sharma', email: 'rahul@example.com', phone: '9876543210' },
  { name: 'Priya Reddy', email: 'priya@example.com', phone: '9876543211' },
  { name: 'Arjun Kumar', email: 'arjun@example.com', phone: '9876543212' }
];

const sampleTents = [
  { name: 'Mountain Explorer', size: '2-person' },
  { name: 'Alpine Pro', size: '4-person' },
  { name: 'Summit Master', size: '6-person' }
];

async function initializeSchema(db) {
  console.log('Creating database schema...');

  // Enable foreign key constraints
  await db.exec('PRAGMA foreign_keys = ON;');

  // Trekkers Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS trekkers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tents Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      size TEXT NOT NULL CHECK (size IN ('2-person', '4-person', '6-person')),
      status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'damaged')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Rentals Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS rentals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trekker_id INTEGER NOT NULL,
      tent_id INTEGER NOT NULL,
      rental_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      return_date DATETIME NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'cancelled')),
      FOREIGN KEY (trekker_id) REFERENCES trekkers(id) ON DELETE RESTRICT,
      FOREIGN KEY (tent_id) REFERENCES tents(id) ON DELETE RESTRICT
    )
  `);

  // Partial unique index to prevent double-renting
  await db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rentals_tent_active
    ON rentals(tent_id)
    WHERE status = 'active'
  `);

  // Performance indexes
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_rentals_trekker_id ON rentals(trekker_id)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_rentals_tent_id ON rentals(tent_id)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_rentals_status ON rentals(status)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_tents_size ON tents(size)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_tents_status ON tents(status)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_trekkers_email ON trekkers(email)`);

  console.log('Schema created successfully!');
}

async function seedDatabase() {
  const db = await initializeDatabase();

  // First create schema
  await initializeSchema(db);

  console.log('Seeding database...');

  // Check if data already exists
  const existingTrekkers = await db.get('SELECT COUNT(*) as count FROM trekkers');
  const existingTents = await db.get('SELECT COUNT(*) as count FROM tents');

  if (existingTrekkers.count > 0 || existingTents.count > 0) {
    console.log('Database already contains data. Skipping seed.');
    return;
  }

  // Insert sample trekkers
  for (const trekker of sampleTrekkers) {
    await db.run(
      'INSERT INTO trekkers (name, email, phone) VALUES (?, ?, ?)',
      [trekker.name, trekker.email, trekker.phone]
    );
  }
  console.log(`Inserted ${sampleTrekkers.length} trekkers`);

  // Insert sample tents
  for (const tent of sampleTents) {
    await db.run(
      'INSERT INTO tents (name, size, status) VALUES (?, ?, ?)',
      [tent.name, tent.size, 'available']
    );
  }
  console.log(`Inserted ${sampleTents.length} tents`);

  console.log('Database seeding completed!');
}

seedDatabase().catch(console.error);