-- ============================================================
-- SEED DATA for Smart Campus Resource Booking System
-- ============================================================

-- Departments
INSERT INTO departments (name, code) VALUES
('Computer Science and Engineering', 'CSE'),
('Information Science and Engineering', 'ISE'),
('Electronics and Communication', 'ECE'),
('Mechanical Engineering', 'ME'),
('Civil Engineering', 'CE'),
('Electrical Engineering', 'EE'),
('Biotechnology', 'BT'),
('Mathematics', 'MATH');

-- Resource Types
INSERT INTO resource_types (name, description) VALUES
('classroom',    'Standard lecture classroom'),
('laboratory',   'Specialized lab with equipment'),
('seminar_hall', 'Large hall for seminars and events'),
('equipment',    'Portable or shared equipment');

-- Features
INSERT INTO features (name, icon) VALUES
('Projector',      'projector'),
('Whiteboard',     'edit'),
('Computers',      'monitor'),
('AC',             'wind'),
('WiFi',           'wifi'),
('Sound System',   'volume-2'),
('Video Conf',     'video'),
('Printer',        'printer'),
('Smart Board',    'tv'),
('Power Outlets',  'zap');

-- Users (password is bcrypt hash of 'password123')
INSERT INTO users (name, email, password_hash, role, department_id, phone) VALUES
('Admin User',      'admin@rvce.edu.in',    '$2b$10$rIC/J3bXqFGxz4Y9hVq5CeQ3GNc5Y5x5xL0eV5gKjR7XZCJ8X9Kq6', 'admin',   2, '9876543210'),
('Dr. Ramesh Kumar', 'ramesh@rvce.edu.in',  '$2b$10$rIC/J3bXqFGxz4Y9hVq5CeQ3GNc5Y5x5xL0eV5gKjR7XZCJ8X9Kq6', 'faculty', 1, '9876543211'),
('Prof. Meena S',    'meena@rvce.edu.in',   '$2b$10$rIC/J3bXqFGxz4Y9hVq5CeQ3GNc5Y5x5xL0eV5gKjR7XZCJ8X9Kq6', 'faculty', 2, '9876543212'),
('Kiran S K',        'kiran@rvce.edu.in',   '$2b$10$rIC/J3bXqFGxz4Y9hVq5CeQ3GNc5Y5x5xL0eV5gKjR7XZCJ8X9Kq6', 'student', 2, '9876543213'),
('M Pranav Adiga',   'pranav@rvce.edu.in',  '$2b$10$rIC/J3bXqFGxz4Y9hVq5CeQ3GNc5Y5x5xL0eV5gKjR7XZCJ8X9Kq6', 'student', 2, '9876543214'),
('Ananya R',         'ananya@rvce.edu.in',  '$2b$10$rIC/J3bXqFGxz4Y9hVq5CeQ3GNc5Y5x5xL0eV5gKjR7XZCJ8X9Kq6', 'student', 1, '9876543215');

-- Resources
INSERT INTO resources (name, type_id, department_id, location, building, floor, capacity, description) VALUES
('CSE Lecture Hall 101',    1, 1, 'Room 101, Block A', 'Block A', 1, 60,  'Main CSE lecture hall with tiered seating'),
('CSE Lecture Hall 201',    1, 1, 'Room 201, Block A', 'Block A', 2, 60,  'CSE lecture hall with modern amenities'),
('ISE Classroom 301',       1, 2, 'Room 301, Block B', 'Block B', 3, 45,  'ISE department classroom'),
('ISE Classroom 302',       1, 2, 'Room 302, Block B', 'Block B', 3, 45,  'ISE department classroom'),
('Computer Lab 1',          2, 1, 'Room 105, Block A', 'Block A', 1, 40,  'Computer lab with 40 workstations'),
('Computer Lab 2',          2, 2, 'Room 205, Block B', 'Block B', 2, 30,  'ISE computer lab with 30 workstations'),
('Electronics Lab',         2, 3, 'Room 108, Block C', 'Block C', 1, 25,  'Electronics and circuits lab'),
('Networking Lab',          2, 2, 'Room 310, Block B', 'Block B', 3, 20,  'Networking and security lab'),
('Main Seminar Hall',       3, NULL, 'Ground Floor, Admin Block', 'Admin Block', 0, 200, 'Main seminar hall for college events'),
('Mini Auditorium',         3, NULL, 'First Floor, Admin Block',  'Admin Block', 1, 100, 'Mini auditorium for department events'),
('Conference Room A',       3, NULL, 'Room 401, Block A', 'Block A', 4, 20,  'Small conference room'),
('Portable Projector Set 1', 4, NULL, 'Admin Office', 'Admin Block', 0, 0, 'Portable projector with screen'),
('Portable Projector Set 2', 4, NULL, 'Admin Office', 'Admin Block', 0, 0, 'Portable projector with screen'),
('PA System',                4, NULL, 'Admin Office', 'Admin Block', 0, 0, 'Portable PA system with microphones');

