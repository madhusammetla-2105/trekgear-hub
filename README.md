# TrekGear Hub — Trekking Equipment Rental Management System

## Project Overview

TrekGear Hub is a backend-based trekking equipment rental management system designed to manage trekkers, tents, and rental records. The system solves the problem of double-renting tents on busy weekends and provides accurate tracking of tent availability and damage status.

## Problem Statement

> "Tents are rented before each trek. We double-rent a tent on busy weekends and do not know which ones are damaged."

TrekGear Hub solves these problems:
- Prevents double-renting of tents
- Maintains accurate rental records
- Tracks tent availability and damage status
- Maintains relationships between trekkers, tents, and rentals
- Allows searching tents based on size
- Provides meaningful validation and error messages

## Features

- **Trekker Management**: Create, read, update, delete trekkers with validation
- **Tent Management**: Full CRUD for tents with strict size validation (2-person, 4-person, 6-person only)
- **Rental Management**: Create rentals with transaction safety, return/cancel rentals
- **Double-Rental Prevention**: Database-level partial unique index + application-level validation
- **JOIN Endpoint**: Retrieve rental details with trekker and tent names
- **Search Functionality**: Query parameter-based tent search by size
- **Data Integrity**: Foreign key constraints, check constraints, transactions
- **Consistent Error Handling**: Standardized JSON error responses with proper HTTP status codes

## Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | Node.js |
| Backend Framework | Express.js |
| Database | SQLite |
| Database Library | sqlite3 |
| API Testing | Postman |

## Database Schema

### Three Relational Tables

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  trekkers   │       │   rentals   │       │    tents    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ trekker_id  │       │ id (PK)     │
│ name        │       │ tent_id     │──────►│ name        │
│ email (UNQ) │       │ rental_date │       │ size        │
│ phone       │       │ return_date │       │ status      │
│ created_at  │       │ status      │       │ created_at  │
└─────────────┘       └─────────────┘       └─────────────┘
```

### Table Details

#### trekkers
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL |
| email | TEXT | UNIQUE, NOT NULL |
| phone | TEXT | NOT NULL |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### tents
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL |
| size | TEXT | NOT NULL CHECK (size IN ('2-person', '4-person', '6-person')) |
| status | TEXT | NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'damaged')) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### rentals
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| trekker_id | INTEGER | FOREIGN KEY REFERENCES trekkers(id) |
| tent_id | INTEGER | FOREIGN KEY REFERENCES tents(id) |
| rental_date | DATETIME | DEFAULT CURRENT_TIMESTAMP |
| return_date | DATETIME | NULLABLE |
| status | TEXT | NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned', 'cancelled')) |

### Key Constraints & Indexes

- **Foreign Keys**: Enforced with `PRAGMA foreign_keys = ON`
- **Partial Unique Index**: `CREATE UNIQUE INDEX idx_rentals_tent_active ON rentals(tent_id) WHERE status = 'active'`
- **Performance Indexes**: On trekker_id, tent_id, status, size, email

### Relationships

- Trekkers → Rentals: One-to-Many
- Tents → Rentals: One-to-Many
- Rentals → Trekkers: Many-to-One
- Rentals → Tents: Many-to-One

## API Endpoint Documentation

Base URL: `http://localhost:3000/api`

### Trekker Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /trekkers | Create a trekker |
| GET | /trekkers | Get all trekkers |
| GET | /trekkers/:id | Get trekker by ID |
| PUT | /trekkers/:id | Update trekker |
| DELETE | /trekkers/:id | Delete trekker (if no rental history) |

**Create Trekker Request:**
```json
POST /api/trekkers
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "9876543210"
}
```

**Response (201):**
```json
{
  "message": "Trekker created successfully",
  "trekker": {
    "id": 1,
    "name": "Rahul Sharma",
    "email": "rahul@example.com",
    "phone": "9876543210",
    "created_at": "2026-11-10T10:00:00.000Z"
  }
}
```

### Tent Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /tents | Add a new tent |
| GET | /tents | Get all tents |
| GET | /tents/:id | Get tent by ID |
| PUT | /tents/:id | Update tent |
| DELETE | /tents/:id | Delete tent (if no rental history) |
| GET | /tents/search?size=2-person | Search tents by size |

**Create Tent Request:**
```json
POST /api/tents
{
  "name": "Mountain Explorer",
  "size": "2-person"
}
```

**Response (201):**
```json
{
  "message": "Tent added successfully",
  "tent": {
    "id": 1,
    "name": "Mountain Explorer",
    "size": "2-person",
    "status": "available",
    "created_at": "2026-11-10T10:00:00.000Z"
  }
}
```

**Search Tents:**
```
GET /api/tents/search?size=4-person
```

**Response (200):**
```json
{
  "count": 1,
  "tents": [
    {
      "id": 2,
      "name": "Alpine Pro",
      "size": "4-person",
      "status": "available",
      "created_at": "2026-11-10T10:00:00.000Z"
    }
  ]
}
```

### Rental Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /rentals | Create a rental |
| GET | /rentals | Get all rentals |
| GET | /rentals/:id | Get rental by ID |
| PUT | /rentals/:id | Update rental (return/cancel) |
| DELETE | /rentals/:id | Delete rental (only cancelled) |
| GET | /rentals/details | Get rentals with trekker & tent names (JOIN) |

**Create Rental Request:**
```json
POST /api/rentals
{
  "trekker_id": 1,
  "tent_id": 1
}
```

**Response (201):**
```json
{
  "message": "Tent rented successfully",
  "rental": {
    "id": 1,
    "trekker_id": 1,
    "tent_id": 1,
    "rental_date": "2026-11-10T10:00:00.000Z",
    "return_date": null,
    "status": "active"
  }
}
```

