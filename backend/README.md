# PharmacyConnect Backend API

This is the central backend API for the PharmacyConnect application. It serves as the single source of truth for both the User Mobile App (Flutter) and the Pharmacy PC Software (React).

> **CRITICAL ARCHITECTURE RULE:**
> User App and Pharmacy PC communicate only through this Backend API. They must NEVER communicate directly with each other.

## Tech Stack
- Node.js
- Express
- TypeScript
- PostgreSQL (via `pg`)
- Security: `cors`, `helmet`

## Requirements
- Node.js (v18 or higher recommended)
- npm
- PostgreSQL running locally or accessible remotely

## Project Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
   Ensure the `DATABASE_URL` matches your local PostgreSQL configuration.

3. **Database Setup**
   Ensure PostgreSQL is running.
   Execute the migration file located at `database/migrations/001_initial_schema.sql` on your target database.

## Scripts

- `npm run dev`: Starts the server in development mode using `tsx watch` for auto-reloading.
- `npm run build`: Compiles the TypeScript code into JavaScript in the `dist` folder.
- `npm start`: Starts the compiled production server.

## Endpoints (Current Scope)

- `GET /` - Root endpoint, returns basic API status.
- `GET /health` - Health check endpoint. Verifies database connectivity.

### Medicine Request APIs

> **Note:** Authentication and authorization are not implemented yet. IDs are read directly from the request temporarily.

#### `POST /api/medicine-requests`
- **Purpose:** Create a new medicine request.
- **Request Body:** `{ "userId": number, "pharmacyId": number, "medicineName"?: string, "imageReference"?: string }`
- **Success:** `201 Created` with the request object (initial status `WAITING`).
- **Error:** `400 Bad Request` if neither medicineName nor imageReference is provided.

#### `GET /api/medicine-requests/user/:userId`
- **Purpose:** Get all requests placed by a specific user.
- **Success:** `200 OK` with array of requests (sorted newest first).

#### `GET /api/medicine-requests/pharmacy/:pharmacyId`
- **Purpose:** Get all requests received by a specific pharmacy.
- **Query Params:** `?status=WAITING|AVAILABLE|CAN_ARRANGE|NOT_AVAILABLE` (optional)
- **Success:** `200 OK` with array of requests (sorted newest first).

#### `GET /api/medicine-requests/:requestId`
- **Purpose:** Get a specific request by its ID.
- **Success:** `200 OK` with the request object.
- **Error:** `404 Not Found` if request doesn't exist.

#### `PATCH /api/medicine-requests/:requestId/status`
- **Purpose:** Pharmacy owner responds to a request.
- **Request Body:** `{ "status": "AVAILABLE" | "CAN_ARRANGE" | "NOT_AVAILABLE", "responseMessage"?: string }`
- **Success:** `200 OK` with the updated request object.
- **Error:** `400 Bad Request` if changing a non-WAITING request or invalid status.

## Future API Architecture
The `src/routes/index.ts` file acts as a central router to easily slot in future endpoints:
- `/api/auth`
- `/api/users`
- `/api/pharmacies`
- `/api/medicine-requests`
- `/api/notifications`

*This backend currently represents Step 10 (Real Medicine Request API). Future steps will build out remaining API routes, authentication, and core business logic.*
