<?php
declare(strict_types=1);

namespace AlGraphy\Controllers;

/**
 * AlGraphy Studio — Authentication Controller
 * 
 * TABLE OF CONTENTS:
 * 1. Namespace & Dependencies
 * 2. Class Definition & Property Promotion
 * 3. Login Workflow (POST /login)
 * 4. Helper: Send JSON Response
 * 
 * @package AlGraphy\Controllers
 */

use AlGraphy\Database;
use PDO;

class AuthController extends BaseController
{
    /**
     * 2. Constructor (Dependency Injection)
     * Receives the Database instance for session-scoped operations.
     */
    public function __construct(private Database $database) {}

    /**
     * 3. Login Workflow (POST /login)
     * Handles user authentication using email and password.
     */
    public function login(): void 
    {
        // Check if the request method is POST
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendJson(["status" => "error", "message" => "Method not allowed. Use POST."], 405);
        }

        // 3.1 Validation: Sanitize and validate email
        $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
        $password = $_POST['password'] ?? '';

        if (!$email || empty($password)) {
            $this->sendJson(["status" => "error", "message" => "Valid email and password are required"], 400);
        }

        // 3.2 Security: Fetch user from DB using Prepared Statement
        $stmt = $this->database->connect()->prepare("SELECT ID, Full_name, Email, Password FROM employees WHERE Email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        // 3.3 Password Verification (password_verify)
        if ($user && password_verify($password, $user['Password'])) {
            
            // 3.4 State Management: Handle user session
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            // Store critical user data in server-side session
            $_SESSION['user_id'] = $user['ID'];
            $_SESSION['user_name'] = $user['Full_name'];
            
            // Generate a secure access token (Bonus Security)
            $token = bin2hex(random_bytes(32));

            $this->sendJson([
                "status" => "success",
                "message" => "Welcome to AlGraphy Portal, " . $user['Full_name'],
                "access_token" => $token
            ], 200);

        } else {
            // Standard security practice: Don't specify if email or password failed
            $this->sendJson(["status" => "error", "message" => "Invalid email or password. Please try again."], 401);
        }
    }
    /**
     * 4. Logout Workflow
     * Destroys the server-side session.
     */
    public function logout(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Clear all session variables
        $_SESSION = [];
        
        // Destroy the actual session
        session_destroy();
        
        $this->sendJson([
            "status" => "success",
            "message" => "Successfully logged out of AlGraphy Studio."
        ], 200);
    }
}