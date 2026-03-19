
-- Insert Roles
INSERT INTO roles (name) VALUES ('admin'), ('manager'), ('user');

-- Insert Users (Passwords will be hashed in the app logic or we use a fixed hash for 'password123')
-- Using a placeholder hash for 'password123' (bcrypt): $2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW
INSERT INTO users (name, email, password_hash, status) VALUES 
('Admin User', 'admin@tte.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'active'),
('Manager User', 'manager@tte.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'active'),
('User One', 'user1@tte.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'active'),
('User Two', 'user2@tte.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'active');

-- Assign Roles
INSERT INTO user_roles (user_id, role_id) VALUES 
(1, 1), -- Admin
(2, 2), -- Manager
(3, 3), -- User
(4, 3); -- User

-- Insert Books
INSERT INTO books (title, category, status, metadata) VALUES 
('Advanced React Patterns', 'Development', 'active', '{"author": "Unknown", "pages": 250}'),
('PostgreSQL Optimization', 'Database', 'active', '{"author": "DB Expert", "pages": 300}'),
('UI/UX Design Principles', 'Design', 'active', '{"author": "Designer X", "pages": 150}'),
('Legacy Systems Management', 'Management', 'active', '{"author": "Old Guard", "pages": 400}'),
('Modern Web Security', 'Security', 'active', '{"author": "Sec Guru", "pages": 280}');

-- Assign Books to Users
INSERT INTO user_books (user_id, book_id) VALUES 
(3, 1), (3, 3), -- User 1 gets React & Design
(4, 2), (4, 5); -- User 2 gets DB & Security
