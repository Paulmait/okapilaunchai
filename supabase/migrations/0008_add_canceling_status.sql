-- Add 'canceling' status for subscriptions scheduled to cancel at period end
-- This is different from 'canceled' which means already terminated

-- Drop and recreate the check constraint to include 'canceling'
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('active', 'canceling', 'canceled', 'past_due', 'trialing'));

-- Add comment explaining the status values
COMMENT ON COLUMN subscriptions.status IS
  'active: subscription is active; canceling: scheduled to cancel at period end; canceled: subscription ended; past_due: payment failed; trialing: in trial period';
