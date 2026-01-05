-- Fix: Create app_users record for existing authenticated users
-- Run this to link auth.users to app_users table

-- First, check current auth user
-- You can get user_id from: SELECT auth.uid();

-- Example: Insert app_users record for baculijohnrobert11@gmail.com
-- Replace the user_id with the actual UUID from your auth.users table

-- Method 1: If you know your auth user_id
INSERT INTO app_users (
  user_id,
  email,
  first_name,
  last_name,
  is_active,
  created_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'baculijohnrobert11@gmail.com' LIMIT 1),
  'baculijohnrobert11@gmail.com',
  'John Robert',
  'Baculi',
  true,
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Method 2: Create app_users for ALL authenticated users that don't have a record yet
-- This is safer and will create records for all auth users missing from app_users
INSERT INTO app_users (user_id, email, first_name, last_name, is_active, created_at)
SELECT 
  au.id,
  au.email,
  SPLIT_PART(au.email, '@', 1), -- Use email prefix as first name
  'User',                         -- Default last name
  true,
  NOW()
FROM auth.users au
LEFT JOIN app_users apu ON apu.user_id = au.id
WHERE apu.id IS NULL;

-- After running, verify:
SELECT 
  au.email as auth_email,
  apu.id as app_user_id,
  apu.email as app_user_email,
  apu.first_name,
  apu.last_name,
  apu.is_active
FROM auth.users au
LEFT JOIN app_users apu ON apu.user_id = au.id;

-- You should see your user with a valid app_user_id now
