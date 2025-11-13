# 🗄️ Database Setup - Quick Start

## You're getting the "Failed to create escrow" error because the database tables don't exist yet.

### Fix it in 2 minutes:

## Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `bsngbeiuuvlanecycweg`
3. Click "SQL Editor" in the left sidebar
4. Click "New Query"

## Step 2: Run Base Schema

Copy and paste the contents of `supabase-escrow-schema.sql` and click "Run"

This creates:
- `escrow_contracts` table
- `escrow_milestones` table  
- `escrow_actions` table

## Step 3: Run Admin Schema

Copy and paste the contents of `supabase-escrow-admin-schema.sql` and click "Run"

This creates:
- `escrow_evidence` table
- `escrow_admin_actions` table
- `escrow_disputes` table
- `escrow_admin_notes` table
- `admin_escrow_queue` view

## Step 4: Test

1. Go back to your app
2. Try creating an escrow again
3. It should work now!

---

## Alternative: Use Supabase CLI

If you have Supabase CLI installed:

```bash
# Login
supabase login

# Link project
supabase link --project-ref bsngbeiuuvlanecycweg

# Run migrations
supabase db push
```

---

## Verify Tables Exist

In Supabase dashboard:
1. Go to "Table Editor"
2. You should see:
   - escrow_contracts
   - escrow_milestones
   - escrow_actions
   - escrow_evidence
   - escrow_admin_actions
   - escrow_disputes
   - escrow_admin_notes

---

## That's it!

Once the tables are created, escrow will work perfectly. The error happens because the code tries to insert into tables that don't exist yet.
