# Database Migrations

## How to Apply Migrations

### Manual Method (Supabase Dashboard)

1. Go to https://app.supabase.com → Select your project → SQL Editor
2. Open the migration file from `migrations/` folder
3. Copy the entire SQL content
4. Paste into Supabase SQL Editor and click "Run"

### Automated Method (CLI)

If you have Supabase CLI installed:

```bash
supabase db push
```

## Current Migrations

### 001_add_vendor_city.sql

**Status**: Pending

**Changes**:
- Adds `city TEXT` column to `vendors` table
- Creates index on city for optimized searches

**Why**: The React components were updated to use the `city` field, but the database schema didn't have the column yet. This caused "column not found in schema cache" errors when saving vendors.

**Apply this migration by running the SQL in Supabase SQL Editor.**

Once applied, all vendor create/update/fetch operations will work correctly with the city field.
