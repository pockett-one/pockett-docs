-- Retry assigning SUPER_ADMIN role (since previous run might have missed the user)
UPDATE auth.users
SET raw_app_meta_data = 
  CASE 
    WHEN raw_app_meta_data IS NULL THEN '{"role": "SUPER_ADMIN"}'::jsonb
    ELSE raw_app_meta_data || '{"role": "SUPER_ADMIN"}'::jsonb
  END
WHERE email = 'deepak@pockett.io';