-- Resource Features
INSERT INTO resource_features (resource_id, feature_id, quantity) VALUES
-- CSE Lecture Hall 101: Projector, Whiteboard, AC, WiFi
(1, 1, 1), (1, 2, 2), (1, 4, 1), (1, 5, 1),
-- CSE Lecture Hall 201: Projector, Whiteboard, AC, WiFi, Smart Board
(2, 1, 1), (2, 2, 1), (2, 4, 1), (2, 5, 1), (2, 9, 1),
-- ISE Classroom 301: Projector, Whiteboard, AC
(3, 1, 1), (3, 2, 2), (3, 4, 1),
-- ISE Classroom 302: Projector, Whiteboard
(4, 1, 1), (4, 2, 2),
-- Computer Lab 1: Computers, Projector, AC, WiFi
(5, 3, 40), (5, 1, 1), (5, 4, 1), (5, 5, 1),
-- Computer Lab 2: Computers, Projector, AC, WiFi
(6, 3, 30), (6, 1, 1), (6, 4, 1), (6, 5, 1),
-- Electronics Lab: Power Outlets, Whiteboard
(7, 10, 50), (7, 2, 2),
-- Networking Lab: Computers, WiFi, AC
(8, 3, 20), (8, 5, 1), (8, 4, 1),
-- Main Seminar Hall: Projector, Sound System, AC, WiFi, Video Conf
(9, 1, 2), (9, 6, 1), (9, 4, 1), (9, 5, 1), (9, 7, 1),
-- Mini Auditorium: Projector, Sound System, AC
(10, 1, 1), (10, 6, 1), (10, 4, 1),
-- Conference Room A: Projector, Whiteboard, AC, WiFi, Video Conf
(11, 1, 1), (11, 2, 1), (11, 4, 1), (11, 5, 1), (11, 7, 1);

-- Maintenance Schedules
INSERT INTO maintenance_schedules (resource_id, scheduled_by, title, description, start_time, end_time, status) VALUES
(5, 1, 'Computer Lab 1 - Software Update', 'Quarterly software update and virus scan on all workstations',
    CURRENT_DATE + INTERVAL '7 days' + INTERVAL '8 hours',
    CURRENT_DATE + INTERVAL '7 days' + INTERVAL '17 hours',
    'scheduled'),
(9, 1, 'Seminar Hall - AC Servicing', 'Annual AC servicing and deep cleaning',
    CURRENT_DATE + INTERVAL '14 days' + INTERVAL '9 hours',
    CURRENT_DATE + INTERVAL '14 days' + INTERVAL '18 hours',
    'scheduled');

-- Sample Bookings
INSERT INTO bookings (user_id, resource_id, title, description, start_time, end_time, status, priority, attendees_count) VALUES
(2, 1, 'Data Structures Lecture', 'Regular DS lecture for 3rd semester',
    CURRENT_DATE + INTERVAL '1 day' + INTERVAL '9 hours',
    CURRENT_DATE + INTERVAL '1 day' + INTERVAL '10 hours',
    'approved', 'normal', 55),
(2, 5, 'DS Lab Session', 'Hands-on DS lab for 3rd semester',
    CURRENT_DATE + INTERVAL '1 day' + INTERVAL '14 hours',
    CURRENT_DATE + INTERVAL '1 day' + INTERVAL '16 hours',
    'approved', 'normal', 38),
(3, 3, 'DBMS Lecture', 'DBMS class for 5th semester ISE',
    CURRENT_DATE + INTERVAL '2 days' + INTERVAL '10 hours',
    CURRENT_DATE + INTERVAL '2 days' + INTERVAL '11 hours',
    'approved', 'normal', 40),
(4, 6, 'Mini Project Work', 'Team mini project work session',
    CURRENT_DATE + INTERVAL '2 days' + INTERVAL '14 hours',
    CURRENT_DATE + INTERVAL '2 days' + INTERVAL '16 hours',
    'pending', 'normal', 4),
(5, 9, 'Tech Talk - AI in Education', 'Student-organized tech talk on AI',
    CURRENT_DATE + INTERVAL '3 days' + INTERVAL '15 hours',
    CURRENT_DATE + INTERVAL '3 days' + INTERVAL '17 hours',
    'pending', 'high', 150),
(4, 11, 'Project Discussion', 'DBMS project team discussion',
    CURRENT_DATE + INTERVAL '1 day' + INTERVAL '11 hours',
    CURRENT_DATE + INTERVAL '1 day' + INTERVAL '12 hours',
    'approved', 'normal', 5);

