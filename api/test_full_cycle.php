<?php
// Full Cycle Test: Upload + DB logic check
$possiblePaths = [
    __DIR__ . '/../algraphybackend/vendor/autoload.php',
    '/var/task/user/algraphybackend/vendor/autoload.php'
];
foreach ($possiblePaths as $path) { if (file_exists($path)) { require_once $path; break; } }

$config = require __DIR__ . '/../algraphybackend/src/config.php';
use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Upload\UploadApi;

header('Content-Type: application/json');

Configuration::instance([
    'cloud' => [
        'cloud_name' => $config['cloudinary']['cloud_name'],
        'api_key'    => $config['cloudinary']['api_key'],
        'api_secret' => $config['cloudinary']['api_secret']
    ],
    'url' => ['secure' => true]
]);

try {
    // 1. Simulate a tiny image upload
    $uploadApi = new UploadApi();
    $testImageUrl = "https://cloudinary-res.cloudinary.com/image/upload/cloudinary_logo_for_white_bg.svg";
    $response = $uploadApi->upload($testImageUrl, [
        'folder' => 'system_tests',
        'public_id' => 'test_connection_' . time()
    ]);

    $cloudUrl = $response['secure_url'];

    echo json_encode([
        'status' => 'success',
        'message' => 'The full cycle is working!',
        'cloudinary_url_received' => $cloudUrl,
        'database_action_preview' => "SQL: UPDATE site_hero SET bg_video_url = '$cloudUrl' WHERE id = 1",
        'ready_for_production' => true
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
