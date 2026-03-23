# DigitalOcean Deployment Guide - Step-by-Step

This guide outlines the process to "version" (deploy) the latest development state to your DigitalOcean production environment.

## Phase 1: Database Synchronization (COMPLETED)
We have already performed the database initialization and data transfer.
- **Host:** `db-postgresql-nyc1-33885-do-user-34754065-0.m.db.ondigitalocean.com`
- **Database:** `tte`
- **Schema:** `app`
- **Tables & Data:** Initialized and synced with current local development state.

## Phase 2: Updating Backend Code
The backend must be updated to handle the new `badge_text` in banners and point to the `app` schema.

**Status:** Ready but blocked by GitHub branch protection.
**Next Action (Step 1):** You must run this command in your computer's terminal:
```powershell
git push origin deploy-updates:main --force
```

## Phase 3: Updating Frontend Code
The frontend must be updated to display the new banner content and use the localized values.

**Status:** Ready (same repo as backend).
**Next Action:** Triggered automatically once Phase 2 is complete.

## Phase 4: Production Configuration (DigitalOcean Dashboard)
Final configuration requires updating your environment variables in the DigitalOcean App Platform.

**Action (Step 2):** In your DigitalOcean App Platform setting, update:
- `DATABASE_URL`: `postgresql://doadmin:REDACTED_BY_GIT_PROTECTION@db-postgresql-nyc1-33885-do-user-34754065-0.m.db.ondigitalocean.com:25060/tte?sslmode=require`
- `PORT`: `5000` (ensure this matches your ingress settings)
- `DB_SCHEMA`: `app`

## Phase 5: Verification
1.  Check `https://tte-app-fueza.ondigitalocean.app/`
2.  Verify "Global English" banner and Spanish badge appear correctly.
3.  Check admin panel for new banner edit features.

---
**Current Task:** Perform Phase 2 & 3 (The Push).
Please let me know once you have pushed the code or if you want me to try a different git strategy.
