-- ============================================================
-- LUMIÈRE WEDDING CRM — DATABASE SCHEMA
-- Run this entire file in Supabase SQL Editor (one shot)
-- ============================================================

-- ============ ENUMS ============
CREATE TYPE client_status AS ENUM ('Lead', 'Booked', 'Shoot Done', 'Editing', 'Delivered');
CREATE TYPE vendor_type AS ENUM ('photographer', 'cinematic_editor', 'traditional_editor', 'album_printer', 'other');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'done');
CREATE TYPE priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE expense_category AS ENUM ('Salary', 'Rent', 'Utilities', 'Equipment', 'Marketing', 'Other');

-- ============ CLIENTS ============
CREATE TABLE clients (
  id BIGSERIAL PRIMARY KEY,
  bride_name TEXT NOT NULL,
  groom_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT,
  package TEXT,
  total_amount NUMERIC(12, 2) DEFAULT 0,
  status client_status DEFAULT 'Lead',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_created ON clients(created_at DESC);

-- ============ EVENTS ============
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  venue TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_client ON events(client_id);
CREATE INDEX idx_events_date ON events(event_date);

-- ============ VENDORS ============
CREATE TABLE vendors (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT,
  vendor_type vendor_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_type ON vendors(vendor_type);

-- ============ PROJECT VENDORS (assignments) ============
CREATE TABLE project_vendors (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  vendor_id BIGINT NOT NULL REFERENCES vendors(id) ON DELETE RESTRICT,
  role vendor_type NOT NULL,
  agreed_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pv_client ON project_vendors(client_id);
CREATE INDEX idx_pv_vendor ON project_vendors(vendor_id);

-- ============ PAYMENTS (client → studio, INCOME) ============
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mode TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);

-- ============ VENDOR PAYMENTS (studio → vendor, EXPENSE) ============
CREATE TABLE vendor_payments (
  id BIGSERIAL PRIMARY KEY,
  project_vendor_id BIGINT NOT NULL REFERENCES project_vendors(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mode TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vp_pv ON vendor_payments(project_vendor_id);
CREATE INDEX idx_vp_date ON vendor_payments(payment_date DESC);

-- ============ EXPENSES (general — salary, rent, etc.) ============
CREATE TABLE expenses (
  id BIGSERIAL PRIMARY KEY,
  category expense_category NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX idx_expenses_category ON expenses(category);

-- ============ TASKS ============
CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE, -- NULL = internal task
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT,
  due_date DATE,
  status task_status DEFAULT 'pending',
  priority priority DEFAULT 'medium',
  is_deliverable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_client ON tasks(client_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due ON tasks(due_date);
CREATE INDEX idx_tasks_deliverable ON tasks(is_deliverable) WHERE is_deliverable = TRUE;

-- ============ DELIVERABLES ============
CREATE TABLE deliverables (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  due_date DATE,
  vendor_id BIGINT REFERENCES vendors(id) ON DELETE SET NULL,
  status task_status DEFAULT 'pending',
  delivered_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deliverables_client ON deliverables(client_id);
CREATE INDEX idx_deliverables_status ON deliverables(status);

-- ============ ACTIVITY LOG (auto-populated by triggers) ============
CREATE TABLE activity_log (
  id BIGSERIAL PRIMARY KEY,
  activity_type TEXT NOT NULL, -- payment_received, vendor_paid, task_done, deliverable_done, client_created, etc.
  description TEXT NOT NULL,
  related_table TEXT,
  related_id BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

-- ============ TRIGGERS — auto activity log ============

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Activity log: client created
CREATE OR REPLACE FUNCTION log_client_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_log (activity_type, description, related_table, related_id)
  VALUES ('client_created', 'New client: ' || NEW.bride_name || ' & ' || NEW.groom_name, 'clients', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_client AFTER INSERT ON clients FOR EACH ROW EXECUTE FUNCTION log_client_created();

-- Activity log: payment received
CREATE OR REPLACE FUNCTION log_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  client_label TEXT;
BEGIN
  SELECT bride_name || ' & ' || groom_name INTO client_label FROM clients WHERE id = NEW.client_id;
  INSERT INTO activity_log (activity_type, description, related_table, related_id)
  VALUES ('payment_received', '₹' || NEW.amount::TEXT || ' received from ' || COALESCE(client_label, 'client'), 'payments', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_payment AFTER INSERT ON payments FOR EACH ROW EXECUTE FUNCTION log_payment_received();

-- Activity log: vendor paid
CREATE OR REPLACE FUNCTION log_vendor_paid()
RETURNS TRIGGER AS $$
DECLARE
  vendor_label TEXT;
BEGIN
  SELECT v.name INTO vendor_label
  FROM project_vendors pv
  JOIN vendors v ON v.id = pv.vendor_id
  WHERE pv.id = NEW.project_vendor_id;
  INSERT INTO activity_log (activity_type, description, related_table, related_id)
  VALUES ('vendor_paid', '₹' || NEW.amount::TEXT || ' paid to ' || COALESCE(vendor_label, 'vendor'), 'vendor_payments', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_vendor_payment AFTER INSERT ON vendor_payments FOR EACH ROW EXECUTE FUNCTION log_vendor_paid();

-- Activity log: task done
CREATE OR REPLACE FUNCTION log_task_done()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    INSERT INTO activity_log (activity_type, description, related_table, related_id)
    VALUES ('task_done', 'Task completed: ' || NEW.title, 'tasks', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_task_done AFTER UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION log_task_done();

-- Activity log: deliverable done
CREATE OR REPLACE FUNCTION log_deliverable_done()
RETURNS TRIGGER AS $$
DECLARE
  client_label TEXT;
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    SELECT bride_name || ' & ' || groom_name INTO client_label FROM clients WHERE id = NEW.client_id;
    INSERT INTO activity_log (activity_type, description, related_table, related_id)
    VALUES ('deliverable_done', NEW.item || ' delivered to ' || COALESCE(client_label, 'client'), 'deliverables', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_deliverable_done AFTER UPDATE ON deliverables FOR EACH ROW EXECUTE FUNCTION log_deliverable_done();

-- ============ ROW LEVEL SECURITY ============
-- Phase 1: any logged-in user has full access. Roles can be added later.

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonymous full access" ON clients FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous full access" ON events FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous full access" ON vendors FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous full access" ON project_vendors FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous full access" ON payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous full access" ON vendor_payments FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous full access" ON expenses FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous full access" ON tasks FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous full access" ON deliverables FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Anonymous full access" ON activity_log FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============ DONE ============
-- Tables ready. Add team members from Supabase Auth dashboard:
-- Authentication → Users → Invite user (they'll get magic link)
