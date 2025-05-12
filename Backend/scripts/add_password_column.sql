-- Add password column to institutions table with a default value
ALTER TABLE institutions
ADD COLUMN password VARCHAR(255);

-- Set a default password for existing institutions
UPDATE institutions
SET password = '$2a$10$defaultpasswordhash'
WHERE password IS NULL;

-- Now make the column NOT NULL
ALTER TABLE institutions
ALTER COLUMN password SET NOT NULL; 