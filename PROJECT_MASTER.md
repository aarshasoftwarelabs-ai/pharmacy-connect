# PHARMACYCONNECT — PROJECT MASTER

This file is the permanent source of truth for the **PharmacyConnect** project.

## 1. Project Name
**PharmacyConnect**

## 2. Product Vision
A complete digital platform connecting Customers, Local Pharmacy Owners, and a central Backend/API infrastructure. It is not just a billing or delivery app, but a connected ecosystem where users can search medicines, upload prescriptions, order, and pharmacies can manage inventory, process orders, and bill customers.

## 3. Product Tagline
*"Your local pharmacy, always within reach."*

## 4. Three Main Components
The final system contains THREE independent applications/components inside ONE main repository:
1. **User Mobile Application**
2. **Pharmacy Owner PC Software**
3. **Backend API + Database**

## 5. Technology Stack
- **User Mobile Application**: Flutter (Android/iOS)
- **Pharmacy Owner PC Software**: React + Vite + Tailwind CSS
- **Backend API & Database**: Node.js + Express + PostgreSQL

## 6. Final Folder Structure
```text
pharmacyconnect/
│
├── user_app/
│   └── Flutter application
│
├── pharmacy_pc/
│   └── React + Vite + Tailwind application
│
├── backend/
│   └── Node.js + Express application
│
├── PROJECT_MASTER.md
└── README.md
```
*Note: These are three independent applications. Do NOT mix Flutter, React, and Backend code inside the same application.*

## 7. Communication Architecture
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
**Important**: The User App must NOT directly communicate with the Pharmacy PC. The Pharmacy PC must NOT directly communicate with the User App. All communication goes through the Backend.

## 8. User App Responsibilities
- Customer registration/login (OTP authentication)
- Pharmacy discovery & connection
- Medicine search, catalogue, details, and Cart
- Prescription upload
- Checkout, delivery address, order placement
- Order tracking, bill viewing, order confirmation
- Order history, profile, and notifications

## 9. Pharmacy PC Responsibilities
- Owner login & Pharmacy dashboard
- Order management (details, status, prescription viewing)
- Medicine management (catalogue, pricing)
- Inventory and stock management
- Billing and invoice generation
- Customer management & sales reports
- Pharmacy profile configuration

## 10. Backend Responsibilities
- Central source of truth and APIs
- Authentication (users, pharmacy accounts, verification)
- Role-based authorization
- Core data management (Medicines, Inventory, Cart, Orders, Prescriptions)
- Billing & Notifications
- Database schema and connections

## 11. Development Principles
- Keep business logic separate from UI.
- Keep API communication separate from UI.
- Use reusable components.
- Keep environment configuration separate.
- Never commit secrets.
- Work one step at a time; do not automatically start future steps.

## 12. Future Development Roadmap
**PHASE 1 - Project foundation**
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

## 13. Important Architectural Rules
1. Do not mix the three applications.
2. Do not delete working code from future steps without a valid reason.
3. Do not rebuild existing functionality unnecessarily.
4. Work one step at a time.
5. Do not automatically start future steps.
6. Keep business logic separate from UI.
7. Keep API communication separate from UI.
8. Use reusable components.
9. Keep environment configuration separate.
10. Never commit secrets.
11. Backend is the source of truth once integration begins.
12. Never rely only on frontend role restrictions for security.
13. Backend authorization must eventually enforce: Customer permissions, Pharmacy owner permissions, Admin permissions.
14. Do not introduce Firebase or MongoDB.
15. Backend database will be PostgreSQL.
16. User App will be Flutter.
17. Pharmacy PC will be React + Vite + Tailwind CSS.
18. Backend will be Node.js + Express.
