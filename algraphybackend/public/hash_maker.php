<?php
/**
 * AlGraphy Studio — Password Security Utility
 * 
 * TABLE OF CONTENTS:
 * 1. Utility Configuration
 * 2. Secure Hashing Logic
 * 3. Result Output (HTML)
 */

declare(strict_types=1);

echo "<h1 style='font-family:sans-serif;'>AlGraphy Password Hash Generator</h1>";

// 1. Configuration: Enter the desired raw password
$password = "Ahmad2026"; 

// 2. Secure Hashing Logic: Uses default Bcrypt/Argon2 algorithm
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// 3. Result Output
echo "<div style='font-family:sans-serif; background:#f9f9f9; padding:20px; border:1px solid #ddd; border-radius:8px;'>";
echo "<p>Raw Password Input: <b>" . htmlspecialchars($password) . "</b></p>";
echo "<p>Generated Secure Hash (Safe for Database Storage):</p>";
echo "<code style='background:#000; color:#0f0; padding:15px; display:block; word-break: break-all; border-radius:5px; font-size:1.1rem;'>" . $hashed_password . "</code>";
echo "<p style='color:#666; font-size:0.9rem;'>Copy the green text above and paste it into the <i>'Password'</i> column in your SQL database.</p>";
echo "</div>";
?>