<?php
/**
 * AlGraphy Studio — Vercel Path Diagnostic Tool
 * This file helps identify routing and pathing issues in production.
 */

header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$debug = [
    "status" => "diagnostic_active",
    "session_data" => $_SESSION,
    "server_info" => [
        "request_uri" => $_SERVER['REQUEST_URI'],
        "script_name" => $_SERVER['SCRIPT_NAME'],
        "http_host" => $_SERVER['HTTP_HOST'],
        "is_https" => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on'),
        "env_vercel" => getenv('VERCEL') ?: 'not_detected'
    ],
    "filesystem_check" => [
        "current_dir" => __DIR__,
        "root_files" => scandir(__DIR__ . '/../'),
        "dashboard_exists" => is_dir(__DIR__ . '/../dashboard'),
        "dashboard_js_exists" => is_dir(__DIR__ . '/../dashboard/js'),
        "vendor_exists" => is_dir(__DIR__ . '/../algraphybackend/vendor')
    ],
    "session_info" => [
        "session_status" => session_status(),
        "save_path" => session_save_path()
    ]
];

echo json_encode($debug, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
exit;
