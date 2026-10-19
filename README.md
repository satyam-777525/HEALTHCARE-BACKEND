# Healthcare Management Backend API

A complete, production-ready Healthcare Management Backend REST API built with Node.js, Express.js, PostgreSQL 17, and Prisma ORM.

---

## Table of Contents

1. [Project Overview & Key Features](#project-overview--key-features)
2. [Technology Stack](#technology-stack)
3. [Prerequisites](#prerequisites)
4. [Windows Installation & Setup](#windows-installation--setup)
5. [Database Setup & Migrations](#database-setup--migrations)
6. [Starting the Application](#starting-the-application)
7. [Database Schema & Relationships](#database-schema--relationships)
8. [Security & Authorization Architecture](#security--authorization-architecture)
9. [API Endpoint Documentation & Samples](#api-endpoint-documentation--samples)
   - [Health Check](#health-check)
   - [Authentication APIs](#1-authentication-apis)
   - [Patient Management APIs](#2-patient-management-apis)
   - [Doctor Management APIs](#3-doctor-management-apis)
   - [Patient–Doctor Mapping APIs](#4-patientdoctor-mapping-apis)
10. [Testing with Postman](#testing-with-postman)
11. [Automated Verification Tests](#automated-verification-tests)
12. [Project Structure](#project-structure)

---

## Project Overview & Key Features

This backend service manages patients, doctors, and patient-doctor appointments/mappings within a healthcare ecosystem with strong security and isolation guarantees:

- **JWT Authentication:** Secure user registration and login with bcryptjs password hashing (10 salt rounds).
- **Patient Isolation:** Patients are strictly private to the user account that created them. Users cannot view, modify, or delete another user's patient records.
- **Doctor Directory & Creator Ownership:** Any authenticated user can view doctor directories. However, doctor profiles can only be updated or deleted by the user who created them, preventing unauthorized modifications.
- **Patient–Doctor Mapping:** Junction relationship linking patients to doctors with duplicate assignment prevention (unique compound index) and ownership validation.
- **Robust Validation:** Request body, parameter, and query validation powered by Zod.
- **Centralized Error Handling:** Consistent JSON error envelopes, safe Prisma error translation (P2002 -> 409 Conflict, P2025 -> 404 Not Found), and 404 route handling.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (CommonJS JavaScript) |
| **Framework** | Express.js 5 |
| **Database** | PostgreSQL 17 |
| **ORM** | Prisma ORM 6.4.1 |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` |
| **Validation** | Zod 3.x / 4.x |
| **Environment** | `dotenv` |
| **CORS** | `cors` |
| **Testing** | Built-in Node test suite & Postman Collection v2.1 |

---

## Prerequisites

Before starting, ensure you have the following installed on your Windows machine:
1. **Node.js**: v18.x or newer (Verify: `node -v`)
2. **PostgreSQL 17**: Running locally on port `5432` (Verify in Windows Services: `Get-Service postgresql*`)
3. **Postman**: For API exploratory testing and automated collection runs.

---

## Windows Installation & Setup

1. **Clone or navigate to the project directory:**
   ```powershell
   cd f:\healthcare-backend
   ```

2. **Install project dependencies:**
   *(Note: On Windows PowerShell, execute using `cmd /c npm ...` or `npm.cmd` if PowerShell script execution policies restrict `.ps1` files)*
   ```powershell
   cmd /c "npm install"
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```

4. **Edit `.env` with your PostgreSQL credentials:**
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/healthcare_db?schema=public"
   JWT_SECRET="super_secret_jwt_key_replace_with_a_secure_random_string"
   JWT_EXPIRES_IN="1d"
   CORS_ORIGIN="*"
   ```

---

## Database Setup & Migrations

### 1. Create the PostgreSQL Database
Open Windows PowerShell and use `psql` to create the `healthcare_db` database:

```powershell
# Default PostgreSQL 17 bin path on Windows:
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -h localhost -p 5432 -c "CREATE DATABASE healthcare_db;"
```
*(Enter your PostgreSQL `postgres` user password when prompted).*

### 2. Run Prisma Migrations
Generate Prisma Client and push the schema directly to your PostgreSQL database:

```powershell
# Generate Prisma Client
cmd /c "npx prisma generate"

# Create and apply migration
cmd /c "npx prisma migrate dev --name init"
```
*Alternative: If you prefer applying the schema directly without creating migration files, run:*
```powershell
cmd /c "npx prisma db push"
```

---

## Starting the Application

### Development Mode (with hot-reload via nodemon):
```powershell
cmd /c "npm run dev"
```

### Production Mode:
```powershell
cmd /c "npm start"
```

The server starts on port `5000` (or `PORT` specified in `.env`).  
Health check endpoint: `http://localhost:5000/api/health`

---

## Database Schema & Relationships

### Entity Relationship Diagram

```
+------------------+         1:N         +--------------------+
|      User        | ------------------> |      Patient       |
|------------------|                     |--------------------|
| id (PK, Int)     |                     | id (PK, Int)       |
| name (String)    |                     | name (String)      |
| email (Unique)   |                     | dateOfBirth (Date) |
| password (Hash)  |                     | age (Int)          |
| createdAt        |                     | gender (String)    |
| updatedAt        |                     | contact (String)   |
+------------------+                     | address (String)   |
       | 1:N                             | createdById (FK)   |
       |                                 +--------------------+
       v                                           | 1:N
+--------------------+                             |
|      Doctor        |                             |
|--------------------|                             v
| id (PK, Int)     | 1:N                 +--------------------+
| name (String)    | ------------------> |   PatientDoctor    |
| specialization   |                     |--------------------|
| contact (String) |                     | id (PK, Int)       |
| address (String) |                     | patientId (FK)     |
| createdById (FK) |                     | doctorId (FK)      |
| createdAt        |                     | assignedAt (Date)  |
| updatedAt        |                     +--------------------+
+--------------------+                   UNIQUE(patientId, doctorId)
```

### Deletion and Constraint Rules:
- **`PatientDoctor`**: Foreign keys `patientId` and `doctorId` both have `onDelete: Cascade`. If a patient or doctor is deleted, their mapping records are automatically purged without leaving orphan rows.
- **Unique Constraint**: `@@unique([patientId, doctorId])` guarantees that the same doctor cannot be assigned to the same patient more than once.
- **Ownership Relations**: `Patient.createdById` and `Doctor.createdById` reference `User.id` with `onDelete: Cascade`.

---

## Security & Authorization Architecture

1. **Authentication Middleware (`src/middleware/auth.middleware.js`)**:
   - Inspects the `Authorization: Bearer <token>` header.
   - Decodes and verifies the signature and expiration using `jsonwebtoken`.
   - Validates that the user still exists in PostgreSQL.
   - Attaches `req.user = { id, email, name }` and `req.userId = user.id`.

2. **Patient Ownership Rule**:
   - Every patient record created is associated with `req.userId`.
   - Querying all patients (`GET /api/patients`) returns **only** records where `createdById === req.userId`.
   - Accessing (`GET /:id`), updating (`PUT /:id`), or deleting (`DELETE /:id`) checks ownership. If a record belongs to another user, `403 Forbidden` is returned. If it doesn't exist, `404 Not Found` is returned.

3. **Doctor Ownership & Authorization Rule**:
   - *Listing & Details (`GET /api/doctors`, `GET /api/doctors/:id`)*: Public to **all authenticated users**. Patients and healthcare staff need to browse doctors and specializations.
   - *Creation (`POST /api/doctors`)*: Any authenticated user can register a doctor profile. The user's ID is stored as `createdById`.
   - *Modification & Deletion (`PUT /:id`, `DELETE /:id`)*: **Only the user who created the doctor profile (the creator/owner) can modify or delete it**. If another user attempts modification or deletion, the system returns `403 Forbidden` with the message:  
     `"Forbidden. You do not have permission to modify this doctor profile because you did not create it."`

4. **Patient–Doctor Mapping Rule**:
   - A user can only assign doctors to patients **they own**.
   - If user attempts to map a doctor to a patient owned by someone else: `403 Forbidden`.
   - Duplicate assignments are rejected with `409 Conflict`.
   - Viewing mappings by patient ID or deleting mappings verifies patient ownership.

---

## API Endpoint Documentation & Samples

### Health Check

#### `GET /api/health`
Checks backend uptime and database connectivity.
- **Auth**: None
- **Response `200 OK`**:
  ```json
  {
    "status": "OK",
    "timestamp": "2026-10-19T10:45:00.000Z",
    "uptimeSeconds": 142,
    "database": "connected",
    "environment": "development"
  }
  ```

---

### 1. Authentication APIs

#### `POST /api/auth/register`
Register a new user account.
- **Auth**: None
- **Request Body**:
  ```json
  {
    "name": "Dr. Alex Carter",
    "email": "alex.carter@hospital.com",
    "password": "SecurePassword123!"
  }
  ```
- **Success Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "data": {
      "id": 1,
      "name": "Dr. Alex Carter",
      "email": "alex.carter@hospital.com",
      "createdAt": "2026-10-19T10:45:10.000Z",
      "updatedAt": "2026-10-19T10:45:10.000Z"
    }
  }
  ```
- **Error Response `409 Conflict` (Duplicate Email)**:
  ```json
  {
    "success": false,
    "message": "A user with this email address already exists."
  }
  ```

#### `POST /api/auth/login`
Authenticate user credentials and receive a JWT token.
- **Auth**: None
- **Request Body**:
  ```json
  {
    "email": "alex.carter@hospital.com",
    "password": "SecurePassword123!"
  }
  ```
- **Success Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": 1,
        "name": "Dr. Alex Carter",
        "email": "alex.carter@hospital.com"
      }
    }
  }
  ```
- **Error Response `401 Unauthorized`**:
  ```json
  {
    "success": false,
    "message": "Invalid email or password."
  }
  ```

---

### 2. Patient Management APIs

*All endpoints require header `Authorization: Bearer <token>`.*

#### `POST /api/patients`
Create a patient record.
- **Request Body (Using Age)**:
  ```json
  {
    "name": "John Doe",
    "age": 35,
    "gender": "MALE",
    "contact": "+1-555-0199",
    "address": "742 Evergreen Terrace, Springfield"
  }
  ```
- **Request Body (Using Date of Birth)**:
  ```json
  {
    "name": "Jane Smith",
    "dateOfBirth": "1992-08-24T00:00:00.000Z",
    "gender": "FEMALE",
    "contact": "+1-555-0245",
    "address": "124 Conch Street, Bikini Bottom"
  }
  ```
- **Success Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Patient created successfully.",
    "data": {
      "id": 1,
      "name": "John Doe",
      "dateOfBirth": null,
      "age": 35,
      "gender": "MALE",
      "contact": "+1-555-0199",
      "address": "742 Evergreen Terrace, Springfield",
      "createdById": 1,
      "createdAt": "2026-10-19T10:46:00.000Z",
      "updatedAt": "2026-10-19T10:46:00.000Z",
      "createdBy": {
        "id": 1,
        "name": "Dr. Alex Carter",
        "email": "alex.carter@hospital.com"
      }
    }
  }
  ```

#### `GET /api/patients`
List all patients created by the authenticated user.
- **Success Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Patients retrieved successfully.",
    "count": 1,
    "data": [
      {
        "id": 1,
        "name": "John Doe",
        "age": 35,
        "gender": "MALE",
        "contact": "+1-555-0199",
        "address": "742 Evergreen Terrace, Springfield",
        "createdById": 1,
        "createdAt": "2026-10-19T10:46:00.000Z",
        "updatedAt": "2026-10-19T10:46:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/patients/:id`
Get patient details by ID (only if owned by current user).
- **Success Response `200 OK`**: Returns full patient details including assigned doctors.
- **Error Response `403 Forbidden`** (if patient was created by someone else):
  ```json
  {
    "success": false,
    "message": "Forbidden. You do not have permission to view this patient."
  }
  ```
- **Error Response `404 Not Found`**:
  ```json
  {
    "success": false,
    "message": "Patient with ID 9999 was not found."
  }
  ```

#### `PUT /api/patients/:id`
Update an owned patient.
- **Request Body**:
  ```json
  {
    "contact": "+1-555-9988",
    "address": "742 Evergreen Terrace (Apt 4B), Springfield"
  }
  ```
- **Success Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Patient updated successfully.",
    "data": { ... }
  }
  ```

#### `DELETE /api/patients/:id`
Delete an owned patient.
- **Success Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Patient with ID 1 was deleted successfully."
  }
  ```

---

### 3. Doctor Management APIs

*All endpoints require header `Authorization: Bearer <token>`.*

#### `POST /api/doctors`
Create a new doctor profile.
- **Request Body**:
  ```json
  {
    "name": "Dr. Robert House",
    "specialization": "Diagnostic Medicine & Nephrology",
    "contact": "+1-555-0811",
    "address": "Princeton-Plainsboro Teaching Hospital, New Jersey"
  }
  ```
- **Success Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Doctor created successfully.",
    "data": {
      "id": 1,
      "name": "Dr. Robert House",
      "specialization": "Diagnostic Medicine & Nephrology",
      "contact": "+1-555-0811",
      "address": "Princeton-Plainsboro Teaching Hospital, New Jersey",
      "createdById": 1,
      "createdAt": "2026-10-19T10:47:00.000Z",
      "updatedAt": "2026-10-19T10:47:00.000Z"
    }
  }
  ```

#### `GET /api/doctors`
List all doctors in the directory.
- **Success Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Doctors retrieved successfully.",
    "count": 1,
    "data": [
      {
        "id": 1,
        "name": "Dr. Robert House",
        "specialization": "Diagnostic Medicine & Nephrology",
        "contact": "+1-555-0811",
        "address": "Princeton-Plainsboro Teaching Hospital, New Jersey",
        "createdAt": "2026-10-19T10:47:00.000Z"
      }
    ]
  }
  ```

#### `GET /api/doctors/:id`
Get doctor details by ID.
- **Success Response `200 OK`**: Returns doctor profile and list of assigned patients.

#### `PUT /api/doctors/:id`
Update doctor details (Creator only).
- **Request Body**:
  ```json
  {
    "specialization": "Infectious Disease & Nephrology"
  }
  ```
- **Success Response `200 OK`**: Returns updated doctor profile.
- **Error Response `403 Forbidden`** (if requested by non-creator user):
  ```json
  {
    "success": false,
    "message": "Forbidden. You do not have permission to modify this doctor profile because you did not create it."
  }
  ```

#### `DELETE /api/doctors/:id`
Delete doctor (Creator only).
- **Success Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Doctor with ID 1 was deleted successfully."
  }
  ```
- **Error Response `403 Forbidden`**: Returned if requested by non-creator user.

---

### 4. Patient–Doctor Mapping APIs

*All endpoints require header `Authorization: Bearer <token>`.*

#### `POST /api/mappings`
Assign a doctor to an owned patient.
- **Request Body**:
  ```json
  {
    "patientId": 1,
    "doctorId": 1
  }
  ```
- **Success Response `201 Created`**:
  ```json
  {
    "success": true,
    "message": "Doctor successfully assigned to patient.",
    "data": {
      "id": 1,
      "patientId": 1,
      "doctorId": 1,
      "assignedAt": "2026-10-19T10:48:00.000Z",
      "patient": {
        "id": 1,
        "name": "John Doe",
        "gender": "MALE",
        "contact": "+1-555-0199"
      },
      "doctor": {
        "id": 1,
        "name": "Dr. Robert House",
        "specialization": "Diagnostic Medicine & Nephrology",
        "contact": "+1-555-0811"
      }
    }
  }
  ```
- **Error Response `409 Conflict` (Duplicate Assignment)**:
  ```json
  {
    "success": false,
    "message": "Conflict. Doctor is already assigned to this patient."
  }
  ```
- **Error Response `403 Forbidden`** (if patient belongs to another user):
  ```json
  {
    "success": false,
    "message": "Forbidden. You can only assign doctors to your own patients."
  }
  ```
- **Error Response `404 Not Found`** (if doctor or patient doesn't exist):
  ```json
  {
    "success": false,
    "message": "Doctor with ID 9999 was not found."
  }
  ```

#### `GET /api/mappings`
List all mappings for the authenticated user's patients.
- **Success Response `200 OK`**: Returns list of assignments for user's patients with doctor details.

#### `GET /api/mappings/:patientId`
Return doctors assigned to a specific patient owned by the user.
- **Success Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Assigned doctors retrieved successfully.",
    "patient": {
      "id": 1,
      "name": "John Doe"
    },
    "count": 1,
    "data": [
      {
        "id": 1,
        "patientId": 1,
        "doctorId": 1,
        "assignedAt": "2026-10-19T10:48:00.000Z",
        "doctor": {
          "id": 1,
          "name": "Dr. Robert House",
          "specialization": "Diagnostic Medicine & Nephrology",
          "contact": "+1-555-0811",
          "address": "Princeton-Plainsboro Teaching Hospital, New Jersey"
        }
      }
    ]
  }
  ```

#### `DELETE /api/mappings/:id`
Remove a patient-doctor assignment.
- **Success Response `200 OK`**:
  ```json
  {
    "success": true,
    "message": "Mapping with ID 1 was deleted successfully."
  }
  ```
- **Error Response `403 Forbidden`**: Returned if the associated patient belongs to another user.

---

## Testing with Postman

A ready-to-import Postman collection is included in the project root: `postman_collection.json`.

### Step-by-Step Testing Guide:

1. **Import the Collection:**
   - In Postman, click **Import** (top-left).
   - Select or drag-and-drop `f:\healthcare-backend\postman_collection.json`.

2. **Verify Collection Variables:**
   - Click on the collection name **Healthcare Management Backend API** > **Variables** tab.
   - Verify `baseUrl` is set to `http://localhost:5000/api`.

3. **Execute Registration and Login:**
   - Open **1. Authentication > Register User 1** and click **Send** (`201 Created`).
   - Open **1. Authentication > Login User 1** and click **Send** (`200 OK`).
   - *Note:* The Test script in "Login User 1" will automatically save the returned JWT token to the `token` collection variable:
     ```javascript
     pm.collectionVariables.set("token", pm.response.json().data.token);
     ```

4. **Test Protected Endpoints:**
   - Open **2. Patients > Create Patient (with Age)** and click **Send** (`201 Created`). It will automatically store `patientId`.
   - Open **3. Doctors > Create Doctor** and click **Send** (`201 Created`). It will automatically store `doctorId`.
   - Open **4. Patient-Doctor Mappings > Assign Doctor to Patient** and click **Send** (`201 Created`).
   - Test error cases such as **Duplicate Assignment** (`409 Conflict`) and **Register Duplicate Email** (`409 Conflict`).

---

## Automated Verification Tests

An end-to-end automated integration test suite is included in `test/api-test.js`.

To run the test suite:
```powershell
cmd /c "npm test"
```

The test runner will:
- Spin up an isolated test instance of the Express server.
- Test user registration and login.
- Verify password hashing and confirm password hashes are never exposed.
- Test duplicate email rejection (409).
- Test invalid credential rejection (401).
- Test patient CRUD operations and strict user isolation (403).
- Test doctor CRUD operations and creator-only modification rule (403).
- Test patient-doctor mapping, duplicate prevention (409), and ownership enforcement.

---

## Project Structure

```
healthcare-backend/
├── prisma/
│   └── schema.prisma           # Prisma database models and relationships
├── src/
│   ├── config/
│   │   ├── db.js               # Prisma client singleton instance
│   │   └── env.js              # Centralized environment variable loader
│   ├── controllers/
│   │   ├── auth.controller.js     # User registration and login logic
│   │   ├── patient.controller.js  # Patient CRUD and user isolation
│   │   ├── doctor.controller.js   # Doctor CRUD and creator authorization
│   │   └── mapping.controller.js  # Patient-Doctor mapping operations
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT verification & user attachment
│   │   ├── error.middleware.js    # Global error & 404 handler
│   │   └── validate.middleware.js # Zod validation middleware factory
│   ├── routes/
│   │   ├── auth.routes.js         # /api/auth routes
│   │   ├── patient.routes.js      # /api/patients routes
│   │   ├── doctor.routes.js       # /api/doctors routes
│   │   ├── mapping.routes.js      # /api/mappings routes
│   │   ├── health.routes.js       # /api/health route
│   │   └── index.js               # Master router
│   ├── app.js                  # Express app setup and middleware
│   └── server.js               # HTTP server entrypoint
├── test/
│   └── api-test.js             # Automated E2E test suite
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── package.json                # Dependencies and npm scripts
├── postman_collection.json     # Full Postman v2.1 collection
└── README.md                   # Complete documentation
```
