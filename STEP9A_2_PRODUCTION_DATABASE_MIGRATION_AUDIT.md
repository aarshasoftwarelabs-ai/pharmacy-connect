# DavaSetu STEP 9A.2 Production Database Migration Audit

## 1. Missing Tables Analysis

| Table | Migration File | Migration Status | Dependency | Safe to apply? |
| :--- | :--- | :--- | :--- | :--- |
| `customer_profiles` | `017_customer_crm_schema.sql` | Pending | `pharmacies`, `users` | Yes |
| `customer_refill_reminders` | `017_customer_crm_schema.sql` | Pending | `customer_profiles`, `medicines`, `bills` | Yes |
| `notifications` | `016_notifications.sql` | Pending | `users`, `pharmacies` | Yes |
| `permissions` | `015_staff_permissions.sql` | Pending | None | Yes |
| `prescriptions` | `017_customer_crm_schema.sql` | Pending | `customer_profiles`, `pharmacies`, `users` | Yes |
| `staff_permissions` | `015_staff_permissions.sql` | Pending | `staff_members`, `permissions` | **NO** (See below) |
| `staff_members` | `018_staff_members_correction.sql` | Pending | `pharmacies` | Yes |

## 2. Migration State Summary

- **Applied migrations:** `001` through `014` (verified by the existence of `bills`, `purchase_invoices`, etc.)
- **Pending migrations:** `015`, `016`, `017`, `018`
- **Migration runner behavior:** `backend/src/scripts/migrate.ts` executes all `.sql` files alphabetically. There is no `migrations_history` tracking table in Supabase to track which scripts have already run. It relies entirely on Postgres `IF NOT EXISTS` clauses.

## 3. Migration-History Inconsistency
There is a critical sequencing flaw between `015` and `018`:
- `015_staff_permissions.sql` attempts to create the `staff_permissions` table, which includes `staff_id INTEGER NOT NULL REFERENCES staff_members(id)`.
- However, the `staff_members` table is not created until `018_staff_members_correction.sql`.
- Because the migration runner (`migrate.ts`) executes files alphabetically and aborts on the first error (`process.exit(1)`), running the migrations right now will **CRASH** at `015` with `relation "staff_members" does not exist`, and `016`, `017`, and `018` will never be executed.

## 4. Verification of Existing Tables
- **Compatibility:** Migrations `016` and `017` use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for existing tables (`bills`, `medicine_requests`). This is perfectly safe and will not destroy or reset existing production data.
- **Constraints:** Foreign keys to existing tables (`users`, `pharmacies`, `medicines`) are correct.

## 5. Corrective Migration Required / Exact Next Action
Since we cannot edit `015_staff_permissions.sql` (to preserve history), but the automated runner will crash if we run it as-is, the **Exact Next Action** is:

**Option A (Recommended):** Rename `018_staff_members_correction.sql` to `014b_staff_members.sql` in the codebase so that the runner executes it *before* `015`.
**Option B:** Manually execute the contents of `018_staff_members_correction.sql` in the Supabase SQL Editor *before* running the `npm run migrate` command.

Both options respect the rule of not editing the contents of an already-applied migration file while resolving the foreign key dependency crash.
