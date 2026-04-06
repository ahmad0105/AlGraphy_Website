
USE landing_page;


SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS time_logs;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS clients;
SET FOREIGN_KEY_CHECKS = 1;


-- Tables of the database
CREATE TABLE clients (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Company_name VARCHAR(100) NOT NULL,
    Contact_email VARCHAR(100) UNIQUE
);

CREATE TABLE employees (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Full_name VARCHAR(50) NOT NULL,
    Role VARCHAR(50),
    hourly_rate DECIMAL(10,2),
    CONSTRAINT chk_rate_positive CHECK (hourly_rate > 0)
);


CREATE TABLE projects (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Project_name VARCHAR(100),
    Budget DECIMAL(15,2),
    Status ENUM('Planning', 'Active', 'Completed') DEFAULT 'Planning',
    client_id INT,
    CONSTRAINT algr_client FOREIGN KEY (client_id) REFERENCES clients(ID) 
);

CREATE TABLE time_logs (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Work_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Hours_worked DECIMAL(10,2),
    employee_id INT,
    project_id INT,
    CONSTRAINT algr_employee FOREIGN KEY (employee_id)REFERENCES employees (ID),
    CONSTRAINT algr_project FOREIGN KEY (project_id)REFERENCES projects (ID),
    CONSTRAINT chk_hours_positive CHECK (Hours_worked >= 0)
);

-- (For the real website)
-- Services part
CREATE TABLE services (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Service_Name VARCHAR(100) NOT NULL,
    Technology_Stack JSON,
    Base_Price DECIMAL(10, 2),
    Delivery_Time VARCHAR(50),
    Service_Includes JSON 
);

-- Projects table 
ALTER TABLE projects 
ADD COLUMN Description TEXT,
ADD COLUMN Main_Image VARCHAR(255),
ADD COLUMN Key_Features JSON,
ADD COLUMN Service_Category VARCHAR(50),
ADD COLUMN Start_Date DATE,
ADD COLUMN End_Date DATE;


-- Image for the projects
CREATE TABLE project_gallery (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    Image_URL VARCHAR(255),
    CONSTRAINT fk_gallery_project FOREIGN KEY (project_id) REFERENCES projects(ID) ON DELETE CASCADE
);

