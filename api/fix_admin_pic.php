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

    $adminPic = 'https://res.cloudinary.com/virgvitp/image/upload/q_auto/f_auto/v1776687103/profiles/w2vl9xmil7gsgevix6c2.png';
    
    // Update profile pic for Ahmad
    $stmt = $pdo->prepare("UPDATE employees SET profile_pic = ? WHERE Full_name LIKE '%Ahmad%'");
    $stmt->execute([$adminPic]);

    echo "Success: Ahmad's profile picture updated to Cloudinary!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
