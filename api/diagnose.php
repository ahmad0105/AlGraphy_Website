<?php
/**
 * AlGraphy Studio — Advanced Diagnostic Tool
 * Used to identify session, routing, and environment issues on Vercel/Localhost.
 */

declare(strict_types=1);
header("Content-Type: text/html; charset=utf-8");

// 1. Force Session Start with custom settings
if (getenv('VERCEL') === '1') {
    session_save_path('/tmp');
}
session_start();

// Mock a session variable if it's the first time
if (!isset($_SESSION['diag_time'])) {
    $_SESSION['diag_time'] = date('Y-m-d H:i:s');
}

$results = [
    'Environment' => [
        'is_vercel' => getenv('VERCEL') === '1' ? '✅ YES' : '❌ NO (Localhost)',
        'protocol' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https') ? '✅ HTTPS' : '⚠️ HTTP (Insecure)',
        'host' => $_SERVER['HTTP_HOST'] ?? 'unknown',
    ],
    'Session Health' => [
        'status' => session_status() === PHP_SESSION_ACTIVE ? '✅ ACTIVE' : '❌ INACTIVE',
        'id' => session_id(),
        'diag_start_time' => $_SESSION['diag_time'],
        'save_path' => session_save_path(),
        'cookie_params' => session_get_cookie_params(),
    ],
    'Filesystem Scan' => [
        'root_index' => file_exists('../index.php') ? '✅ Found' : '❌ Missing',
        'auth_page' => file_exists('../auth.html') ? '✅ Found' : '❌ Missing',
        'studio_panel_folder' => is_dir('../studio-panel') ? '✅ Found' : '❌ Missing',
        'studio_index' => file_exists('../studio-panel/index.html') ? '✅ Found' : '❌ Missing',
        'config_php' => file_exists('../algraphybackend/src/config.php') ? '✅ Found' : '❌ Missing',
    ],
    'API Config' => [
        'document_root' => $_SERVER['DOCUMENT_ROOT'],
        'script_filename' => $_SERVER['SCRIPT_FILENAME'],
    ],
    'Asset Probing (Active Check)' => [
        'studio_js_status' => (function() {
            $url = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . "/studio-panel/js/dashboard.js";
            $content = @file_get_contents($url);
            if ($content === false) return '❌ Failed to connect to JS';
            return (strpos($content, '<!DOCTYPE') !== false) ? '❌ ERROR: Server returned HTML instead of JS' : '✅ SUCCESS: Valid JS Content';
        })(),
        'studio_css_status' => (function() {
            $url = (isset($_SERVER['HTTPS']) ? "https" : "http") . "://" . $_SERVER['HTTP_HOST'] . "/studio-panel/css/dashboard.css";
            $content = @file_get_contents($url);
            if ($content === false) return '❌ Failed to connect to CSS';
            return (strpos($content, '<!DOCTYPE') !== false) ? '❌ ERROR: Server returned HTML instead of CSS' : '✅ SUCCESS: Valid CSS Content';
        })(),
    ]
];

?>
<!DOCTYPE html>
<html>
<head>
    <title>AlGraphy System Diagnosis</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f0f0f; color: #fff; padding: 40px; }
        .container { max-width: 900px; margin: 0 auto; background: #1a1a1a; padding: 30px; border-radius: 15px; border: 1px solid #333; }
        h1 { color: #ff3366; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #00ffcc; font-size: 1.2rem; margin-bottom: 10px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .item { background: #222; padding: 10px; border-radius: 5px; font-size: 0.9rem; }
        .label { color: #888; font-weight: bold; }
        .val { color: #eee; word-break: break-all; }
        pre { background: #000; padding: 15px; border-radius: 10px; color: #0f0; overflow: auto; }
        .btn { background: #ff3366; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 AlGraphy System Diagnosis</h1>
        
        <?php foreach ($results as $title => $data): ?>
        <div class="section">
            <h2><?= $title ?></h2>
            <div class="grid">
                <?php foreach ($data as $k => $v): ?>
                <div class="item">
                    <div class="label"><?= strtoupper($k) ?></div>
                    <div class="val"><?= is_array($v) ? json_encode($v) : $v ?></div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endforeach; ?>

        <div class="section">
            <h2>RAW SERVER DATA</h2>
            <pre><?= print_r($_SERVER, true) ?></pre>
        </div>

        <a href="../" class="btn">Back to Home</a>
        <a href="diagnose.php" class="btn" style="background: #00ffcc; color: #000;">Refresh Status</a>
    </div>
</body>
</html>
