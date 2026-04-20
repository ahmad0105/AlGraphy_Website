<?php
/**
 * AlGraphy Studio — System Configuration
 * CENTRALIZED ENVIRONMENT RECEPTION
 */

require_once __DIR__ . '/EnvLoader.php';

// Load .env from root if exists (Local Fallback)
\AlGraphy\EnvLoader::load(__DIR__ . '/../../.env');

return [
    'db_host' => getenv('DB_HOST') ?: 'localhost',
    'db_name' => getenv('DB_NAME') ?: 'landing_page',
    'db_user' => getenv('DB_USER') ?: 'root',
    'db_pass' => getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',
    'db_port' => getenv('DB_PORT') ?: 3306,
    // Dynamic App URL Detection
    'app_url' => (function() {
        if (getenv('VERCEL') === '1') {
            $host = $_SERVER['HTTP_HOST'] ?? 'al-graphy-website-two.vercel.app';
            return "https://" . $host; // Always use HTTPS on Vercel
        }
        return 'http://localhost/algraphy';
    })(),

    // Cloudinary Persistent Media Storage
    'cloudinary' => [
        'cloud_name' => getenv('CLOUDINARY_NAME') ?: 'Root',
        'api_key'    => getenv('CLOUDINARY_KEY')  ?: '352728882363193',
        'api_secret' => getenv('CLOUDINARY_SECRET') ?: '-atbTwpia8eS4cH-VPjGZV8bGu4',
    ]
];