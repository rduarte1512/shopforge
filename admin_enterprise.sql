-- SETUP SPECIAL ADMIN ENTERPRISE ACCOUNT
-- Run this in your Supabase SQL Editor

-- 1. Create the user in Auth (Note: This is just a template, passwords must be set in the UI or via API)
-- In Supabase SQL Editor, you can't easily create auth users with passwords due to hashing.
-- The best way is to:
-- a) Go to Authentication > Users > Add User
-- b) Use email: admin@shopforge.com
-- c) After creating, run the SQL below to promote to Admin Enterprise

-- 2. Promote user to ADMIN with ENTERPRISE plan
-- Replace 'admin@shopforge.com' with the email you used
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@shopforge.com';

  IF target_user_id IS NOT NULL THEN
    -- Update or Insert profile
    INSERT INTO public.profiles (id, email, name, role, subscription_tier, subscription_status)
    VALUES (
      target_user_id,
      'admin@shopforge.com',
      'Super Admin',
      'ADMIN',
      'ENTERPRISE',
      'active'
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'ADMIN',
      subscription_tier = 'ENTERPRISE',
      subscription_status = 'active';
      
    RAISE NOTICE 'User admin@shopforge.com promoted to ADMIN ENTERPRISE';
  ELSE
    RAISE NOTICE 'User admin@shopforge.com not found. Please create it first in the Auth dashboard.';
  END IF;
END $$;
