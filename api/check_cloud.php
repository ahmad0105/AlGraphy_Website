<?php
// Intelligent Autoload Discovery for Vercel
$possiblePaths = [
    __DIR__ . '/../vendor/autoload.php',
    __DIR__ . '/../algraphybackend/vendor/autoload.php'
];

$autoloadFound = false;
foreach ($possiblePaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $autoloadFound = $path;
        break;
    }
}

header('Content-Type: application/json');

$results = [
    'status' => 'analyzing',
    'timestamp' => date('Y-m-d H:i:s'),
    'path_found' => $autoloadFound,
    'current_dir' => __DIR__,
    'doc_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'unknown',
    'dir_listing' => []
];

// List root files and internal backend files
try {
    $rootPath = realpath(__DIR__ . '/..');
    $results['root_listing'] = scandir($rootPath);
    
    $backendPath = $rootPath . '/algraphybackend';
    if (is_dir($backendPath)) {
        $results['backend_listing'] = scandir($backendPath);
        // Check for vendor specifically
        $vendorPath = $backendPath . '/vendor';
        $results['vendor_exists'] = is_dir($vendorPath);
        if ($results['vendor_exists']) {
            $results['vendor_listing_preview'] = array_slice(scandir($vendorPath), 0, 10);
        }
    } else {
        $results['backend_status'] = "Folder NOT found at $backendPath";
    }
} catch (Exception $e) {
    $results['scan_error'] = $e->getMessage();
}

if (!$autoloadFound) {
    echo json_encode(['error' => 'Autoload not found', 'checked_paths' => $possiblePaths, 'debug' => $results]);
    exit;
}

$config = require __DIR__ . '/../algraphybackend/src/config.php';
use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Admin\AdminApi;

try {
    Configuration::instance([
        'cloud' => [
            'cloud_name' => $config['cloudinary']['cloud_name'],
            'api_key'    => $config['cloudinary']['api_key'],
            'api_secret' => $config['cloudinary']['api_secret']
        ],
        'url' => ['secure' => true]
    ]);
    
    $adminApi = new AdminApi();
    $ping = $adminApi->ping();
    $results['status'] = 'success';
    $results['cloudinary_connection'] = 'OK ✅';
} catch (Exception $e) {
    $results['status'] = 'error';
    $results['error'] = $e->getMessage();
    $results['cloudinary_connection'] = 'Failed ❌';
    
}

echo json_encode($results, JSON_PRETTY_PRINT);
