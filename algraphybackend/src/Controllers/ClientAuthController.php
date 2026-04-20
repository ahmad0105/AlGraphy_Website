<?php
declare(strict_types=1);

namespace AlGraphy\Controllers;

/**
 * AlGraphy Studio — Client Authentication Controller
 * 
 * TABLE OF CONTENTS:
 * 1. Namespace & Dependencies
 * 2. Class Definition & Property Promotion
 * 3. Database Schema Helpers (Auto-column generation)
 * 4. Auth Workflows (Login/Signup)
 * 5. Profile Management (Fetch/Update)
 * 6. Helper: Send JSON Response
 * 
 * @package AlGraphy\Controllers
 */

use AlGraphy\Database;
use PDO;

class ClientAuthController extends BaseController
{
    /**
     * 2. Constructor (Dependency Injection)
     */
    public function __construct(private Database $database) 
    {
        // Start session for state management
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // Ensure database table consistency
        $this->ensureProfileImageColumnExists();
    }

    /**
     * 3. Database Schema Helpers
     * Gracefully adds missing columns to the users table if necessary.
     */
    private function ensureProfileImageColumnExists(): void 
    {
        try {
            $stmt = $this->database->connect()->query("SHOW COLUMNS FROM users LIKE 'profile_image'");
            if ($stmt->rowCount() === 0) {
                $this->database->connect()->exec("ALTER TABLE users ADD COLUMN profile_image VARCHAR(255) DEFAULT 'Assets/image/default_avatar.png'");
            }
        } catch (\PDOException $e) {
            // Error ignored if table doesn't exist yet
        }
    }

    /**
     * 4. Login Workflow
     */
    public function login(): void 
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendJson(["status" => "error", "message" => "Method not allowed. Use POST."], 405);
        }

        $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
        $password = $_POST['password'] ?? '';

        if (!$email || empty($password)) {
            $this->sendJson(["status" => "error", "message" => "Valid email and password are required"], 400);
        }

        $stmt = $this->database->connect()->prepare("SELECT id, full_name, email, password_hash, profile_image FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password_hash'])) {
            $_SESSION['client_id'] = $user['id'];
            $_SESSION['client_name'] = $user['full_name'];
            
            $token = bin2hex(random_bytes(32));

            $this->sendJson([
                "status" => "success",
                "message" => "Welcome back, " . $user['full_name'] . "!",
                "access_token" => $token
            ], 200);

        } else {
            $this->sendJson(["status" => "error", "message" => "Incorrect Email or Password."], 401);
        }
    }

    /**
     * 4. Signup Workflow
     */
    public function signup(): void 
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendJson(["status" => "error", "message" => "Method not allowed. Use POST."], 405);
        }

        $fullName = htmlspecialchars(trim($_POST['full_name'] ?? ''));
        $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
        $password = $_POST['password'] ?? '';

        if (empty($fullName) || !$email || empty($password)) {
            $this->sendJson(["status" => "error", "message" => "All fields are required."], 400);
        }

        // Check for duplicate emails
        $stmt = $this->database->connect()->prepare("SELECT id FROM users WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            $this->sendJson(["status" => "error", "message" => "Email is already registered."], 409);
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->database->connect()->prepare("INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)");
        
        try {
            if ($stmt->execute([$fullName, $email, $hashedPassword])) {
                $this->sendJson(["status" => "success", "message" => "Account created successfully."], 201);
            } else {
                $this->sendJson(["status" => "error", "message" => "Could not register user."], 500);
            }
        } catch (\PDOException $e) {
            $this->sendJson(["status" => "error", "message" => "Database error."], 500);
        }
    }

    /**
     * 5. Profile Management - Data Fetching
     */
    public function getProfile(): void 
    {
        if (!isset($_SESSION['client_id'])) {
            $this->sendJson(["status" => "error", "message" => "Unauthorized."], 401);
        }

        $clientId = $_SESSION['client_id'];
        $stmt = $this->database->connect()->prepare("SELECT full_name, email, profile_image FROM users WHERE id = ?");
        $stmt->execute([$clientId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $imageUrl = $user['profile_image'] ?: 'Assets/image/default_avatar.png';
            
            $this->sendJson([
                "status" => "success",
                "user" => [
                    "full_name" => $user['full_name'],
                    "email" => $user['email'],
                    "profile_image" => $imageUrl
                ]
            ], 200);
        } else {
            $this->sendJson(["status" => "error", "message" => "User not found."], 404);
        }
    }

    /**
     * 5. Profile Management - Update Profile
     */
    public function updateProfile(): void 
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->sendJson(["status" => "error", "message" => "Method not allowed. Use POST."], 405);
        }

        if (!isset($_SESSION['client_id'])) {
            $this->sendJson(["status" => "error", "message" => "Unauthorized."], 401);
        }

        $clientId = $_SESSION['client_id'];
        $fullName = htmlspecialchars(trim($_POST['full_name'] ?? ''));
        $email = filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL);
        $newPassword = trim($_POST['password'] ?? '');

        if (empty($fullName)) {
            $this->sendJson(["status" => "error", "message" => "Full name is required."], 400);
        }

        if (!$email) {
            $this->sendJson(["status" => "error", "message" => "Please provide a valid email address."], 400);
        }

        // Secure Secure File Upload Handling
        $profilePicPath = null;
        if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
            $tmpPath = $_FILES['profile_image']['tmp_name'];

            // Validate MIME type
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $mimeType = $finfo->file($tmpPath);

            $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!in_array($mimeType, $allowedMimeTypes)) {
                $this->sendJson(["status" => "error", "message" => "Invalid image type."], 400);
            }

            $fileName = uniqid('client_', true) . '.png'; // Defaulting to png or map accordingly
            $uploadDir = __DIR__ . '/../../public/uploads/';
            
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }
            
            if (move_uploaded_file($tmpPath, $uploadDir . $fileName)) {
                $profilePicPath = 'uploads/' . $fileName;
            } else {
                $this->sendJson(["status" => "error", "message" => "Failed to save image."], 500);
            }
        }

        try {
            $query = "UPDATE users SET full_name = ?, email = ?";
            $params = [$fullName, $email];

            if (!empty($newPassword)) {
                $query .= ", password_hash = ?";
                $params[] = password_hash($newPassword, PASSWORD_DEFAULT);
            }

            if ($profilePicPath !== null) {
                $query .= ", profile_image = ?";
                $params[] = $profilePicPath;
            }

            $query .= " WHERE id = ?";
            $params[] = $clientId;

            $stmt = $this->database->connect()->prepare($query);
            $stmt->execute($params);

            $_SESSION['client_name'] = $fullName;

            // Return full absolute URL for the frontend
            // Return relative path for the frontend (clean for both environments)
            $fullImagePath = $profilePicPath ? 'algraphybackend/public/' . $profilePicPath : null;

            $this->sendJson([
                "status" => "success", 
                "message" => "Profile updated successfully.",
                "profile_image" => $fullImagePath
            ], 200);

        } catch (\PDOException $e) {
            $this->sendJson(["status" => "error", "message" => "Database error or email maybe in use."], 500);
        }
    }

}
