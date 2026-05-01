-- =============================================
-- Migration 053: Drop unused tables
-- demo_leads, tool_leads: no code writes to them
-- push_automation_events: never referenced in codebase
-- =============================================

DROP TABLE IF EXISTS demo_leads CASCADE;
DROP TABLE IF EXISTS tool_leads CASCADE;
DROP TABLE IF EXISTS push_automation_events CASCADE;
