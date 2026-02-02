-- Migration: Admin Password Rotation Policy (6 months)
-- This migration adds password rotation tracking for admin accounts

-- Add password rotation columns to admin_users table
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '6 months'),
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS password_rotation_reminder_sent BOOLEAN DEFAULT FALSE;

-- Create index for efficient password expiry checks
CREATE INDEX IF NOT EXISTS idx_admin_users_password_expires
ON admin_users(password_expires_at)
WHERE revoked_at IS NULL;

-- Function to check if admin password is expired or expiring soon
CREATE OR REPLACE FUNCTION check_admin_password_status(admin_user_id UUID)
RETURNS TABLE (
  is_expired BOOLEAN,
  days_until_expiry INTEGER,
  needs_rotation BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (password_expires_at < NOW()) AS is_expired,
    EXTRACT(DAY FROM (password_expires_at - NOW()))::INTEGER AS days_until_expiry,
    (password_expires_at < NOW() OR force_password_change = true) AS needs_rotation
  FROM admin_users
  WHERE id = admin_user_id AND revoked_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update password and reset rotation timer
CREATE OR REPLACE FUNCTION admin_password_changed(admin_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE admin_users
  SET
    password_changed_at = NOW(),
    password_expires_at = NOW() + INTERVAL '6 months',
    force_password_change = FALSE,
    password_rotation_reminder_sent = FALSE
  WHERE id = admin_user_id;

  -- Log the password change (get user_id from admin_users)
  INSERT INTO admin_audit_log (admin_id, action, metadata)
  SELECT user_id, 'password_changed', jsonb_build_object('rotated_at', NOW(), 'next_rotation', NOW() + INTERVAL '6 months')
  FROM admin_users WHERE id = admin_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to force password rotation for an admin
CREATE OR REPLACE FUNCTION force_admin_password_rotation(admin_user_id UUID, reason TEXT DEFAULT 'security_policy')
RETURNS VOID AS $$
BEGIN
  UPDATE admin_users
  SET force_password_change = TRUE
  WHERE id = admin_user_id;

  -- Log the forced rotation (get user_id from admin_users)
  INSERT INTO admin_audit_log (admin_id, action, metadata)
  SELECT user_id, 'force_password_rotation', jsonb_build_object('reason', reason, 'forced_at', NOW())
  FROM admin_users WHERE id = admin_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all admins with expiring passwords (within 14 days)
CREATE OR REPLACE FUNCTION get_admins_with_expiring_passwords()
RETURNS TABLE (
  id UUID,
  email TEXT,
  days_until_expiry INTEGER,
  reminder_sent BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    au.id,
    au.email,
    EXTRACT(DAY FROM (au.password_expires_at - NOW()))::INTEGER AS days_until_expiry,
    au.password_rotation_reminder_sent
  FROM admin_users au
  WHERE
    au.revoked_at IS NULL
    AND au.password_expires_at <= NOW() + INTERVAL '14 days'
    AND au.password_expires_at > NOW()
  ORDER BY au.password_expires_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark reminder as sent
CREATE OR REPLACE FUNCTION mark_password_reminder_sent(admin_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE admin_users
  SET password_rotation_reminder_sent = TRUE
  WHERE id = admin_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for admin password status dashboard
CREATE OR REPLACE VIEW admin_password_status AS
SELECT
  id,
  email,
  role,
  password_changed_at,
  password_expires_at,
  CASE
    WHEN password_expires_at < NOW() THEN 'EXPIRED'
    WHEN password_expires_at < NOW() + INTERVAL '7 days' THEN 'EXPIRING_SOON'
    WHEN password_expires_at < NOW() + INTERVAL '14 days' THEN 'EXPIRING'
    ELSE 'OK'
  END AS status,
  EXTRACT(DAY FROM (password_expires_at - NOW()))::INTEGER AS days_remaining,
  force_password_change
FROM admin_users
WHERE revoked_at IS NULL;

-- Create admin password history table to prevent password reuse
CREATE TABLE IF NOT EXISTS admin_password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient password history lookups
CREATE INDEX IF NOT EXISTS idx_admin_password_history_user
ON admin_password_history(admin_user_id, created_at DESC);

-- Keep only last 5 password hashes per admin
CREATE OR REPLACE FUNCTION cleanup_old_password_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM admin_password_history
  WHERE admin_user_id = NEW.admin_user_id
  AND id NOT IN (
    SELECT id FROM admin_password_history
    WHERE admin_user_id = NEW.admin_user_id
    ORDER BY created_at DESC
    LIMIT 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to cleanup old password history
DROP TRIGGER IF EXISTS cleanup_password_history_trigger ON admin_password_history;
CREATE TRIGGER cleanup_password_history_trigger
AFTER INSERT ON admin_password_history
FOR EACH ROW
EXECUTE FUNCTION cleanup_old_password_history();

-- Grant permissions
GRANT SELECT ON admin_password_status TO authenticated;
GRANT EXECUTE ON FUNCTION check_admin_password_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_password_changed(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION force_admin_password_rotation(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admins_with_expiring_passwords() TO authenticated;
GRANT EXECUTE ON FUNCTION mark_password_reminder_sent(UUID) TO authenticated;

COMMENT ON TABLE admin_password_history IS 'Stores hashed passwords to prevent reuse - keeps last 5';
COMMENT ON COLUMN admin_users.password_expires_at IS 'Password must be changed before this date (6 month rotation)';
COMMENT ON COLUMN admin_users.force_password_change IS 'If true, admin must change password on next login';
