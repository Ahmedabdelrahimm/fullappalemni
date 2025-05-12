-- Insert dummy users
INSERT INTO users (email, first_name, last_name, password, national_id, address, gender, age, profile_picture, bio)
VALUES 
('john.doe@example.com', 'John', 'Doe', '$2a$10$somehashedpassword', 'ID123456', '123 Main St', 'Male', 25, 'profile1.jpg', 'Student passionate about learning'),
('jane.smith@example.com', 'Jane', 'Smith', '$2a$10$somehashedpassword', 'ID789012', '456 Oak Ave', 'Female', 22, 'profile2.jpg', 'Future engineer'),
('admin@alemni.com', 'Admin', 'User', '$2a$10$somehashedpassword', 'ID345678', '789 Pine St', 'Male', 30, 'profile3.jpg', 'System administrator');

-- Insert dummy institutions
INSERT INTO institutions (name, location, curriculum, reputation_score, contact_info, type, website, contact_email, contact_phone, rating, total_reviews, image_url, description)
VALUES
('Cairo University', 'Giza, Egypt', 'International curriculum', 4.5, 'Contact via email or phone', 'Public University', 'www.cu.edu.eg', 'info@cu.edu.eg', '+20123456789', 4.2, 150, 'cu_image.jpg', 'One of the oldest universities in Egypt'),
('AUC', 'New Cairo, Egypt', 'American curriculum', 4.8, 'Contact via website', 'Private University', 'www.aucegypt.edu', 'info@aucegypt.edu', '+20198765432', 4.7, 200, 'auc_image.jpg', 'Leading American university in the Middle East');

-- Insert institution categories
INSERT INTO institution_categories (category_name)
VALUES
('Universities'),
('Schools'),
('Academies');

-- Insert institution category mappings
INSERT INTO institution_category_mappings (institution_id, category_id)
VALUES
(1, 1),
(2, 1);

-- Insert educational programs
INSERT INTO educational_programs (program_name, duration, tuition_fees, level, curriculum_details, institution_id, description, start_date, application_deadline, requirements, capacity)
VALUES
('Computer Science', '4 years', 50000.00, 'Bachelor', 'Comprehensive CS curriculum', 1, 'Bachelor degree in Computer Science', '2024-09-01', '2024-08-01', 'High school diploma with good grades', 100),
('Business Administration', '4 years', 45000.00, 'Bachelor', 'Modern business curriculum', 1, 'BBA program', '2024-09-01', '2024-08-01', 'High school diploma', 120),
('Engineering', '5 years', 55000.00, 'Bachelor', 'Engineering fundamentals', 2, 'Engineering program', '2024-09-01', '2024-08-01', 'Strong math background', 80);

-- Insert courses
INSERT INTO courses (course_name, instructor, credits, duration, course_description, program_id)
VALUES
('Introduction to Programming', 'Dr. Ahmed Hassan', 3, '4 months', 'Basic programming concepts', 1),
('Data Structures', 'Dr. Sarah Mohamed', 4, '4 months', 'Advanced programming concepts', 1),
('Marketing 101', 'Dr. Mohamed Ali', 3, '4 months', 'Introduction to marketing', 2);

-- Insert institution facilities
INSERT INTO institution_facilities (name, description, institution_id)
VALUES
('Library', 'Modern library with extensive collection', 1),
('Computer Lab', 'State-of-the-art computer facilities', 1),
('Sports Complex', 'Multiple sports facilities', 2);

-- Insert institution images
INSERT INTO institution_images (image_url, is_primary, institution_id)
VALUES
('images/cu1.jpg', true, 1),
('images/cu2.jpg', false, 1),
('images/auc1.jpg', true, 2);

-- Insert institution fees
INSERT INTO institution_fees (name, price, institution_id)
VALUES
('Application Fee', 500.00, 1),
('Registration Fee', 1000.00, 1),
('Application Fee', 800.00, 2);

-- Insert scholarships
INSERT INTO scholarships (scholarship_name, application_deadline, scholarship_amount, eligibility_criteria, institution_id, description, requirements)
VALUES
('Merit Scholarship', '2024-07-01', 10000.00, 'High academic achievement', 1, 'Scholarship for outstanding students', 'GPA 3.5 or higher'),
('Sports Scholarship', '2024-07-15', 8000.00, 'Excellence in sports', 2, 'For talented athletes', 'National level achievements');

-- Insert reviews
INSERT INTO reviews (rating, comment, user_id, institution_id, title)
VALUES
(5, 'Excellent facilities and teaching staff', 1, 1, 'Great Experience'),
(4, 'Good education but expensive', 2, 2, 'Worth It');

