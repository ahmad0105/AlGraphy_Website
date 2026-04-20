<?php
declare(strict_types=1);

namespace AlGraphy\Controllers;

/**
 * AlGraphy Studio — General API Controller
 * 
 * TABLE OF CONTENTS:
 * 1. Namespace & Dependencies
 * 2. Class Definition & Property Promotion
 * 3. Employee Management
 * 4. Financial Reporting
 * 5. Profile Management & Secure Uploads
 * 6. Hero Section Management
 * 7. Services Section Management (NEW)
 * 8. Helper: Send JSON Response
 * 
 * @package AlGraphy\Controllers
 */

use AlGraphy\Database;
use AlGraphy\Traits\ValidationTrait;
use PDO;
use Exception;
use PDOException;

class ApiController extends BaseController
{
    // Integrating the ValidationTrait for clean security checks
    use ValidationTrait;

    /**
     * Constructor (Dependency Injection)
     */
    public function __construct(private Database $database) {}

    /* --- 3. Employee Management (Existing) --- */
    public function getEmployees(): void
    {
        $pdo = $this->database->connect();
        $stmt = $pdo->query("SELECT id, full_name, role, email FROM employees");
        $employees = $stmt->fetchAll();

        $this->sendJson($employees);
    }

    /* --- 4. Financial Reporting (Existing) --- */
    public function getFinancials(): void
    {
        $pdo = $this->database->connect();
        $stmt = $pdo->query("SELECT id, month, revenue, expenses FROM financials");
        $financials = $stmt->fetchAll();

        $this->sendJson($financials);
    }

