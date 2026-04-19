<?php
declare(strict_types=1);

namespace AlGraphy;

/**
 * AlGraphy Studio — Database Connection Handler
 * 
 * TABLE OF CONTENTS:
 * 1. Namespace & Dependencies
 * 2. Class Definition & Properties
 * 3. Constructor (PHP 8 Property Promotion)
 * 4. Connection Logic (PDO)
 * 
 * @package AlGraphy
 */

use PDO;
use PDOException;

class Database
{
    // 2. Class Definition & Properties
    private ?PDO $pdo = null;
    
    /**
     * 3. Constructor (PHP 8 Property Promotion)
     * Passes credentials directly to the object upon instantiation.
     */
    public function __construct(
        private string $host,
        private string $dbname,
        private string $user,
        private string $password,
        private int $port = 3306
    ) {}

    /**
     * 4. Connection Logic (PDO)
     * Establishes a singleton connection to the MySQL database.
     * 
     * @return PDO
     */
    public function connect(): PDO
    {
        // Return existing connection if available (Singleton Pattern)
        if ($this->pdo !== null) {
            return $this->pdo;
        }

        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->dbname};charset=utf8mb4";
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,        // Enable exceptions for errors
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,   // Fetch as associative array
                PDO::ATTR_EMULATE_PREPARES => false,                // Use real prepared statements
            ];

            // Enable SSL for Cloud Databases (like Aiven)
            if ($this->port != 3306) {
                $options[PDO::MYSQL_ATTR_SSL_CA] = true; // Use system CA certs
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }

            $this->pdo = new PDO($dsn, $this->user, $this->password, $options);
            
            return $this->pdo;
        } catch (PDOException $e) {
            // Log the detailed error internally
            error_log("Database Connection Error: " . $e->getMessage());

            // Provide a clean, secure error message to the client
            header('Content-Type: application/json', true, 500);
            echo json_encode(["status" => "error", "message" => "Internal Server Error: Database Connection Failed"]);
            exit;
        }
    }
}