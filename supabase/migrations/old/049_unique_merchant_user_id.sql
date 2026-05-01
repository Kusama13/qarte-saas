-- 049: Enforce one merchant per user_id
-- Fix: duplicate merchants were created because user_id had no UNIQUE constraint

-- Step 1: Delete duplicate merchants, keeping the oldest (earliest created_at) per user_id
DELETE FROM merchants
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM merchants
  ORDER BY user_id, created_at ASC
);

-- Step 2: Add UNIQUE constraint on user_id
ALTER TABLE merchants ADD CONSTRAINT merchants_user_id_unique UNIQUE (user_id);