-- Insert bus routes
INSERT INTO bus_routes (route_name, pickup_location, end_location, pickup_time, dropoff_time, bus_fees, stops, institution_id, available_seats, schedule_days)
VALUES
('Route 1', 'Downtown', 'University', '07:00:00', '08:00:00', 500.00, 'Stop 1, Stop 2, Stop 3', 1, 50, 'Monday-Friday'),
('Route 2', 'Maadi', 'University', '07:30:00', '08:30:00', 600.00, 'Stop A, Stop B', 2, 45, 'Monday-Friday');

-- Insert advisors/consultants
INSERT INTO advisors_consultants (name, email, specialization, years_of_experience, rating, consultation_fees, institution_id, availability, profile_picture, bio, languages)
VALUES
('Dr. Ahmed Mahmoud', 'ahmed.m@cu.edu.eg', 'Academic Counseling', 10, 4.8, 200.00, 1, '{"monday": "9-5", "tuesday": "9-5"}', 'advisor1.jpg', 'Experienced academic advisor', ARRAY['Arabic', 'English']),
('Dr. Mona Hassan', 'mona.h@aucegypt.edu', 'Career Guidance', 8, 4.6, 250.00, 2, '{"wednesday": "10-6", "thursday": "10-6"}', 'advisor2.jpg', 'Career development expert', ARRAY['Arabic', 'English', 'French']);

-- Insert FAQ entries
INSERT INTO faq_help_center (question, answer, category, popularity, institution_id)
VALUES
('What are the admission requirements?', 'Requirements include high school certificate and entrance exam.', 'Admissions', 100, 1),
('How can I apply for a scholarship?', 'Submit your application through the online portal with required documents.', 'Financial Aid', 80, 2);

-- Insert blog posts
INSERT INTO blog_posts (title, content, author, category, image_url, institution_id)
VALUES
('Campus Life Update', 'Exciting new developments on campus...', 'Admin Team', 'News', 'blog1.jpg', 1),
('Student Success Stories', 'Meet our outstanding graduates...', 'PR Team', 'Stories', 'blog2.jpg', 2);

-- Insert blog comments
INSERT INTO blog_comments (post_id, user_id, content)
VALUES
(1, 1, 'Great update! Looking forward to the new facilities.'),
(2, 2, 'Very inspiring stories!');

-- Insert community rooms
INSERT INTO community_rooms (name, description, member_count)
VALUES
('Computer Science Hub', 'Discussion group for CS students', 50),
('Business Network', 'Networking for business students', 35);

-- Insert community memberships
INSERT INTO community_memberships (user_id, room_id)
VALUES
(1, 1),
(2, 2);

-- Insert community messages
INSERT INTO community_messages (room_id, user_id, content)
VALUES
(1, 1, 'Hello everyone! Any tips for the upcoming CS exam?'),
(2, 2, 'Looking for study partners for the business case analysis.');

-- Insert user settings
INSERT INTO user_settings (user_id, language, theme, notification_preferences)
VALUES
(1, 'English', 'Light', '{"email": true, "push": true}'),
(2, 'Arabic', 'Dark', '{"email": true, "push": false}');

-- Insert authentication tokens
INSERT INTO authentication_tokens (user_id, token, expires_at)
VALUES
(1, 'token123', CURRENT_TIMESTAMP + INTERVAL '7 days'),
(2, 'token456', CURRENT_TIMESTAMP + INTERVAL '7 days');

-- Insert password reset tokens
INSERT INTO password_reset_tokens (user_id, token, expires_at)
VALUES
(1, 'reset123', CURRENT_TIMESTAMP + INTERVAL '24 hours'),
(2, 'reset456', CURRENT_TIMESTAMP + INTERVAL '24 hours');

-- Insert bookmarks
INSERT INTO bookmarks (user_id, institution_id)
VALUES
(1, 1),
(2, 2);

-- Insert payment transactions
INSERT INTO payment_transactions (payment_type, amount, user_id, institution_id)
VALUES
('Tuition', 5000.00, 1, 1),
('Application Fee', 200.00, 2, 2);

-- Insert enrollment applications
INSERT INTO enrollment_applications (status, required_documents, user_id, program_id)
VALUES
('Pending', 'Transcript, ID, Photos', 1, 1),
('Approved', 'All documents received', 2, 2);

-- Insert documents
INSERT INTO documents (document_type, user_id, application_id, file_url, file_name, file_size, status)
VALUES
('Transcript', 1, 1, 'transcripts/1.pdf', 'transcript.pdf', 1024, 'verified'),
('ID', 2, 2, 'ids/2.pdf', 'national_id.pdf', 512, 'pending'); 