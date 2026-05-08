-- Add booking date and lead creation date to clients, plus distinct payment types for client payments
CREATE TYPE payment_type AS ENUM ('Advance', 'Token', 'Other');

ALTER TABLE clients
  ADD COLUMN booking_date DATE,
  ADD COLUMN lead_created_at DATE DEFAULT CURRENT_DATE;

ALTER TABLE payments
  ADD COLUMN payment_type payment_type NOT NULL DEFAULT 'Advance';

UPDATE payments SET payment_type = 'Advance' WHERE payment_type IS NULL;