    /* --- 5. Profile Management (Existing) --- */
    public function updateProfile(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        
        if (!isset($_SESSION['user_id'])) {
            $this->sendJson(["error" => "Unauthorized access. Please login first."], 401);
        }

        $fullName = trim($_POST['full_name'] ?? '');
        $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
        $newPassword = $_POST['password'] ?? '';

        if (empty($fullName) || !$email) {
            $this->sendJson(["error" => "Full name and valid email are required"], 400);
        }

        $profilePicPath = null;

        // Secure File Upload using ValidationTrait logic inspiration
        if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
            $error = $this->validateImageUpload($_FILES['profile_image'], 5);
            if ($error) {
                $this->sendJson(["error" => $error], 400);
            }

            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($_FILES['profile_image']['tmp_name']);
            
            $extension = match ($mimeType) {
                'image/jpeg' => 'jpg',
                'image/png'  => 'png',
                'image/webp' => 'webp',
                default => 'png'
            };

            $fileName = uniqid('profile_', true) . '.' . $extension;
            $uploadDir = __DIR__ . '/../../public/uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

            $localPath = $uploadDir . $fileName;
            if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $localPath)) {
                // NEW: Upload to Cloudinary
                $cloudUrl = $this->uploadToCloudinary($localPath, 'profiles');
                if ($cloudUrl) {
                    $profilePicPath = $cloudUrl;
                    unlink($localPath);
                }
            }
        }

        $pdo = $this->database->connect();
        $sql = "UPDATE employees SET full_name = ?, email = ?" . ($profilePicPath ? ", profile_pic = ?" : "") . 
               ($newPassword ? ", password = ?" : "") . " WHERE id = ?";
        
        $params = [$fullName, $email];
        if ($profilePicPath) $params[] = $profilePicPath;
        if ($newPassword) $params[] = password_hash($newPassword, PASSWORD_BCRYPT);
        $params[] = $_SESSION['user_id'];

        $stmt = $pdo->prepare($sql);
        if ($stmt->execute($params)) {
            $this->sendJson(["status" => "success", "message" => "Profile updated successfully"]);
        } else {
            $this->sendJson(["error" => "Update failed"], 500);
        }
    }

    /* --- 6. Hero Section Management (Existing) --- */
    public function getHero(): void
    {
        $pdo = $this->database->connect();
        $stmt = $pdo->query("SELECT * FROM site_hero WHERE id = 1");
        $hero = $stmt->fetch();

        if ($hero) {
            $hero['bg_video'] = $hero['bg_video_url'];
            $hero['showreel_video'] = $hero['showreel_video_url'];
            $this->sendJson(["status" => "success", "hero" => $hero]);
        } else {
            $this->sendJson(["status" => "error", "message" => "No hero data found"], 404);
        }
    }

    public function updateHero(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) {
            $this->sendJson(["error" => "Unauthorized access. Please login first."], 401);
        }

        $subtitle = trim($_POST['subtitle'] ?? '');
        $title = trim($_POST['title'] ?? '');

        $uploadDir = __DIR__ . '/../../public/uploads/videos/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        $updates = ["subtitle = ?", "title = ?"];
        $params = [$subtitle, $title];

        $videoFields = ['hero_bg_video' => 'bg_video_url', 'showreel_video' => 'showreel_video_url'];

        foreach ($videoFields as $fileKey => $dbColumn) {
            // Priority 1: Direct URL from frontend (Cloudinary Direct Upload)
            $directUrlKey = $fileKey . '_url_direct';
            if (!empty($_POST[$directUrlKey])) {
                $updates[] = "$dbColumn = ?";
                $params[] = $_POST[$directUrlKey];
                continue;
            }

            // Priority 2: Traditional File Upload (Local/Small files)
            if (isset($_FILES[$fileKey]) && $_FILES[$fileKey]['error'] === UPLOAD_ERR_OK) {
                $finfo = new \finfo(FILEINFO_MIME_TYPE);
                $mimeType = $finfo->file($_FILES[$fileKey]['tmp_name']);
                
                $allowed = ['video/mp4', 'video/webm', 'video/quicktime'];
                if (in_array($mimeType, $allowed)) {
                    $ext = pathinfo($_FILES[$fileKey]['name'], PATHINFO_EXTENSION);
                    $name = uniqid($fileKey . '_', true) . '.' . $ext;
                    $localPath = $uploadDir . $name;
                    
                    if (move_uploaded_file($_FILES[$fileKey]['tmp_name'], $localPath)) {
                        // NEW: Upload to Cloudinary
                        $cloudUrl = $this->uploadToCloudinary($localPath, 'hero_videos');
                        
                        if ($cloudUrl) {
                            $updates[] = "$dbColumn = ?";
                            $params[] = $cloudUrl;
                            // Clean up local temp file
                            unlink($localPath);
                        }
                    }
                }
            }
        }

        $pdo = $this->database->connect();
        $sql = "UPDATE site_hero SET " . implode(", ", $updates) . " WHERE id = 1";
        $stmt = $pdo->prepare($sql);
        
        if ($stmt->execute($params)) {
            $this->sendJson(["status" => "success", "message" => "Hero updated successfully"]);
        } else {
            $this->sendJson(["status" => "error", "message" => "Update failed"], 500);
        }
    }

    /* --- 7. Services Section Management (NEW) --- */
    
    /**
     * Get all categories and their nested services
     */
    public function getServicesData(): void
    {
        $pdo = $this->database->connect();
        
        // Fetch Categories
        $catStmt = $pdo->query("SELECT * FROM service_categories ORDER BY display_order ASC");
        $categories = $catStmt->fetchAll();

        // Fetch Services
        $svcStmt = $pdo->query("SELECT * FROM site_services ORDER BY category_id, display_order ASC");
        $services = $svcStmt->fetchAll();

        // Nest services into categories for easier frontend rendering
        foreach ($categories as &$cat) {
            $cat['services'] = array_filter($services, fn($s) => $s['category_id'] == $cat['id']);
            $cat['services'] = array_values($cat['services']); // Reset keys
        }

        $this->sendJson(["status" => "success", "categories" => $categories]);
    }

    /**
     * Update a specific service category (The Section Tab)
     */
    public function updateCategory(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) {
            $this->sendJson(["error" => "Unauthorized access login required"], 401);
        }

        $id = (int)($_POST['id'] ?? 0);
        $name = filter_var($_POST['name'] ?? '', FILTER_SANITIZE_SPECIAL_CHARS);

        if (!$id || !$name) {
            $this->sendJson(["error" => "Missing category ID or name"], 400);
        }

        $pdo = $this->database->connect();
        $stmt = $pdo->prepare("UPDATE service_categories SET name = ? WHERE id = ?");
        
        if ($stmt->execute([$name, $id])) {
            $this->sendJson(["status" => "success", "message" => "Tab button updated successfully"]);
        } else {
            $this->sendJson(["status" => "error", "message" => "Failed to update category"], 500);
        }
    }

    public function addCategory(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) {
            $this->sendJson(["error" => "Unauthorized"], 401);
        }

        $name = trim($_POST['name'] ?? '');
        if (empty($name)) {
            $this->sendJson(["error" => "Section name is required"], 400);
        }

        $pdo = $this->database->connect();
        
        // LIMIT CHECK: Max 5 Sections
        $count = $pdo->query("SELECT COUNT(*) FROM service_categories")->fetchColumn();
        if ($count >= 5) {
            $this->sendJson(["error" => "Maximum limit reached (5 sections). Please delete an existing section first."], 400);
        }

        $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name)));
        $order = (int)$count + 1;

        $stmt = $pdo->prepare("INSERT INTO service_categories (name, slug, display_order) VALUES (?, ?, ?)");
        if ($stmt->execute([$name, $slug, $order])) {
            $this->sendJson(["status" => "success", "message" => "New section created"]);
        } else {
            $this->sendJson(["error" => "Failed to create section"], 500);
        }
    }

    public function deleteCategory(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) {
            $this->sendJson(["error" => "Unauthorized"], 401);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            $this->sendJson(["error" => "Missing ID"], 400);
        }

        $pdo = $this->database->connect();
        $pdo->beginTransaction();

        try {
            // 1. Delete all services linked to this category
            $pdo->prepare("DELETE FROM site_services WHERE category_id = ?")->execute([$id]);
            
            // 2. Delete the category itself
            $pdo->prepare("DELETE FROM service_categories WHERE id = ?")->execute([$id]);

            $pdo->commit();
            $this->sendJson(["status" => "success", "message" => "Section and associated services deleted"]);
        } catch (\Exception $e) {
            $pdo->rollBack();
            $this->sendJson(["error" => "Delete failed: " . $e->getMessage()], 500);
        }
    }

    public function addService(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) {
            $this->sendJson(["error" => "Unauthorized access login required"], 401);
        }

        $categoryId = (int)($_POST['category_id'] ?? 0);
        if (!$categoryId) $this->sendJson(["error" => "Missing category ID"], 400);

        $pdo = $this->database->connect();
        
        // LIMIT CHECK: Max 8 Services per Category
        $count = $pdo->prepare("SELECT COUNT(*) FROM site_services WHERE category_id = ?");
        $count->execute([$categoryId]);
        if ((int)$count->fetchColumn() >= 8) {
            $this->sendJson(["error" => "Maximum limit reached (8 services per section)."], 400);
        }

        $title = trim($_POST['Service_Name'] ?? 'New Service');
        $desc = trim($_POST['description'] ?? '');
        $price = trim($_POST['Base_Price'] ?? '$0');
        $duration = trim($_POST['Delivery_Time'] ?? 'TBD');
        
        $includes_raw = trim($_POST['Service_Includes'] ?? '');
        $tech_raw = trim($_POST['Technology_Stack'] ?? '');
        $includes = json_encode(array_filter(array_map('trim', explode(',', $includes_raw))));
        $tech = json_encode(array_filter(array_map('trim', explode(',', $tech_raw))));

        // Calculate Next display_order for this specific category
        $orderStmt = $pdo->prepare("SELECT COALESCE(MAX(display_order), 0) FROM site_services WHERE category_id = ?");
        $orderStmt->execute([$categoryId]);
        $nextOrder = (int)$orderStmt->fetchColumn() + 1;

        $imageUrl = 'Assets/GIF/strategy.gif'; // Default
        
        if (isset($_FILES['service_image']) && $_FILES['service_image']['error'] === UPLOAD_ERR_OK) {
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($_FILES['service_image']['tmp_name']);
            $allowed = ['image/gif', 'image/jpeg', 'image/png', 'image/webp'];
            
            if (in_array($mimeType, $allowed)) {
                $ext = pathinfo($_FILES['service_image']['name'], PATHINFO_EXTENSION);
                $name = uniqid('svc_new_', true) . '.' . $ext;
                $uploadDir = __DIR__ . '/../../public/uploads/services/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
                $localPath = $uploadDir . $name;

                if (move_uploaded_file($_FILES['service_image']['tmp_name'], $localPath)) {
                    // NEW: Upload to Cloudinary
                    $cloudUrl = $this->uploadToCloudinary($localPath, 'services');
                    if ($cloudUrl) {
                        $imageUrl = $cloudUrl;
                        unlink($localPath);
                    }
                }
            }
        }

        $sql = "INSERT INTO site_services (category_id, Service_Name, description, Base_Price, Delivery_Time, Service_Includes, Technology_Stack, image_url, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        if ($stmt->execute([$categoryId, $title, $desc, $price, $duration, $includes, $tech, $imageUrl, $nextOrder])) {
            $this->sendJson(["status" => "success", "message" => "New service added to section"]);
        } else {
            $this->sendJson(["status" => "error", "message" => "Failed to add service"], 500);
        }
    }

    public function deleteService(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) {
            $this->sendJson(["error" => "Unauthorized"], 401);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) {
            $this->sendJson(["error" => "Missing ID"], 400);
        }

        $pdo = $this->database->connect();
        $stmt = $pdo->prepare("DELETE FROM site_services WHERE id = ?");
        
        if ($stmt->execute([$id])) {
            $this->sendJson(["status" => "success", "message" => "Service deleted successfully"]);
        } else {
            $this->sendJson(["error" => "Delete failed"], 500);
        }
    }

    public function updateService(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) {
            $this->sendJson(["error" => "Unauthorized access login required"], 401);
        }

        $id = (int)($_POST['id'] ?? 0);
        if (!$id) $this->sendJson(["error" => "Missing service ID"], 400);

        $title = trim($_POST['Service_Name'] ?? '');
        $desc = trim($_POST['description'] ?? '');
        $price = trim($_POST['Base_Price'] ?? '');
        $duration = trim($_POST['Delivery_Time'] ?? '');
        
        $includes_raw = trim($_POST['Service_Includes'] ?? '');
        $tech_raw = trim($_POST['Technology_Stack'] ?? '');

        $includes_arr = array_filter(array_map('trim', explode(',', $includes_raw)));
        $tech_arr = array_filter(array_map('trim', explode(',', $tech_raw)));

        $includes = json_encode(array_values($includes_arr));
        $tech = json_encode(array_values($tech_arr));

        $updates = [
            "Service_Name = ?", "description = ?", "Base_Price = ?", 
            "Delivery_Time = ?", "Service_Includes = ?", "Technology_Stack = ?"
        ];
        $params = [$title, $desc, $price, $duration, $includes, $tech];

        // Handle GIF / Image Upload
        if (isset($_FILES['service_image']) && $_FILES['service_image']['error'] === UPLOAD_ERR_OK) {
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($_FILES['service_image']['tmp_name']);
            
            $allowed = ['image/gif', 'image/jpeg', 'image/png', 'image/webp'];
            if (in_array($mimeType, $allowed)) {
                $ext = pathinfo($_FILES['service_image']['name'], PATHINFO_EXTENSION);
                $name = uniqid('svc_', true) . '.' . $ext;
                $uploadDir = __DIR__ . '/../../public/uploads/services/';
                if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
                $localPath = $uploadDir . $name;
                
                if (move_uploaded_file($_FILES['service_image']['tmp_name'], $localPath)) {
                    // NEW: Upload to Cloudinary
                    $cloudUrl = $this->uploadToCloudinary($localPath, 'services');
                    if ($cloudUrl) {
                        $updates[] = "image_url = ?";
                        $params[] = $cloudUrl;
                        unlink($localPath);
                    }
                }
            }
        }

        $params[] = $id; // Add ID for WHERE clause
        $sql = "UPDATE site_services SET " . implode(", ", $updates) . " WHERE id = ?";
        
        try {
            $pdo = $this->database->connect();
            $stmt = $pdo->prepare($sql);
            if ($stmt->execute($params)) {
                $this->sendJson(["status" => "success", "message" => "Service updated successfully"]);
            } else {
                $this->sendJson(["error" => "Update failed during execution"], 500);
            }
        } catch (\Exception $e) {
            $this->sendJson(["error" => "Database error: " . $e->getMessage()], 500);
        }
    }

    /**
     * Projects Section Management
     */
    
    public function getProjectStats(): void
    {
        $pdo = $this->database->connect();
        
        // Time-based project counts using Start_Date
        $todayCount = $pdo->query("SELECT COUNT(*) FROM site_projects WHERE Start_Date = CURDATE()")->fetchColumn();
        $weekCount = $pdo->query("SELECT COUNT(*) FROM site_projects WHERE Start_Date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)")->fetchColumn();
        $monthCount = $pdo->query("SELECT COUNT(*) FROM site_projects WHERE Start_Date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)")->fetchColumn();

        // Completion metrics
        $total = (int)$pdo->query("SELECT COUNT(*) FROM site_projects")->fetchColumn() ?: 1;
        $completed = (int)$pdo->query("SELECT COUNT(*) FROM site_projects WHERE Status = 'Completed'")->fetchColumn();
        
        $percentage = round(($completed / $total) * 100);

        $this->sendJson([
            "status" => "success",
            "stats" => [
                "today" => (int)$todayCount,
                "week" => (int)$weekCount,
                "month" => (int)$monthCount,
                "total" => $total,
                "completed" => $completed,
                "percentage" => $percentage
            ]
        ]);
    }

    public function getRecentProjects(): void
    {
        $pdo = $this->database->connect();
        $stmt = $pdo->query("SELECT Project_name, Main_Image FROM site_projects ORDER BY ID DESC LIMIT 6");
        $projects = $stmt->fetchAll();
        $this->sendJson(["status" => "success", "projects" => $projects]);
    }

    public function getProjectsData(): void
    {
        $pdo = $this->database->connect();
               // Fetch Projects
        $stmt = $pdo->query("SELECT * FROM site_projects ORDER BY ID ASC");
        $projects = $stmt->fetchAll();
        
        // Fetch Gallery Images
        $galleryStmt = $pdo->query("SELECT * FROM project_gallery");
        $gallery = $galleryStmt->fetchAll();
        $galleryMap = [];
        foreach($gallery as $img) {
            $galleryMap[$img['project_id']][] = $img['Image_URL'];
        }

        // Attach gallery to projects
        foreach($projects as &$p) {
            $p['gallery'] = $galleryMap[$p['ID']] ?? [];
        }

        // Fetch Section Settings
        $setStmt = $pdo->query("SELECT * FROM site_settings WHERE setting_key IN ('projects_section_title', 'projects_section_subtitle')");
        $settings = $setStmt->fetchAll();
        $formattedSettings = [];
        foreach($settings as $s) $formattedSettings[$s['setting_key']] = $s['setting_value'];

        $this->sendJson([
            "status" => "success", 
            "projects" => $projects,
            "settings" => $formattedSettings
        ]);
    }

    public function addProject(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $pdo = $this->database->connect();
        
        $title = trim($_POST['Project_name'] ?? 'New Project');
        $desc = trim($_POST['Description'] ?? '');
        $category = trim($_POST['Service_Category'] ?? '');
        
        $budgetRaw = $_POST['Budget'] ?? '0';
        $budget = !empty($budgetRaw) ? (float)filter_var($budgetRaw, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION) : 0;
        
        $status = $_POST['Status'] ?? 'Planning';
        $client_id = !empty($_POST['client_id']) ? (int)$_POST['client_id'] : null;
        
        $startDate = !empty($_POST['Start_Date']) ? $_POST['Start_Date'] : null;
        $endDate = !empty($_POST['End_Date']) ? $_POST['End_Date'] : null;

        $features_raw = trim($_POST['Key_Features'] ?? '');
        $features_arr = array_filter(array_map('trim', explode(',', $features_raw)));
        $features = json_encode(array_values($features_arr));

        $mainImage = 'Assets/image/Aura.png'; // Default
        
        // Handle Image Upload during addition
        if (isset($_FILES['project_image']) && $_FILES['project_image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../../public/uploads/projects/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            
            $ext = pathinfo($_FILES['project_image']['name'], PATHINFO_EXTENSION);
            $name = uniqid('proj_', true) . '.' . $ext;
            $localPath = $uploadDir . $name;
            
            if (move_uploaded_file($_FILES['project_image']['tmp_name'], $localPath)) {
                // NEW: Upload to Cloudinary
                $cloudUrl = $this->uploadToCloudinary($localPath, 'projects');
                if ($cloudUrl) {
                    $mainImage = $cloudUrl;
                    unlink($localPath);
                }
            }
        }

        $sql = "INSERT INTO `site_projects` (`Project_name`, `Description`, `Service_Category`, `Budget`, `Status`, `client_id`, `Start_Date`, `End_Date`, `Key_Features`, `Main_Image`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $params = [$title, $desc, $category, $budget, $status, $client_id, $startDate, $endDate, $features, $mainImage];

        try {
            $stmt = $pdo->prepare($sql);
            if ($stmt->execute($params)) {
                $projId = $pdo->lastInsertId();

                // Handle Gallery Uploads (Max 4)
                if (isset($_FILES['project_gallery'])) {
                    $this->handleGalleryUpload($pdo, $projId, $_FILES['project_gallery']);
                }
                $this->sendJson(["status" => "success", "id" => $projId, "message" => "Project created with gallery"]);
            } else {
                $this->sendJson(["error" => "Insert failed at execution level"], 500);
            }
        } catch (\Exception $e) {
            $this->sendJson(["error" => "Database error during addition", "details" => $e->getMessage()], 500);
        }
    }

    public function updateProject(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $id = (int)($_POST['id'] ?? 0);
        $title = trim($_POST['Project_name'] ?? '');
        $desc = trim($_POST['Description'] ?? '');
        $category = trim($_POST['Service_Category'] ?? '');
        
        $budgetRaw = $_POST['Budget'] ?? '0';
        $budget = !empty($budgetRaw) ? (float)filter_var($budgetRaw, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION) : 0;
        
        $status = $_POST['Status'] ?? 'Planning';
        $client_id = !empty($_POST['client_id']) ? (int)$_POST['client_id'] : null;
        
        $startDate = !empty($_POST['Start_Date']) ? $_POST['Start_Date'] : null;
        $endDate = !empty($_POST['End_Date']) ? $_POST['End_Date'] : null;
        
        $features_raw = trim($_POST['Key_Features'] ?? '');
        $features_arr = array_filter(array_map('trim', explode(',', $features_raw)));
        $features = json_encode(array_values($features_arr));

        $updates = [
            "`Project_name` = ?", "`Description` = ?", "`Service_Category` = ?", 
            "`Key_Features` = ?", "`Budget` = ?", "`Status` = ?", 
            "`client_id` = ?", "`Start_Date` = ?", "`End_Date` = ?"
        ];
        $params = [$title, $desc, $category, $features, $budget, $status, $client_id, $startDate, $endDate];

        if (isset($_FILES['project_image']) && $_FILES['project_image']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../../public/uploads/projects/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            
            $ext = pathinfo($_FILES['project_image']['name'], PATHINFO_EXTENSION);
            $name = uniqid('proj_', true) . '.' . $ext;
            $localPath = $uploadDir . $name;
            
            if (move_uploaded_file($_FILES['project_image']['tmp_name'], $localPath)) {
                // NEW: Upload to Cloudinary
                $cloudUrl = $this->uploadToCloudinary($localPath, 'projects');
                if ($cloudUrl) {
                    $updates[] = "`Main_Image` = ?";
                    $params[] = $cloudUrl;
                    unlink($localPath);
                }
            }
        }

        $params[] = $id;
        try {
            $pdo = $this->database->connect();
            $sql = "UPDATE `site_projects` SET " . implode(", ", $updates) . " WHERE `ID` = ?";
            
            if ($pdo->prepare($sql)->execute($params)) {
                // Handle Gallery Uploads (Max 4)
                if (isset($_FILES['project_gallery'])) {
                    // Optional: Clear existing gallery before adding new ones
                    // $pdo->prepare("DELETE FROM project_gallery WHERE project_id = ?")->execute([$id]);
                    $this->handleGalleryUpload($pdo, $id, $_FILES['project_gallery']);
                }

                $this->sendJson(["status" => "success", "message" => "Project updated with gallery"]);
            } else {
                $this->sendJson(["error" => "Update failed during execution"], 500);
            }
        } catch (\Exception $e) {
            $this->sendJson(["error" => "Database error during update", "details" => $e->getMessage()], 500);
        }
    }

    public function deleteProject(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 410);

        $id = (int)($_POST['id'] ?? 0);
        $pdo = $this->database->connect();
        $stmt = $pdo->prepare("DELETE FROM site_projects WHERE id = ?");
        
        if ($stmt->execute([$id])) {
            $this->sendJson(["status" => "success", "message" => "Project deleted"]);
        } else {
            $this->sendJson(["error" => "Delete failed"], 500);
        }
    }

    public function updateProjectSettings(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $title = trim($_POST['title'] ?? '');
        $subtitle = trim($_POST['subtitle'] ?? '');

        $pdo = $this->database->connect();
        $pdo->prepare("UPDATE site_settings SET setting_value = ? WHERE setting_key = 'projects_section_title'")->execute([$title]);
        $pdo->prepare("UPDATE site_settings SET setting_value = ? WHERE setting_key = 'projects_section_subtitle'")->execute([$subtitle]);

        $this->sendJson(["status" => "success", "message" => "Heading updated"]);
    }

    /**
     * =========================================
     * CLEINTS MANAGEMENT
     * =========================================
     */
    public function getClientsData(): void
    {
        $pdo = $this->database->connect();
        $stmt = $pdo->query("SELECT * FROM clients ORDER BY ID DESC");
        $this->sendJson([
            "status" => "success",
            "clients" => $stmt->fetchAll()
        ]);
    }

    public function addClient(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $name = trim($_POST['company_name'] ?? '');
        $email = filter_var($_POST['contact_email'] ?? '', FILTER_SANITIZE_EMAIL);

        if (empty($name) || empty($email)) {
             $this->sendJson(["error" => "Company name and email are required"], 400);
        }

        $pdo = $this->database->connect();
        $stmt = $pdo->prepare("INSERT INTO clients (Company_name, Contact_email) VALUES (?, ?)");
        
        try {
            if ($stmt->execute([$name, $email])) {
                $this->sendJson(["status" => "success", "message" => "Client registered successfully"]);
            } else {
                $this->sendJson(["error" => "Failed to create client"], 500);
            }
        } catch (PDOException $e) {
            $this->sendJson(["error" => "Database error", "message" => $e->getMessage()], 500);
        }
    }

    public function updateClient(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $id = filter_var($_POST['id'] ?? '', FILTER_VALIDATE_INT);
        $name = filter_var($_POST['company_name'] ?? '', FILTER_SANITIZE_SPECIAL_CHARS);
        $email = filter_var($_POST['contact_email'] ?? '', FILTER_SANITIZE_EMAIL);

        if (!$id) $this->sendJson(["error" => "Invalid ID"], 400);

        $pdo = $this->database->connect();
        $stmt = $pdo->prepare("UPDATE clients SET Company_name = ?, Contact_email = ? WHERE ID = ?");
        
        if ($stmt->execute([$name, $email, $id])) {
            $this->sendJson(["status" => "success", "message" => "Client updated successfully"]);
        } else {
            $this->sendJson(["error" => "Failed to update client"], 500);
        }
    }

    public function deleteClient(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $id = filter_var($_POST['id'] ?? '', FILTER_VALIDATE_INT);
        if (!$id) $this->sendJson(["error" => "Invalid ID"], 400);

        $pdo = $this->database->connect();

        // Check for associated projects first
        $checkStmt = $pdo->prepare("SELECT COUNT(*) as project_count FROM site_projects WHERE client_id = ?");
        $checkStmt->execute([$id]);
        $result = $checkStmt->fetch();

        if ($result && (int)$result['project_count'] > 0) {
            $this->sendJson([
                "error" => "dependency_error",
                "message" => "Cannot delete client. This client has " . $result['project_count'] . " associated project(s). Please delete or reassign projects first."
            ], 400);
            return;
        }

        $stmt = $pdo->prepare("DELETE FROM clients WHERE ID = ?");
        
        if ($stmt->execute([$id])) {
            $this->sendJson(["status" => "success", "message" => "Client deleted successfully"]);
        } else {
            $this->sendJson(["error" => "Delete failed"], 500);
        }
    }

    /**
     * =========================================
     * EMPLOYEES MANAGEMENT
     * =========================================
     */
    public function getEmployeesData(): void
    {
        $pdo = $this->database->connect();
        $stmt = $pdo->query("SELECT * FROM employees ORDER BY Full_name ASC");
        $this->sendJson([
            "status" => "success",
            "employees" => $stmt->fetchAll()
        ]);
    }

    public function addEmployee(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $name = trim($_POST['full_name'] ?? 'New Member');
        $role = trim($_POST['role'] ?? 'Staff');
        $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
        $rate = filter_var($_POST['hourly_rate'] ?? 20.00, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        $joiningDate = $_POST['joining_date'] ?? date('Y-m-d');

        if (!$email) {
            $email = 'emp_' . uniqid() . '@algraphy.com'; // fallback
        }

        $profilePicPath = null;
        if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../../public/uploads/employees/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            
            $fileExtension = pathinfo($_FILES['profile_pic']['name'], PATHINFO_EXTENSION);
            $fileName = 'emp_' . time() . '_' . uniqid() . '.' . $fileExtension;
            $targetPath = $uploadDir . $fileName;

            if (move_uploaded_file($_FILES['profile_pic']['tmp_name'], $targetPath)) {
                $profilePicPath = 'uploads/employees/' . $fileName;
            }
        }

        $pdo = $this->database->connect();
        $stmt = $pdo->prepare("INSERT INTO employees (Full_name, Role, Email, hourly_rate, profile_pic, joining_date) VALUES (?, ?, ?, ?, ?, ?)");
        
        try {
            if ($stmt->execute([$name, $role, $email, $rate, $profilePicPath, $joiningDate])) {
                $this->sendJson(["status" => "success", "message" => "Employee added successfully"]);
            } else {
                $this->sendJson(["error" => "Failed to add employee"], 500);
            }
        } catch (PDOException $e) {
            $this->sendJson(["error" => "Database error", "message" => $e->getMessage()], 500);
        }
    }

    public function updateEmployee(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $id = filter_var($_POST['id'] ?? '', FILTER_VALIDATE_INT);
        $name = trim($_POST['full_name'] ?? '');
        $role = trim($_POST['role'] ?? '');
        $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
        $hourlyRate = filter_var($_POST['hourly_rate'] ?? '', FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        $joiningDate = $_POST['joining_date'] ?? null;

        if (!$id) $this->sendJson(["error" => "Invalid ID"], 400);

        $updates = ["Full_name = ?", "Role = ?", "Email = ?", "hourly_rate = ?", "joining_date = ?"];
        $params = [$name, $role, $email, $hourlyRate, $joiningDate];

        // Handle Profile Picture Upload
        if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = __DIR__ . '/../../public/uploads/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
            
            $ext = pathinfo($_FILES['profile_pic']['name'], PATHINFO_EXTENSION);
            $picName = uniqid('profile_', true) . '.' . $ext;
            
            if (move_uploaded_file($_FILES['profile_pic']['tmp_name'], $uploadDir . $picName)) {
                $updates[] = "profile_pic = ?";
                $params[] = 'uploads/' . $picName; // matches the DB's directory pattern
            }
        }

        $params[] = $id;
        $pdo = $this->database->connect();
        $sql = "UPDATE employees SET " . implode(", ", $updates) . " WHERE ID = ?";
        
        if ($pdo->prepare($sql)->execute($params)) {
            $this->sendJson(["status" => "success", "message" => "Employee updated successfully"]);
        } else {
            $this->sendJson(["error" => "Failed to update employee"], 500);
        }
    }

    public function deleteEmployee(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $id = filter_var($_POST['id'] ?? '', FILTER_VALIDATE_INT);
        if (!$id) $this->sendJson(["error" => "Invalid ID"], 400);

        $pdo = $this->database->connect();
        $stmt = $pdo->prepare("DELETE FROM employees WHERE ID = ?");
        
        if ($stmt->execute([$id])) {
            $this->sendJson(["status" => "success", "message" => "Employee deleted"]);
        } else {
            $this->sendJson(["error" => "Delete failed"], 500);
        }
    }

    /**
     * Public endpoint to capture contact form inquiries (Leads).
     */
    public function submitLead(): void
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendJson(["status" => "error", "message" => "Method not allowed"], 405);
        }

        $name = filter_var($_POST['name'] ?? '', FILTER_SANITIZE_SPECIAL_CHARS);
        $phone = filter_var($_POST['phone'] ?? '', FILTER_SANITIZE_SPECIAL_CHARS);
        $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
        
        $date = !empty($_POST['date']) ? $_POST['date'] : null;
        $timeValue = !empty($_POST['time']) ? $_POST['time'] : null;

        if (empty($name) || empty($phone) || empty($email)) {
            $this->sendJson(["status" => "error", "message" => "Full name, phone and email are required."], 400);
        }

        try {
            $pdo = $this->database->connect();
            // Using reverse quotes for table/column names to avoid reserved keyword conflicts
            $sql = "INSERT INTO `potential_clients` (`Client_Name`, `Phone_Number`, `Email_Address`, `Appointment_Date`, `Preferred_Time`) VALUES (?, ?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            
            if ($stmt->execute([$name, $phone, $email, $date, $timeValue])) {
                $this->sendJson([
                    "status" => "success", 
                    "title" => "Great choice!",
                    "message" => "Your inquiry is on its way. Our team will reach out to you shortly to discuss your vision."
                ]);
            } else {
                $this->sendJson(["status" => "error", "message" => "Execution failed without exception."], 500);
            }
        } catch (\Exception $e) {
            $this->sendJson(["status" => "error", "message" => "Database error.", "details" => $e->getMessage()], 500);
        }
    }

    /**
     * Get all leads for admin
     */
    public function getLeads(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $pdo = $this->database->connect();
        $stmt = $pdo->query("SELECT * FROM potential_clients ORDER BY Created_At DESC");
        $this->sendJson(["status" => "success", "leads" => $stmt->fetchAll()]);
    }

    /**
     * Update lead contact status
     */
    public function updateLeadStatus(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $id = (int)($_POST['id'] ?? 0);
        $status = $_POST['status'] ?? 'Pending';

        if (!$id) $this->sendJson(["error" => "Missing ID"], 400);

        $pdo = $this->database->connect();
        $stmt = $pdo->prepare("UPDATE potential_clients SET status = ? WHERE ID = ?");
        
        if ($stmt->execute([$status, $id])) {
            $this->sendJson(["status" => "success", "message" => "Lead status updated"]);
        } else {
            $this->sendJson(["error" => "Update failed"], 500);
        }
    }


    /**
     * Stats Analytics (The Master Query)
     * Aggregates by Project and lists all involved employees.
     */
    public function getStatsMaster(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $pdo = $this->database->connect();
        
        $sql = "SELECT 
            p.ID AS Project_ID,
            p.Project_name,
            c.Company_name,
            GROUP_CONCAT(DISTINCT e.Full_name SEPARATOR ', ') AS Employee_Names,
            SUM(e.hourly_rate) AS Employee_Rates,
            p.Budget AS Project_Budget,
            COALESCE(SUM(t.Hours_worked), 0) AS Total_Hours_Worked,
            CAST(COALESCE(SUM(t.Hours_worked * e.hourly_rate), 0) AS DECIMAL(15, 2)) AS Total_Cost
        FROM site_projects p
        LEFT JOIN clients c ON p.client_id = c.ID
        LEFT JOIN time_logs t ON p.ID = t.project_id
        LEFT JOIN employees e ON t.employee_id = e.ID
        GROUP BY 
            p.ID, p.Project_name, c.Company_name, p.Budget
        ORDER BY p.ID ASC, Total_Cost DESC";

        try {
            $stmt = $pdo->query($sql);
            $this->sendJson(["status" => "success", "data" => $stmt->fetchAll()]);
        } catch (PDOException $e) {
            $this->sendJson(["status" => "error", "message" => "Failed to fetch stats: " . $e->getMessage()], 500);
        }
    }

    /**
     * Multi-resource project assignment (Sync Model)
     */
    public function logAssignment(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 401);

        $projectId = (int)($_POST['project_id'] ?? 0);
        $employeeIds = $_POST['employees'] ?? [];
        $hours = $_POST['hours'] ?? [];

        if (!$projectId) {
            $this->sendJson(["status" => "error", "message" => "Project ID required."], 400);
        }

        $pdo = $this->database->connect();

        try {
            $pdo->beginTransaction();
            
            // First, clear existing assignments if any (Sync mode)
            $pdo->prepare("DELETE FROM time_logs WHERE project_id = ?")->execute([$projectId]);

            $stmt = $pdo->prepare("INSERT INTO time_logs (project_id, employee_id, Hours_worked) VALUES (?, ?, ?)");
            foreach ($employeeIds as $index => $empId) {
                if ($empId && isset($hours[$index])) {
                    $stmt->execute([$projectId, (int)$empId, (float)$hours[$index]]);
                }
            }
            $pdo->commit();
            $this->sendJson(["status" => "success", "message" => "Team resources successfully synchronized."]);
        } catch (\Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            $this->sendJson(["status" => "error", "message" => $e->getMessage()], 500);
        }
    }

    /**
     * Clear all resources from a project
     */
    public function deleteAssignments(): void
    {
        if (session_status() === PHP_SESSION_NONE) session_start();
        if (!isset($_SESSION['user_id'])) $this->sendJson(["error" => "Unauthorized"], 410);

        $projectId = (int)($_POST['project_id'] ?? 0);
        if (!$projectId) $this->sendJson(["error" => "Invalid Project ID"], 400);

        $pdo = $this->database->connect();
        $stmt = $pdo->prepare("DELETE FROM time_logs WHERE project_id = ?");
        
        if ($stmt->execute([$projectId])) {
            $this->sendJson(["status" => "success", "message" => "All resource logs cleared for this project."]);
        } else {
            $this->sendJson(["error" => "Purge failed"], 500);
        }
    }
    
    /**
     * Get details for a specific project assignment (for editing)
     */
    public function getProjectAssignments(): void
    {
        $id = (int)($_GET['project_id'] ?? 0);
        $pdo = $this->database->connect();
        $stmt = $pdo->prepare("SELECT employee_id, Hours_worked FROM time_logs WHERE project_id = ?");
        $stmt->execute([$id]);
        $this->sendJson(["status" => "success", "assignments" => $stmt->fetchAll()]);
    }

    /**
     * Helper: Send JSON Response
     */
    protected function sendJson(mixed $data, int $statusCode = 200): void
    {
        header('Content-Type: application/json');
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }

    /**
     * Helper: Handle multi-file gallery uploads
     */
    private function handleGalleryUpload($pdo, $projectId, $files): void
    {
        $uploadDir = __DIR__ . '/../../public/uploads/projects/gallery/';
        if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);

        // Limit to 4 images
        $count = count($files['name']);
        $limit = min($count, 4);

        for ($i = 0; $i < $limit; $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $ext = pathinfo($files['name'][$i], PATHINFO_EXTENSION);
                $name = uniqid('gal_' . $projectId . '_', true) . '.' . $ext;
                $localPath = $uploadDir . $name;
                
                if (move_uploaded_file($files['tmp_name'][$i], $localPath)) {
                    // NEW: Upload to Cloudinary
                    $cloudUrl = $this->uploadToCloudinary($localPath, 'project_gallery');
                    if ($cloudUrl) {
                        $pdo->prepare("INSERT INTO project_gallery (project_id, Image_URL) VALUES (?, ?)")
                            ->execute([$projectId, $cloudUrl]);
                        unlink($localPath);
                    }
                }
            }
        }
    }

    /* --- 10. Footer Management (NEW) --- */
    public function getFooterData(): void {
        $pdo = $this->database->connect();
        $stmt = $pdo->query("SELECT * FROM site_footer_links ORDER BY category, order_index ASC");
        $links = $stmt->fetchAll();
        $this->sendJson(["status" => "success", "data" => $links]);
    }

    public function getReportsFinancials(): void {
        $pdo = $this->database->connect();
        $sql = "SELECT p.ID as Project_ID, p.Project_name, c.Company_name, 
                       p.Budget as Project_Budget,
                       GROUP_CONCAT(DISTINCT e.Full_name SEPARATOR ', ') as Employee_Names,
                       SUM(tl.hours_worked) as Total_Hours_Worked,
                       SUM(tl.hours_worked * e.hourly_rate) as Total_Cost,
                       SUM(e.hourly_rate) as Employee_Rates
                FROM site_projects p
                LEFT JOIN site_clients c ON p.client_id = c.ID
                LEFT JOIN site_time_logs tl ON p.ID = tl.project_id
                LEFT JOIN site_employees e ON tl.employee_id = e.ID
                GROUP BY p.ID";

        $stmt = $pdo->query($sql);
        $data = $stmt->fetchAll();

        // Bonus: Using PHP 8 match expression to map profitability or project tags dynamically
        // Just for demonstration as requested in Phase 3
        foreach ($data as &$row) {
            $budget = (float)($row['Project_Budget'] ?? 0);
            $cost = (float)($row['Total_Cost'] ?? 0);
            
            $row['Profitability_Status'] = match (true) {
                $cost == 0 => 'Untouched',
                $cost > $budget => 'OVER BUDGET',
                $cost > ($budget * 0.8) => 'Critical',
                default => 'Healthy'
            };
        }

        $this->sendJson(["status" => "success", "data" => $data]);
    }

    public function addFooterLink(): void {
        $pdo = $this->database->connect();
        $category = $_POST['category'] ?? 'CONTACT';
        $title = $_POST['title'] ?? '';
        $url = $_POST['url'] ?? '';

        if (empty($title)) {
            $this->sendJson(["status" => "error", "message" => "Title is required"], 400);
            return;
        }

        $stmt = $pdo->prepare("INSERT INTO site_footer_links (category, title, url) VALUES (?, ?, ?)");
        $stmt->execute([$category, $title, $url]);

        $this->sendJson(["status" => "success", "message" => "Link added"]);
    }

    public function updateFooterLink(): void {
        $pdo = $this->database->connect();
        $id = $_POST['id'] ?? null;
        $title = $_POST['title'] ?? '';
        $url = $_POST['url'] ?? '';

        if (!$id || empty($title)) {
            $this->sendJson(["status" => "error", "message" => "ID and Title required"], 400);
            return;
        }

        $stmt = $pdo->prepare("UPDATE site_footer_links SET title = ?, url = ? WHERE id = ?");
        $stmt->execute([$title, $url, $id]);

        $this->sendJson(["status" => "success", "message" => "Link updated"]);
    }

    public function deleteFooterLink(): void {
        $pdo = $this->database->connect();
        $id = $_POST['id'] ?? null;

        if (!$id) {
            $this->sendJson(["status" => "error", "message" => "Link ID required"], 400);
            return;
        }

        $stmt = $pdo->prepare("DELETE FROM site_footer_links WHERE id = ?");
        $stmt->execute([$id]);

        $this->sendJson(["status" => "success", "message" => "Link deleted"]);
    }
}
