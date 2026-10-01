# PharmacyConnect

*"Your local pharmacy, always within reach."*

## Overview
PharmacyConnect is a complete digital platform connecting customers, local pharmacy owners, and a central API infrastructure. 

**Problem it solves:** It bridges the gap between local pharmacies and their customers, allowing seamless medicine searches, prescription uploads, order placements, and pharmacy-side inventory and billing management—all in one unified ecosystem.

## Architecture & Communication
PharmacyConnect utilizes a three-application architecture:

```text
                ┌─────────────────────┐
                │      BACKEND        │
                │ Node + Express      │
                │ PostgreSQL          │
                └──────────┬──────────┘
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
      ┌──────────────┐           ┌─────────────────┐
      │  USER APP    │           │  PHARMACY PC    │
      │   Flutter    │           │ React + Vite    │
      └──────────────┘           └─────────────────┘
```
**Communication Rule:** The User App and the Pharmacy PC software NEVER communicate directly. All communication routes through the Backend.

## Technology Stack
- **User Mobile Application**: Flutter (Android/iOS)
- **Pharmacy Owner PC Software**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL

## Folder Structure
```text
pharmacyconnect/
│
├── user_app/           # User Mobile Application
├── pharmacy_pc/        # Pharmacy Owner PC Software
├── backend/            # Backend API + Database
├── PROJECT_MASTER.md   # Core project documentation and rules
└── README.md           # This file
```

## Development Roadmap
The project is built in distinct steps. We are currently in Phase 1.
- **STEP 1**: Main project structure *(Current)*
- **STEP 2**: Pharmacy PC foundation
- **STEP 3**: Pharmacy PC dashboard
- **STEP 4**: Pharmacy PC medicine catalogue
- **STEP 5**: Pharmacy PC inventory
- **STEP 6**: User App foundation
- **STEP 7**: User App medicine search + cart
- **STEP 8**: Prescription + checkout
- **STEP 9**: Backend + PostgreSQL foundation
- **STEP 10**: Backend APIs
- **STEP 11**: Connect Pharmacy PC with Backend
- **STEP 12**: Connect User App with Backend
- **STEP 13**: Complete order + billing flow
- **STEP 14**: Testing + deployment

## Current Development Stage
**Step 1 — Main Project Structure**
The main repository structure and project architecture rules are established. No feature code has been implemented yet. Please refer to [PROJECT_MASTER.md](PROJECT_MASTER.md) for complete guidelines.
