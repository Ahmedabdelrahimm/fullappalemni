-- Remove image_url column from institutions table
ALTER TABLE institutions
DROP COLUMN IF EXISTS image_url; 