-- New clients for the list & new projects clients
CREATE TABLE potential_clients (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    Client_Name VARCHAR(100) NOT NULL,
    Phone_Number VARCHAR(20),
    Email_Address VARCHAR(100),
    Appointment_Date DATE,
    Preferred_Time TIME,
    Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (For the calling the data for the real website)

-- For the head of the website 
SELECT 
    (SELECT COUNT(*) FROM projects) AS Total_Projects,
    (SELECT COUNT(DISTINCT client_id) FROM projects) AS Total_Clients,
    DATEDIFF(CURRENT_DATE, MIN(Start_Date)) / 365 AS Total_Years_Experience
FROM projects;

-- For the servise part
INSERT INTO services (Service_Name, Technology_Stack, Base_Price, Delivery_Time, Service_Includes) 
VALUES 
('Web Development', 
 '["React", "Node.js", "MySQL"]', 
 5000.00, 
 '4-6 Weeks', 
 '["Responsive Design", "SEO Optimization", "Admin Dashboard"]'),

('Mobile App', 
 '["Flutter", "Firebase"]', 
 8000.00, 
 '8-12 Weeks', 
 '["Push Notifications", "Payment Gateway", "App Store Publishing"]');

-- The projects part 
SELECT 
    p.Project_name AS "Header_Name",
    p.Main_Image AS "Header_Image",
    DATEDIFF(p.End_Date, p.Start_Date) AS "Duration_Days",
    p.Key_Features AS "Quick_Info_Features",
    COUNT(DISTINCT t.employee_id) AS "Impact_Team_Size",
    p.Service_Category AS "Impact_Category",
    p.Description AS "Gallery_Description",
    FORMAT(p.Budget, 2) AS "Footer_Cost"
FROM projects p
LEFT JOIN time_logs t ON p.ID = t.project_id
GROUP BY p.ID;



-- The data 
INSERT INTO clients (Company_name, Contact_email) VALUES  
('IT support', 'info@solutions.com'),
('Create your plan', 'contact@creativity.sa');


INSERT INTO employees (Full_name, Role, hourly_rate) VALUES  
('Ahmad', 'Developer', 50.00),
('Khaled', 'Designer', 40.00),
('Mohammad', 'Designer', 35.00),
('Rola', 'Developer', 30.00),
('Abdullah', 'Developer', 30.00),
('Irmak', 'Developer', 30.00),
('Ubade', 'Developer', 30.00),
('Youseef', 'Developer', 55.00);


INSERT INTO projects (Project_name, Budget, Status, client_id) VALUES  
('application car seller', 10000.00, 'Active', 1),
('application one direction', 8000.00, 'Active', 1),
('website night city', 6090.00, 'Completed', 2),
('website moonlight', 9050.00, 'Completed', 1),
('website Old City', 9100.00, 'Completed', 1),
('application Cat Helper', 3500.00, 'Completed', 1),
('website Home rent', 9000.00, 'Completed', 1),
('application Old City', 9000.00, 'Completed', 1),
('application Unity Game', 9060.00, 'Active', 2),
('website car seller', 3900.00, 'Completed', 2),

('Editing application car seller', 2000.00, 'Active', 1),
('Editing application one direction', 1050.00, 'Active', 1),
('Editing website night city', 1090.00, 'Completed', 2),
('Editing website moonlight', 3020.00, 'Active', 1),
('Editing website Old City', 2100.00, 'Completed', 1),
('Editing application Cat Helper', 1550.00, 'Completed', 1),
('Editing website Home rent', 2000.00, 'Active', 1),
('Editing application Old City', 9000.00, 'Active', 1),
('Editing application Unity Game', 9060.00, 'Active', 2),
('Editing website car seller', 3900.00, 'Completed', 2),

('application cast manger', 1700.00, 'Active', 1),
('application one direction', 9000.00, 'Active', 1),
('website old', 1090.00, 'Completed', 2),
('website grinlight', 1050.00, 'Completed', 1),
('website rightmind', 1100.00, 'Completed', 1),
('application fix Helper', 6590.00, 'Completed', 1),
('website car rent', 20000.00, 'Completed', 1),
('application bulid city', 10900.00, 'Completed', 1),
('application Game', 1060.00, 'Active', 2),
('website car', 1900.00, 'Completed', 2),

('Full system application car seller', 10000.00, 'Active', 1),
('Full system application one direction', 18000.00, 'Active', 1),
('Full system website night city', 10090.00, 'Completed', 2),
('Full system website moonlight', 11050.00, 'Completed', 1),
('Full system website Old City', 14100.00, 'Completed', 1),
('Full system application Cat Helper', 9500.00, 'Completed', 1),
('Full system website Home rent', 13000.00, 'Completed', 1),
('Full system application Old City', 19000.00, 'Completed', 1),
('Full system application Unity Game', 12060.00, 'Active', 2),
('Full system car seller', 19000.00, 'Completed', 2),

('Second edit application car waisher', 650.00, 'Active', 1),
('Second edit application one direction', 700.00, 'Active', 1),
('Second edit website night city', 590.00, 'Completed', 2),
('Second edit website moonlight', 550.00, 'Completed', 1),
('Second edit website Old City', 400.00, 'Completed', 1),
('Second edit application Cat Helper', 500.00, 'Active', 1),
('Second edit website Home rent', 900.00, 'Completed', 1),
('Second edit application Old City', 800.00, 'Completed', 1),
('Second editapplication Unity Game', 960.00, 'Active', 2),
('Second edit website car seller', 900.00, 'Completed', 2);


INSERT INTO time_logs (Work_date, Hours_worked, employee_id, project_id) VALUES  
('2023-10-01', 10.5, 1, 1),
('2023-10-01', 11.0, 5, 10),
('2023-10-02', 3.0, 3, 2), 
('2023-10-02', 8.0, 2, 4), 
('2023-10-03', 8.0, 2, 2),
('2023-10-02', 3.0, 3, 3), 
('2023-10-02', 8.0, 7, 4), 
('2023-10-02', 8.0, 2, 4), 
('2023-10-03', 8.0, 5, 2),
('2023-10-03', 9.0, 2, 2),

('2023-10-01', 10.5, 1, 6),
('2023-10-01', 11.0, 4, 20),
('2023-10-02', 3.0, 3, 9), 
('2023-10-02', 8.0, 6, 4), 
('2023-10-03', 8.0, 2, 2),
('2023-10-02', 3.0, 3, 3), 
('2023-10-02', 8.0, 7, 4), 
('2023-10-02', 8.0, 2, 19), 
('2023-10-03', 8.0, 8, 2),
('2023-10-03', 9.0, 2, 45),

('2023-10-01', 10.5, 1, 3),
('2023-10-01', 11.0, 4, 30),
('2023-10-02', 3.0, 3, 3), 
('2023-10-02', 8.0, 2, 4), 
('2023-10-03', 8.0, 2, 18),
('2023-10-02', 3.0, 3, 3), 
('2023-10-02', 8.0, 2, 4), 
('2023-10-02', 8.0, 2, 17), 
('2023-10-03', 8.0, 2, 2),
('2023-10-03', 9.0, 2, 35),

('2023-10-01', 10.5, 1, 4),
('2023-10-01', 11.0, 4, 40),
('2023-10-02', 3.0, 3, 3), 
('2023-10-02', 8.0, 2, 4), 
('2023-10-03', 8.0, 2, 2),
('2023-10-02', 3.0, 3, 3), 
('2023-10-02', 8.0, 2, 16), 
('2023-10-02', 8.0, 2, 4), 
('2023-10-03', 8.0, 2, 2),
('2023-10-03', 9.0, 2, 30),

('2023-10-01', 10.5, 1, 5),
('2023-10-01', 11.0, 4, 50),
('2023-10-02', 3.0, 3, 14), 
('2023-10-02', 8.0, 8, 12), 
('2023-10-03', 8.0, 5, 2),
('2023-10-02', 3.0, 3, 12), 
('2023-10-02', 8.0, 6, 4), 
('2023-10-02', 8.0, 7, 4), 
('2023-10-03', 8.0, 4, 13),
('2023-10-03', 9.0, 2, 15);


-- Reports

-- The first reports(The Roster)

SELECT 
	e.Full_name, 
	COALESCE( SUM(t.Hours_worked),0 ) AS Total_Hours FROM employees e
    
LEFT JOIN time_logs t ON e.ID = t.employee_id

GROUP BY 
	e.ID, 
    e.Full_name;


-- The second report(The Client Update)

SELECT 
    p.Project_name, 
    c.Company_name, 
    COALESCE(SUM(t.Hours_worked),0) AS Total_Project_Hours
    
FROM projects p

JOIN clients c ON p.client_id = c.ID

LEFT JOIN time_logs t ON p.ID = t.project_id

WHERE p.Status = 'Active'

GROUP BY 
	p.ID, 
    p.Project_name, 
    c.Company_name;

-- The thired report(The Profitability)

SELECT 
	p.Project_name,
    p.Budget,
    FORMAT (CAST(COALESCE (SUM(t.Hours_worked * e.hourly_rate), 0) AS DECIMAL (15, 2)),2)

AS Total_Cost FROM projects p 
	LEFT JOIN time_logs t ON p.id = t.project_id
    LEFT JOIN employees e ON t.employee_id = e.ID
    
GROUP BY 
	p.ID,
    p.project_name,
    p.Budget;






SELECT 
    p.ID AS "Project ID",
    p.Project_name AS "Project Name",
    e.Full_name AS "Employee Name",
    p.Budget AS "Project Budget",
    e.hourly_rate AS "Employee Hourly Rate",
    SUM(t.Hours_worked) AS "Total Hours Worked",
    CAST(SUM(t.Hours_worked * e.hourly_rate) AS DECIMAL(15, 2)) AS "Total Cost"
FROM projects p
JOIN time_logs t ON p.ID = t.project_id
JOIN employees e ON t.employee_id = e.ID
GROUP BY 
    p.ID, 
    p.Project_name, 
    e.Full_name, 
    p.Budget, 
    e.hourly_rate
ORDER BY p.ID ASC, "Total Cost" DESC;
     


SELECT 
    p.ID AS "Project ID",
    p.Project_name AS "Project Name",
    e.Full_name AS "Employee Name",
    p.Budget AS "Project Budget",
    e.hourly_rate AS "Employee Hourly Rate",
    COALESCE(SUM(t.Hours_worked), 0) AS "Total Hours Worked",
    CAST(COALESCE(SUM(t.Hours_worked * e.hourly_rate), 0) AS DECIMAL(15, 2)) AS "Total Cost"
FROM employees e
LEFT JOIN time_logs t ON e.ID = t.employee_id
LEFT JOIN projects p ON t.project_id = p.ID
GROUP BY 
    e.Full_name,
    p.ID, 
    p.Project_name, 
    p.Budget, 
    e.hourly_rate
ORDER BY 
    e.Full_name ASC,    
    p.ID ASC;         
    
    
