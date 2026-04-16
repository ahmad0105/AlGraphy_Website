-- AlGraphy Database Unified Schema
-- This script contains all necessary tables, drops duplicates, and inserts seed data.

USE landing_page;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS site_projects;
DROP TABLE IF EXISTS projects;

DROP TABLE IF EXISTS site_services;
DROP TABLE IF EXISTS services;
DROP TABLE IF EXISTS service_categories;

DROP TABLE IF EXISTS time_logs;
DROP TABLE IF EXISTS project_gallery;
DROP TABLE IF EXISTS potential_clients;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS clients;

DROP TABLE IF EXISTS site_hero;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS site_settings;
SET FOREIGN_KEY_CHECKS = 1;


-- ===========================================
-- 1. BASE ENTITIES (Clients & Employees)
-- ===========================================
CREATE TABLE clients (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Company_name VARCHAR(100) NOT NULL,
    Contact_email VARCHAR(100) UNIQUE
);

CREATE TABLE employees (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Full_name VARCHAR(50) NOT NULL,
    Email VARCHAR(150) UNIQUE,
    Password VARCHAR(255),
    Role VARCHAR(50),
    hourly_rate DECIMAL(10,2),
    profile_pic VARCHAR(255) DEFAULT NULL,
    CONSTRAINT chk_rate_positive CHECK (hourly_rate > 0)
);

-- ===========================================
-- 2. PROJECTS SYSTEM (Unified: site_projects)
-- ===========================================
CREATE TABLE site_projects (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Project_name VARCHAR(100),
    Description TEXT,
    Main_Image VARCHAR(255),
    Key_Features JSON,
    Service_Category VARCHAR(50),
    Start_Date DATE,
    End_Date DATE,
    
    -- Analytics & Reporting fields migrated from old "projects"
    Budget DECIMAL(15,2),
    Status ENUM('Planning', 'Active', 'Completed') DEFAULT 'Planning',
    client_id INT,
    
    display_order INT DEFAULT 0,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT algr_client FOREIGN KEY (client_id) REFERENCES clients(ID) 
);

-- Time Logs tracking against site_projects
CREATE TABLE time_logs (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Work_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Hours_worked DECIMAL(10,2),
    employee_id INT,
    project_id INT,
    CONSTRAINT algr_employee FOREIGN KEY (employee_id) REFERENCES employees (ID) ON DELETE CASCADE,
    CONSTRAINT algr_project FOREIGN KEY (project_id) REFERENCES site_projects (ID) ON DELETE CASCADE,
    CONSTRAINT chk_hours_positive CHECK (Hours_worked >= 0)
);

-- Display images for projects
CREATE TABLE project_gallery (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    Image_URL VARCHAR(255),
    CONSTRAINT fk_gallery_project FOREIGN KEY (project_id) REFERENCES site_projects(ID) ON DELETE CASCADE
);

-- ===========================================
-- 3. SERVICES SYSTEM (Unified: site_services)
-- ===========================================
CREATE TABLE service_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    Service_Name VARCHAR(255) NOT NULL,
    description TEXT,
    Base_Price VARCHAR(50),
    Delivery_Time VARCHAR(50),
    image_url VARCHAR(255),
    icon_svg TEXT,
    Service_Includes JSON,
    Technology_Stack JSON,
    display_order INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE
);

