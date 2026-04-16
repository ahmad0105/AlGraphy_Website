<?php
declare(strict_types=1);

namespace AlGraphy\Controllers;

use AlGraphy\Traits\ValidationTrait;

/**
 * AlGraphy Studio — Base Controller Class
 * 
 * Implements the DRY (Don't Repeat Yourself) principle by centralizing 
 * common functionality used by all controllers.
 */

abstract class BaseController 
{
    use ValidationTrait;

    /**
     * Standardized JSON response handler.
     * Centralizing this allows for global changes to response formats.
     * 
     * @param array $data Output payload
     * @param int $statusCode HTTP status code (default 200)
     */
    protected function sendJson(array $data, int $statusCode = 200): void 
    {
        // Set standard headers for modern API responses
        header("Content-Type: application/json; charset=UTF-8");
        header("X-Content-Type-Options: nosniff");
        
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Checks if a user is authenticated via session.
     * 
     * @return int|null User ID or null
     */
    protected function getAuthenticatedUserId(): ?int 
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        return $_SESSION['user_id'] ?? $_SESSION['client_id'] ?? null;
    }

    /**
     * Standardized error response.
     */
    protected function errorResponse(string $message, int $code = 400): void 
    {
        $this->sendJson([
            "status" => "error",
            "message" => $message
        ], $code);
    }
}
