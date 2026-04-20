<?php
require_once __DIR__ . '/../algraphybackend/src/Database.php';
$config = require __DIR__ . '/../algraphybackend/src/config.php';

try {
    $db = new AlGraphy\Database(
        $config['db_host'],
        $config['db_name'],
        $config['db_user'],
        $config['db_pass'],
        (int)$config['db_port']
    );
    $pdo = $db->connect();

    // Create sessions table if not exists
    $sql = "CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) NOT NULL PRIMARY KEY,
        data TEXT NOT NULL,
        timestamp INT(11) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    
    $pdo->exec($sql);

    echo "Success: Sessions table established. The portal is now persistent!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
