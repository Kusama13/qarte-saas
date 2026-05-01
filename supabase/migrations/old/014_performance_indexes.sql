-- Performance Indexes Migration
-- Optimizes queries for high-traffic scenarios
-- Run this migration in your Supabase SQL Editor

-- ============================================
-- VISITS TABLE - Stats & Analytics Optimization
-- ============================================

-- Composite index for merchant stats dashboard (date range queries)
-- Covers: SELECT COUNT(*) FROM visits WHERE merchant_id = X AND visited_at BETWEEN Y AND Z
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visits_merchant_date_stats
ON visits(merchant_id, visited_at DESC);

-- Composite index for status-filtered queries (moderation dashboard)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visits_merchant_status_date
ON visits(merchant_id, status, visited_at DESC);

-- Partial index for confirmed visits only (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visits_confirmed_merchant
ON visits(merchant_id, visited_at DESC)
WHERE status = 'confirmed';

-- BRIN index for time-series data (very efficient for large tables)
-- Use this for queries like "visits in the last 30 days"
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visits_visited_at_brin
ON visits USING BRIN(visited_at);

-- ============================================
-- PUSH_SUBSCRIPTIONS TABLE
-- ============================================

-- Composite index for subscriber lookups by customer and merchant
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_subs_customer_merchant
ON push_subscriptions(customer_id, merchant_id);

-- Index for merchant-wide broadcasts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_subs_merchant
ON push_subscriptions(merchant_id);

-- ============================================
-- LOYALTY_CARDS TABLE
-- ============================================

-- Composite index for active card searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loyalty_cards_merchant_customer
ON loyalty_cards(merchant_id, customer_id);

-- Index for recent activity (cards with recent visits)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_loyalty_cards_last_visit
ON loyalty_cards(merchant_id, last_visit_date DESC NULLS LAST);

-- ============================================
-- MEMBER_CARDS TABLE (if exists)
-- ============================================

-- Index for program membership queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_member_cards_program
ON member_cards(program_id, valid_until DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_member_cards_customer
ON member_cards(customer_id);

-- ============================================
-- PUSH_HISTORY TABLE
-- ============================================

-- Composite for merchant history with date filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_push_history_merchant_date
ON push_history(merchant_id, created_at DESC);

-- ============================================
-- ANALYZE TABLES
-- ============================================

-- Update statistics for query planner
ANALYZE visits;
ANALYZE loyalty_cards;
ANALYZE push_subscriptions;
ANALYZE push_history;

-- ============================================
-- NOTES
-- ============================================

-- CONCURRENTLY: Indexes are created without locking the table
-- This is safe to run in production

-- BRIN (Block Range Index): Very compact index for time-series data
-- Works best when data is naturally ordered by the indexed column

-- Partial indexes: Only index rows matching the WHERE clause
-- Significantly smaller and faster for common queries

-- After running this migration, monitor query performance with:
-- SELECT * FROM pg_stat_user_indexes WHERE relname = 'visits';
-- EXPLAIN ANALYZE SELECT ... (your slow query)
