# Vendor City Field - Schema Fix

## Problem
When saving a vendor with the new `city` field, you get:
```
"Could not find the 'city' column of 'vendors' in the schema cache"
```

## Root Cause
- The React components were updated to include the `city` field
- The schema.sql file was updated 
- **But the actual Supabase database never received the migration**

## Solution

### Step 1: Open Supabase Dashboard
- Go to https://app.supabase.com
- Select your wedding-crm project

### Step 2: Run Migration
1. Click **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy and paste this SQL:

```sql
ALTER TABLE vendors ADD COLUMN city TEXT;
CREATE INDEX idx_vendors_city ON vendors(city);
```

4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify
- You should see: `Query executed successfully` with execution time
- No errors should appear

### Step 4: Test in App
- Go back to the CRM
- Open Vendors section
- Try creating or editing a vendor
- The `city` field should now work without errors

## What Changed
- ✅ `vendors` table now has `city TEXT` column
- ✅ City can be saved when creating/editing vendors
- ✅ City displays in vendor lists and details
- ✅ City is searchable via index

## Files Involved
- `supabase_schema.sql` - Already updated with city field
- `src/components/Forms.jsx` - VendorForm already has city input
- `src/components/Views.jsx` - Vendor lists/details already show city
