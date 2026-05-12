-- Migration: Fix chat_messages message_type constraint
-- Run this in Supabase SQL Editor to allow 'invoice' and 'qris' message types

ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_message_type_check;

ALTER TABLE chat_messages
  ADD CONSTRAINT chat_messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'file', 'invoice', 'qris'));
