-- Alter columns to use TEXT type for longer content
ALTER TABLE institutions
ALTER COLUMN description TYPE TEXT,
ALTER COLUMN curriculum TYPE TEXT,
ALTER COLUMN contact_info TYPE TEXT;
 
-- Alter image_url column in institution_images table to use TEXT type
ALTER TABLE institution_images
ALTER COLUMN image_url TYPE TEXT; 