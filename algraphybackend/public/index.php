<?php
/**
 * AlGraphy Studio — Front Controller (Entry Point)
 * 
 * TABLE OF CONTENTS:
 * 1. Initialization & Autoloading
 * 2. CORS & Security Headers
 * 3. Database & Shared Service Initialization
 * 4. Main Routing Logic
 * 5. Output Buffering Flush
 * 
 * @package AlGraphy
 */

declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

if (getenv('VERCEL') === '1') {
    session_save_path('/tmp');
    session_set_cookie_params([
        'lifetime' => 86400, // 24 hours
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'None' // Critical for cross-domain or serverless stability
    ]);
} else {
    // Localhost: Set path to /algraphy/ to cover all subfolders
    session_set_cookie_params([
        'lifetime' => 3600,
        'path' => '/algraphy/',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

session_start(); // Resume session for administrative authentication
ob_start(); // Buffer output to prevent header issues

// 1. Initialization & Autoloading
$rootPath = realpath(__DIR__ . '/../..');
$backendPath = realpath(__DIR__ . '/..');

$autoloadPaths = [
    $rootPath . '/vendor/autoload.php',
    $backendPath . '/vendor/autoload.php'
];

$autoloadFound = false;
foreach ($autoloadPaths as $path) {
    if ($path && file_exists($path)) {
        require_once $path;
        $autoloadFound = true;
        break;
    }
}

// Ensure AlGraphy classes are always findable even without vendor
spl_autoload_register(function ($class) {
    $prefix = 'AlGraphy\\';
    $base_dir = __DIR__ . '/../src/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) return;
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) require $file;
});

$config = require __DIR__ . '/../src/config.php';
use AlGraphy\Database;
use AlGraphy\Controllers\AuthController;
use AlGraphy\Controllers\ApiController;
use AlGraphy\Controllers\ClientAuthController;

// 2. CORS & Security Headers
header("Content-Type: application/json");
// Dynamically allow the current origin for cross-origin requests with credentials
header("Access-Control-Allow-Origin: " . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost')); 
header("Access-Control-Allow-Credentials: true"); 
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 3. Database & Shared Service Initialization
$config = require __DIR__ . '/../src/config.php';
$db = new Database(
    $config['db_host'],
    $config['db_name'],
    $config['db_user'],
    $config['db_pass'],
    (int)$config['db_port']
);

// Resolve the request URI
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// 4. Main Routing Logic
if (strpos($uri, '/test-db') !== false) {
    // Health check endpoint for DB connectivity
    $db->connect();
    echo json_encode(["status" => "success", "message" => "Database Connected!"]);

} elseif (strpos($uri, '/login') !== false) {
    // Professional/Employee login
    $auth = new AuthController($db);
    $auth->login();

} elseif (strpos($uri, '/logout') !== false) {
    // Session termination
    $auth = new AuthController($db);
    $auth->logout();

} elseif (strpos($uri, '/api/reports/financials') !== false) {
    // Master Financial Report query results
    $api = new ApiController($db);
    $api->getFinancials();

} elseif (strpos($uri, '/api/client/login') !== false) {
    // Client-specific login
    $clientAuth = new ClientAuthController($db);
    $clientAuth->login();

} elseif (strpos($uri, '/api/client/signup') !== false) {
    // Client-specific registration
    $clientAuth = new ClientAuthController($db);
    $clientAuth->signup();

} elseif (strpos($uri, '/api/client/profile/update') !== false) {
    // Profile update routing for both Employees and Clients
    if (session_status() === PHP_SESSION_NONE) session_start();
    
    if (isset($_SESSION['user_id'])) {
        $api = new ApiController($db);
        $api->updateProfile();
    } else {
        $clientAuth = new ClientAuthController($db);
        $clientAuth->updateProfile();
    }

} elseif (strpos($uri, '/api/client/profile') !== false) {
    // Unified Profile retrieval logic
    if (session_status() === PHP_SESSION_NONE) session_start();
    
    if (isset($_SESSION['user_id'])) {
        // Retrieve internal employee profile data
        $stmt = $db->connect()->prepare("SELECT Full_name as full_name, Email as email, Role as role, profile_pic FROM employees WHERE ID = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        
        if ($user) {
            $protocol = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http");
            $host = $_SERVER['HTTP_HOST'];
            $baseUrl = "$protocol://$host";
            
            // Clean logic for production
            // Clean Cloudinary-friendly logic
            $pic = $user['profile_pic'];
            $defaultAvatar = "https://res.cloudinary.com/virgvitp/image/upload/v1776688393/izxyozx3bjl3tmeoh4np.jpg";

            if ($pic && (strpos($pic, 'http') !== false || strpos($pic, 'res.cloudinary.com') !== false)) {
                // It's a cloud URL, just ensure it's HTTPS
                $fullImagePath = str_replace('http://', 'https://', $pic);
            } else {
                // It's a legacy local path or empty, use the Cloudinary default
                $fullImagePath = $defaultAvatar;
            }

            echo json_encode([
                "status" => "success",
                "user" => [
                    "full_name" => $user['full_name'],
                    "email" => $user['email'],
                    "role" => $user['role'],
                    "profile_image" => $fullImagePath
                ]
            ]);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Employee not found."]);
        }
    } else {
        // Delegate to Client Controller for guest/user profiles
        $clientAuth = new ClientAuthController($db);
        $clientAuth->getProfile();
    }
} elseif (strpos($uri, '/api/site/hero/update') !== false) {
    // Protected endpoint to update site hero content
    $api = new ApiController($db);
    $api->updateHero();

} elseif (strpos($uri, '/api/services/category/update') !== false) {
    // NEW: Update service category (The Section Tab)
    $api = new ApiController($db);
    $api->updateCategory();

} elseif (strpos($uri, '/api/services/category/add') !== false) {
    $api = new ApiController($db);
    $api->addCategory();

} elseif (strpos($uri, '/api/services/category/delete') !== false) {
    $api = new ApiController($db);
    $api->deleteCategory();

} elseif (strpos($uri, '/api/site/hero') !== false) {
    // Endpoint to retrieve site hero content
    $api = new ApiController($db);
    $api->getHero();

} elseif (strpos($uri, '/api/services/add') !== false) {
    $api = new ApiController($db);
    $api->addService();

} elseif (strpos($uri, '/api/services/delete') !== false) {
    $api = new ApiController($db);
    $api->deleteService();

} elseif (strpos($uri, '/api/services/update') !== false) {
    // NEW: Update service card details and GIF
    $api = new ApiController($db);
    $api->updateService();

} elseif (strpos($uri, '/api/projects/update') !== false) {
    $api = new ApiController($db);
    $api->updateProject();

} elseif (strpos($uri, '/api/projects/delete') !== false) {
    $api = new ApiController($db);
    $api->deleteProject();

} elseif (strpos($uri, '/api/projects/add') !== false) {
    $api = new ApiController($db);
    $api->addProject();

} elseif (strpos($uri, '/api/projects/settings/update') !== false) {
    $api = new ApiController($db);
    $api->updateProjectSettings();

} elseif (strpos($uri, '/api/projects/stats') !== false) {
    $api = new ApiController($db);
    $api->getProjectStats();

} elseif (strpos($uri, '/api/projects/recent') !== false) {
    $api = new ApiController($db);
    $api->getRecentProjects();

} elseif (strpos($uri, '/api/projects/data') !== false) {
    $api = new ApiController($db);
    $api->getProjectsData();

} elseif (strpos($uri, '/api/services/data') !== false) {
    // NEW: Get categories and services
    $api = new ApiController($db);
    $api->getServicesData();

} elseif (strpos($uri, '/api/clients/data') !== false) {
    $api = new ApiController($db);
    $api->getClientsData();

} elseif (strpos($uri, '/api/clients/add') !== false) {
    $api = new ApiController($db);
    $api->addClient();

} elseif (strpos($uri, '/api/clients/update') !== false) {
    $api = new ApiController($db);
    $api->updateClient();

} elseif (strpos($uri, '/api/clients/delete') !== false) {
    $api = new ApiController($db);
    $api->deleteClient();

// Employees Endpoints
} elseif (strpos($uri, '/api/employees/data') !== false) {
    $api = new ApiController($db);
    $api->getEmployeesData();

} elseif (strpos($uri, '/api/employees/add') !== false) {
    $api = new ApiController($db);
    $api->addEmployee();

} elseif (strpos($uri, '/api/employees/update') !== false) {
    $api = new ApiController($db);
    $api->updateEmployee();

} elseif (strpos($uri, '/api/employees/delete') !== false) {
    $api = new ApiController($db);
    $api->deleteEmployee();

} elseif (strpos($uri, '/api/leads/data') !== false) {
    $api = new ApiController($db);
    $api->getLeads();

} elseif (strpos($uri, '/api/leads/status') !== false) {
    $api = new ApiController($db);
    $api->updateLeadStatus();

} elseif (strpos($uri, '/api/leads/submit') !== false) {
    $api = new ApiController($db);
    $api->submitLead();

} elseif (strpos($uri, '/api/stats/assignments/delete') !== false) {
    $api = new ApiController($db);
    $api->deleteAssignments();

} elseif (strpos($uri, '/api/stats/assignments/get') !== false) {
    $api = new ApiController($db);
    $api->getProjectAssignments();

} elseif (strpos($uri, '/api/stats/assign') !== false) {
    $api = new ApiController($db);
    $api->logAssignment();

} elseif (strpos($uri, '/api/stats/master') !== false) {
    $api = new ApiController($db);
    $api->getStatsMaster();

} elseif (strpos($uri, '/api/site/footer/data') !== false) {
    $api = new ApiController($db);
    $api->getFooterData();

} elseif (strpos($uri, '/api/site/footer/add') !== false) {
    $api = new ApiController($db);
    $api->addFooterLink();

} elseif (strpos($uri, '/api/site/footer/update') !== false) {
    $api = new ApiController($db);
    $api->updateFooterLink();

} elseif (strpos($uri, '/api/site/footer/delete') !== false) {
    $api = new ApiController($db);
    $api->deleteFooterLink();

} else {
    // Fallback for undefined routes
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Route not found."]);
}

// 5. Output Buffering Flush
ob_end_flush();