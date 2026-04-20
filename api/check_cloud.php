<?php
require_once __DIR__ . '/../algraphybackend/vendor/autoload.php';
$config = require __DIR__ . '/../algraphybackend/src/config.php';

use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Admin\AdminApi;

header('Content-Type: application/json');

$results = [
    'status' => 'analyzing',
    'timestamp' => date('Y-m-d H:i:s'),
    'configuration' => [
        'cloud_name' => $config['cloudinary']['cloud_name'],
        'api_key_last_4' => substr($config['cloudinary']['api_key'], -4),
        'has_secret' => !empty($config['cloudinary']['api_secret'])
    ],
    'checks' => []
];

try {
    // 1. Check if SDK is loaded
    if (class_exists('Cloudinary\Configuration\Configuration')) {
        $results['checks']['sdk_loaded'] = "OK ✅";
    } else {
        throw new Exception("Cloudinary SDK not found. Check vendor folder.");
    }

    // 2. Test Configuration
    Configuration::instance([
        'cloud' => [
            'cloud_name' => $config['cloudinary']['cloud_name'],
            'api_key'    => $config['cloudinary']['api_key'],
            'api_secret' => $config['cloudinary']['api_secret']
        ],
        'url' => ['secure' => true]
    ]);
    $results['checks']['config_init'] = "OK ✅";

    // 3. Simple Ping to Cloudinary API
    $adminApi = new AdminApi();
    $ping = $adminApi->ping();
    $results['checks']['api_connection'] = "OK ✅ (Connected to Cloudinary)";
    
    $results['status'] = 'success';

} catch (\Exception $e) {
    $results['status'] = 'error';
    $results['error_message'] = $e->getMessage();
}

echo json_encode($results, JSON_PRETTY_PRINT);
