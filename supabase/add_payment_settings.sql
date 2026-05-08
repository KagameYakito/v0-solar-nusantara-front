-- Migration: Create payment_settings table for QRIS storage
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS payment_settings (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type  TEXT        NOT NULL DEFAULT 'qris',
  static_qris   TEXT,
  merchant_name TEXT,
  is_active     BOOLEAN     DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: only admin_keuangan and super_admin can read/write
ALTER TABLE payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read payment_settings" ON payment_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin_keuangan', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert payment_settings" ON payment_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin_keuangan', 'super_admin')
    )
  );

CREATE POLICY "Admins can update payment_settings" ON payment_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin_keuangan', 'super_admin')
    )
  );

-- Allow any authenticated user to read payment settings (for showing QRIS on payment)
CREATE POLICY "Authenticated users can read active payment_settings" ON payment_settings
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_active = TRUE
  );
