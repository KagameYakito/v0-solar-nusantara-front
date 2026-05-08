-- Migration: Allow super_admin to update other users' roles
-- Run this in Supabase SQL Editor

-- 1. RPC function to update a user's role (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION update_user_role(target_user_id UUID, new_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Verify the caller is a super_admin
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role <> 'super_admin' THEN
    RAISE EXCEPTION 'Permission denied: only super_admin can update user roles';
  END IF;

  -- Prevent demoting a super_admin via this function
  IF new_role = 'super_admin' THEN
    RAISE EXCEPTION 'Cannot assign super_admin role via this function';
  END IF;

  UPDATE profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;

-- Grant execute to authenticated users (RLS inside the function restricts to super_admin)
GRANT EXECUTE ON FUNCTION update_user_role(UUID, TEXT) TO authenticated;
