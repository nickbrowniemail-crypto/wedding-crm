-- Add city column to vendors table if it doesn't exist
ALTER TABLE vendors ADD COLUMN city TEXT;

-- Create index on city for faster searches
CREATE INDEX idx_vendors_city ON vendors(city);
