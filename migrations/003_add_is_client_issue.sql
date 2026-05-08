-- Add is_client_issue flag to tasks table for Support Tickets feature
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_client_issue BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_tasks_client_issue ON tasks(is_client_issue) WHERE is_client_issue = TRUE;
