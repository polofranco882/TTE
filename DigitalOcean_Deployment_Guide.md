# DigitalOcean Deployment Guide - Step-by-Step

This guide outlines the process to "version" (deploy) the latest development state to your DigitalOcean production environment.

## Phase 1: Database Synchronization (COMPLETED)
The database has been initialized and synced.
- **Host:** `db-postgresql-nyc1-33885-do-user-34754065-0.m.db.ondigitalocean.com`
- **Database:** `tte`
- **Schema:** `app`

## Phase 2 & 3: Updating Code (COMPLETED)
The latest code and assets have been pushed to GitHub.
- **Branch:** `main`
- **Status:** Pushed to GitHub. DigitalOcean should start a new build automatically.

## Phase 4: Production Configuration (REQUIRED ACTION)
Final configuration requires updating your environment variables in the DigitalOcean App Platform dashboard.

**Action (Step 1):** In your DigitalOcean App Platform settings, update/add:
- `DATABASE_URL`: `postgresql://doadmin:YOUR_PASSWORD@db-postgresql-nyc1-33885-do-user-34754065-0.m.db.ondigitalocean.com:25060/tte?sslmode=require`
- `PORT`: `5000`
- `DB_SCHEMA`: `app`
- `NODE_ENV`: `production`

**Note:** You must replace `YOUR_PASSWORD` with the actual password for the `doadmin` user.

## Phase 5: Verification
1.  Check `https://tte-app-fueza.ondigitalocean.app/`
2.  Verify "Global English" banner and Spanish badge appear correctly.
3.  Ensure the 500 internal server error on `/api/settings` is resolved.

## Phase 5: Verification
1.  Check `https://tte-app-fueza.ondigitalocean.app/`
2.  Verify "Global English" banner and Spanish badge appear correctly.
3.  Check admin panel for new banner edit features.

---
**Current Task:** Perform Phase 2 & 3 (The Push).
Please let me know once you have pushed the code or if you want me to try a different git strategy.
