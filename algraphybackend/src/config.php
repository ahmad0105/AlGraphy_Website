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
    'db_name' => getenv('DB_NAME') ?: 'defaultdb',
    'db_user' => getenv('DB_USER') ?: 'root',
    'db_pass' => getenv('DB_PASS') !== false ? getenv('DB_PASS') : '',
    'db_port' => getenv('DB_PORT') ?: 3306,
    'app_url' => getenv('APP_URL') ?: 'http://localhost/algraphy'
];