-- Migration: Create Chat System Tables for Admin-User Communication
-- Run this in the Supabase SQL Editor to enable the Chat Admin feature.
--
-- This creates tables for:
-- 1. chat_sessions: Chat sessions linked to RFQ/product requests
-- 2. chat_messages: Individual messages within sessions
-- 3. chat_assignments: Admin assignments for chat sessions (for take-over feature)
-- 4. Updates to existing tables for chat integration

-- Enable Row Level Security (RLS) for all new tables
-- This ensures users can only see their own chat data

-- 1. Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rfq_id UUID REFERENCES product_requests(id) ON DELETE CASCADE, -- Link to RFQ if exists
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Current assigned admin
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  admin_name TEXT, -- Cache admin name for display (e.g., "Joseph Joestar")
  user_name TEXT, -- Cache user name for display
  company_name TEXT -- Cache company name for display
);

-- 2. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file'))
);

-- 3. Create chat_assignments table (for take-over feature)
CREATE TABLE IF NOT EXISTS chat_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Who assigned this admin
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'completed')),
  notes TEXT -- Optional notes about the assignment
);

-- 4. Add chat_session_id to product_requests table (optional, for linking)
ALTER TABLE product_requests
  ADD COLUMN IF NOT EXISTS chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_rfq_id ON chat_sessions(rfq_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_admin_id ON chat_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON chat_sessions(last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_assignments_session_id ON chat_assignments(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_assignments_admin_id ON chat_assignments(admin_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_assignments ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies

-- Chat Sessions: Users can see their own sessions, admins can see all
CREATE POLICY "Users can view their own chat sessions" ON chat_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chat sessions" ON chat_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'admin_marketing')
    )
  );

-- Chat Messages: Users can see messages in their sessions, admins can see all
CREATE POLICY "Users can view messages in their sessions" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_sessions
      WHERE chat_sessions.id = chat_messages.session_id
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all messages" ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'admin_marketing')
    )
  );

-- Chat Assignments: Only admins can view/manage assignments
CREATE POLICY "Admins can manage chat assignments" ON chat_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'admin_marketing')
    )
  );

-- 8. Create functions for chat management

-- Function to create or get chat session for an RFQ
CREATE OR REPLACE FUNCTION create_chat_session_for_rfq(
  p_user_id UUID,
  p_rfq_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_user_name TEXT;
  v_company_name TEXT;
BEGIN
  -- Get user info
  SELECT full_name, company_name INTO v_user_name, v_company_name
  FROM profiles WHERE id = p_user_id;

  -- Check if session already exists
  SELECT id INTO v_session_id
  FROM chat_sessions
  WHERE user_id = p_user_id
    AND (rfq_id = p_rfq_id OR (rfq_id IS NULL AND p_rfq_id IS NULL));

  -- If not exists, create new session
  IF v_session_id IS NULL THEN
    INSERT INTO chat_sessions (user_id, rfq_id, user_name, company_name)
    VALUES (p_user_id, p_rfq_id, v_user_name, v_company_name)
    RETURNING id INTO v_session_id;

    -- Link the RFQ to this session
    IF p_rfq_id IS NOT NULL THEN
      UPDATE product_requests SET chat_session_id = v_session_id WHERE id = p_rfq_id;
    END IF;
  END IF;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send a message
CREATE OR REPLACE FUNCTION send_chat_message(
  p_session_id UUID,
  p_sender_id UUID,
  p_message TEXT,
  p_sender_type TEXT DEFAULT 'user'
) RETURNS UUID AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- Insert message
  INSERT INTO chat_messages (session_id, sender_id, message, sender_type)
  VALUES (p_session_id, p_sender_id, p_message, p_sender_type)
  RETURNING id INTO v_message_id;

  -- Update session last_message_at
  UPDATE chat_sessions SET
    last_message_at = NOW(),
    updated_at = NOW()
  WHERE id = p_session_id;

  -- If admin is sending, update admin_name cache
  IF p_sender_type = 'admin' THEN
    UPDATE chat_sessions SET
      admin_name = (SELECT full_name FROM profiles WHERE id = p_sender_id)
    WHERE id = p_session_id AND admin_name IS NULL;
  END IF;

  RETURN v_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign admin to chat session
CREATE OR REPLACE FUNCTION assign_chat_admin(
  p_session_id UUID,
  p_admin_id UUID,
  p_assigned_by UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  -- Update current admin
  UPDATE chat_sessions SET
    admin_id = p_admin_id,
    admin_name = (SELECT full_name FROM profiles WHERE id = p_admin_id),
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Insert assignment record
  INSERT INTO chat_assignments (session_id, admin_id, assigned_by)
  VALUES (p_session_id, p_admin_id, COALESCE(p_assigned_by, p_admin_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON chat_sessions TO authenticated;
GRANT ALL ON chat_messages TO authenticated;
GRANT ALL ON chat_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION create_chat_session_for_rfq(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_chat_message(UUID, UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_chat_admin(UUID, UUID, UUID) TO authenticated;

-- 11. Comments for documentation
COMMENT ON TABLE chat_sessions IS 'Chat sessions between users and admins, linked to RFQs';
COMMENT ON TABLE chat_messages IS 'Individual messages within chat sessions';
COMMENT ON TABLE chat_assignments IS 'Admin assignments for chat sessions (take-over feature)';
COMMENT ON FUNCTION create_chat_session_for_rfq(UUID, UUID) IS 'Creates or retrieves a chat session for a user RFQ';
COMMENT ON FUNCTION send_chat_message(UUID, UUID, TEXT, TEXT) IS 'Sends a message in a chat session';
COMMENT ON FUNCTION assign_chat_admin(UUID, UUID, UUID) IS 'Assigns an admin to handle a chat session';