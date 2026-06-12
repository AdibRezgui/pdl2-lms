-- Add sort_order column (replaces position in the JPA entity mapping)
ALTER TABLE course_modules
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

UPDATE course_modules SET sort_order = position WHERE sort_order = 0;

-- Add locked flag for trainer-controlled module locking
ALTER TABLE course_modules
  ADD COLUMN IF NOT EXISTS locked BOOLEAN NOT NULL DEFAULT FALSE;
