-- Migration: Fix RFQ numbering so deleted/completed RFQs don't reuse the same code
-- The old function used per-user logic which caused same ID reuse after deletion

CREATE OR REPLACE FUNCTION get_next_request_id_safe(p_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
  v_max_id BIGINT;
  v_new_id BIGINT;
BEGIN
  -- Get the globally maximum request_id ever assigned across ALL wishlists
  SELECT COALESCE(MAX(request_id), 59999999) INTO v_max_id
  FROM wishlists
  WHERE request_id IS NOT NULL;
  
  -- Next ID is always max + 1 (globally sequential, never reuses)
  v_new_id := v_max_id + 1;
  
  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_next_request_id_safe(UUID) TO authenticated;