-- ===========================================
-- 4. SITE CONFIGURATION & LEADS & USERS
-- ===========================================
CREATE TABLE potential_clients (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Client_Name VARCHAR(100) NOT NULL,
    Phone_Number VARCHAR(20),
    Email_Address VARCHAR(100),
    Appointment_Date DATE,
    Preferred_Time TIME,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE site_hero (
    id INT PRIMARY KEY DEFAULT 1,
    subtitle VARCHAR(255),
    title TEXT,
    bg_video_url VARCHAR(255),
    showreel_video_url VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE site_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


-- ===========================================
-- 5. SEED DATA
-- ===========================================

-- Base Elements
INSERT INTO site_hero (id, subtitle, title, bg_video_url, showreel_video_url) 
VALUES (1, 'STRATEGIC DESIGN STUDIO', 'WE CRAFT DIGITAL EXPERIENCES.', 'Assets/video/heroVideo.mp4', 'Assets/video/heroVideo.mp4')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO site_settings (setting_key, setting_value) VALUES 
('projects_section_title', 'PORTFOLIO'),
('services_section_title', 'SERVICES'),
('contact_email', 'contact@algraphy.sa');

INSERT INTO service_categories (id, name, slug, display_order) VALUES
(1, 'Business', 'business', 1),
(2, 'Events', 'events', 2),
(3, 'Marketing', 'marketing', 3);

INSERT INTO clients (Company_name, Contact_email) VALUES  
('IT support', 'info@solutions.com'),
('Create your plan', 'contact@creativity.sa');

INSERT INTO employees (Full_name, Email, Password, Role, hourly_rate) VALUES  
('Ahmad', 'ahmad@algraphy.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Developer', 50.00), 
('Khaled', 'khaled@algraphy.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Designer', 40.00), 
('Mohammad', 'mohammad@algraphy.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Designer', 35.00),
('Rola', 'rola@algraphy.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Developer', 30.00), 
('Abdullah', 'abdullah@algraphy.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Developer', 30.00), 
('Irmak', 'irmak@algraphy.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Developer', 30.00),
('Ubade', 'ubade@algraphy.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Developer', 30.00), 
('Youseef', 'youseef@algraphy.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Developer', 55.00);

-- site_projects Insertion
INSERT INTO site_projects (Project_name, Budget, Status, client_id, Description, Main_Image, Key_Features, Service_Category, Start_Date, End_Date) VALUES  
('application car seller', 10000.00, 'Active', 1, 'Car selling market.', 'Assets/image/Aura.png', '["Feature 1", "Feature 2"]', 'Development & Design', '2024-01-01', '2024-05-01'),
('application one direction', 8000.00, 'Active', 1, 'One direction platform.', 'Assets/image/Aura.png', '["Cross Platform"]', 'Development & Design', '2024-02-01', '2024-06-01'),
('website night city', 6090.00, 'Completed', 2, 'Night city landing page.', 'Assets/image/Aura.png', '["Animations"]', 'Branding', '2023-01-01', '2023-05-01');

-- Time logs
INSERT INTO time_logs (Work_date, Hours_worked, employee_id, project_id) VALUES  
('2026-04-14', 10.5, 1, 1), ('2026-04-14', 11.0, 5, 3), ('2026-04-14', 3.0, 3, 2);

-- site_services Insertion
-- Business Section
INSERT INTO site_services (category_id, Service_Name, description, Base_Price, Delivery_Time, image_url, Service_Includes, Technology_Stack, display_order) VALUES
(1, 'BUSINESS PLAN', 'Strategic planning for business growth.', '$5,000', '2-4 Weeks', 'Assets/GIF/strategy.gif', '["Market Analysis","Financial Projections","Competitor Research"]', '["Excel","Tableau","Notion"]', 1),
(1, 'CONSULTING', 'Expert advice for your business.', '$2,500', 'Ongoing', 'Assets/GIF/design.gif', '["Weekly Meetings","Strategy Sessions","Growth Tracking"]', '["Zoom","Miro","Slack"]', 2),
(1, 'ANALYSIS', 'In-depth market and data analysis.', '$3,000', '3 Weeks', 'Assets/GIF/development.gif', '["Data Mining","Trend Forecasting","Custom Dashboard"]', '["Python","PowerBI","SQL"]', 3),
(1, 'MANAGEMENT', 'Effective project management.', '$4,500', 'Monthly', 'Assets/GIF/strategy.gif', '["Resource Allocation","Risk Management","Agile Workflows"]', '["Jira","Asana","Trello"]', 4);

-- Events Section
INSERT INTO site_services (category_id, Service_Name, description, Base_Price, Delivery_Time, image_url, Service_Includes, Technology_Stack, display_order) VALUES
(2, 'CORPORATE EVENTS', 'Memorable corporate gatherings.', '$10k', '2 Months', 'Assets/GIF/design.gif', '["Venue Sourcing","Catering Setup","AV Production"]', '["Cvent","Eventbrite"]', 1),
(2, 'CONFERENCES', 'Large-scale professional conferences.', '$25k', '4-6 Months', 'Assets/GIF/development.gif', '["Speaker Coordination","Ticketing System","Live Streaming"]', '["Zoom Events","Hopin"]', 2),
(2, 'EXHIBITIONS', 'Engaging exhibition setups.', '$15k', '3 Months', 'Assets/GIF/strategy.gif', '["Booth Design","Logistics Setup","Lead Retrieval"]', '["CAD","SketchUp","HubSpot"]', 3),
(2, 'WORKSHOPS', 'Interactive learning sessions.', '$3,500', '2 Weeks', 'Assets/GIF/design.gif', '["Curriculum Design","Materials Creation","Trainer Provision"]', '["Keynote","Slido","Canva"]', 4);

-- Marketing Section
INSERT INTO site_services (category_id, Service_Name, description, Base_Price, Delivery_Time, image_url, Service_Includes, Technology_Stack, display_order) VALUES
(3, 'DIGITAL CAMPAIGNS', 'Targeted online marketing.', '$2,000/mo', 'Ongoing', 'Assets/GIF/development.gif', '["Ad Copywriting","A/B Testing","Conversion Tracking"]', '["Google Ads","Meta Ads"]', 1),
(3, 'SOCIAL MEDIA', 'Engaging social media presence.', '$1,500/mo', 'Ongoing', 'Assets/GIF/strategy.gif', '["Content Calendar","Community Mgmt","Monthly Reports"]', '["Hootsuite","Buffer","Figma"]', 2),
(3, 'SEO OPTIMIZATION', 'Rank higher on search engines.', '$2,500', '3-6 Months', 'Assets/GIF/design.gif', '["Keyword Research","On-page SEO","Backlink Building"]', '["Ahrefs","SEMrush","GA4"]', 3),
(3, 'BRANDING', 'Building strong brand identities.', '$8,000', '1 Month', 'Assets/GIF/development.gif', '["Logo Design","Brand Guidelines","Stationery Kit"]', '["Illustrator","Photoshop"]', 4);