**Return a Tent:**
```json
PUT /api/rentals/1
{
  "status": "returned"
}
```

**Cancel a Rental:**
```json
PUT /api/rentals/1
{
  "status": "cancelled"
}
```

### JOIN Endpoint (Mandatory Requirement)

```
GET /api/rentals/details
```

**Response (200):**
```json
{
  "count": 1,
  "rentals": [
    {
      "rental_id": 1,
      "trekker_id": 1,
      "trekker_name": "Rahul Sharma",
      "tent_id": 1,
      "tent_name": "Mountain Explorer",
      "tent_size": "2-person",
      "rental_date": "2026-11-10T10:00:00.000Z",
      "return_date": null,
      "status": "active"
    }
  ]
}
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input, validation errors |
| 404 | Not Found | Record doesn't exist |
| 409 | Conflict | Duplicate email, unavailable tent, double-rental attempt |
| 500 | Internal Server Error | Unexpected server errors |

## Error Response Format

```json
{
  "error": "Validation Error",
  "message": "Descriptive error message"
}
```

**Tent Size Validation Error (Special Requirement):**
```json
{
  "error": "Invalid tent size",
  "message": "Allowed tent sizes are: 2-person, 4-person, 6-person",
  "allowedValues": ["2-person", "4-person", "6-person"]
}
```

## Installation Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trekgear-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Initialize database with sample data**
   ```bash
   npm run seed
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Verify server is running**
   ```
   http://localhost:3000/api/health
   ```

## Environment Setup

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Available environment variables:
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## Postman Testing Instructions

### Import Postman Collection

1. Open Postman
2. Click **Import** → **Upload Files**
3. Select `TrekGear Hub API Testing.postman_collection.json`
4. The collection will be organized into folders:
   - Trekker APIs
   - Tent APIs
   - Rental APIs
   - Rental JOIN API
   - Validation Tests
   - Search Tests

### Mandatory Test Cases

| Test | Expected Result |
|------|----------------|
| Create trekker | 201 |
| Get all trekkers | 200 |
| Get trekker by ID | 200 |
| Update trekker | 200 |
| Create tent with 2-person | 201 |
| Create tent with 4-person | 201 |
| Create tent with 6-person | 201 |
| Create tent with Other | 400 |
| Update tent with 4-person | 200 |
| Update tent with invalid size | 400 |
| Search tents by size | 200 |
| Search using invalid size | 400 |
| Create valid rental | 201 |
| Rent already rented tent | 409 |
| Rent damaged tent | 409 |
| Rent with nonexistent trekker | 404 |
| Rent with nonexistent tent | 404 |
| Return a tent | 200 |
| Retrieve rental JOIN details | 200 |

### Special Twist Validation Tests

The three mandatory tent-size test cases:

1. **Valid Size (2-person)** → 201 Created
2. **Invalid Size (Other)** → 400 with allowed values list
3. **Valid Update (4-person)** → 200 OK

## Project Structure

```
trekgear-hub/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration & constants
│   ├── routes/
│   │   ├── trekkerRoutes.js     # Trekker API routes
│   │   ├── tentRoutes.js        # Tent API routes
│   │   └── rentalRoutes.js      # Rental API routes
│   ├── controllers/
│   │   ├── trekkerController.js # Trekker business logic
│   │   ├── tentController.js    # Tent business logic
│   │   └── rentalController.js  # Rental business logic
│   ├── middleware/
│   │   ├── validation.js        # Input validation
│   │   └── errorHandler.js      # Error handling
│   ├── database/
│   │   ├── schema.sql           # Database schema documentation
│   │   └── seed.js              # Sample data seeding
│   └── app.js                   # Express app setup
├── tests/
│   └── api.test.js              # (Postman used instead)
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── package.json                 # Project dependencies
├── server.js                    # Entry point
└── README.md                    # This file
```

## Sample Data

The seed script initializes:

**Trekkers:**
- Rahul Sharma (rahul@example.com, 9876543210)
- Priya Reddy (priya@example.com, 9876543211)
- Arjun Kumar (arjun@example.com, 9876543212)

**Tents:**
- Mountain Explorer (2-person)
- Alpine Pro (4-person)
- Summit Master (6-person)

All tents start with `available` status.

## Team Member Contributions

| Area | Responsibility |
|------|----------------|
| Server & Routes | Express setup, routing, HTTP status codes |
| Database | Three relational tables, foreign keys, SQL queries |
| REST Endpoints | CRUD functionality, JOIN endpoint |
| Validation & Search | Input validation, error messages, search |
| Twist Rule | Tent-size validation (3 test cases) |
| Postman & README | API testing, documentation |

## Final Acceptance Criteria

- [x] Express server starts successfully
- [x] All required routes work
- [x] All APIs return JSON
- [x] Correct HTTP status codes used
- [x] Errors handled consistently
- [x] Exactly three primary relational tables
- [x] Foreign key relationships work
- [x] CRUD operations work
- [x] Rental JOIN query returns correct names
- [x] Double-renting prevented
- [x] Rental transactions maintain consistency
- [x] 2-person, 4-person, 6-person accepted
- [x] Other sizes rejected with HTTP 400
- [x] Error response lists allowed values
- [x] Invalid updates rejected
- [x] Search works via query parameters
- [x] Invalid search values rejected
- [x] Postman collection contains all tests
- [x] All mandatory test cases pass
- [x] GitHub repository ready
- [x] README complete
- [x] Project runs from fresh installation
- [x] No critical errors remain

## License

MIT License - BDF Group Assignment NU-AIML2E-G06