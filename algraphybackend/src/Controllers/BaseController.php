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
     */
    protected function sendJson(array $data, int $statusCode = 200): void 
    {
        // Recursively fix URLs in the data array before sending
        array_walk_recursive($data, function (&$item) {
            if (is_string($item) && (strpos($item, 'http') === 0 || strpos($item, 'Assets/') === 0 || strpos($item, 'algraphybackend/') === 0)) {
                $item = $this->fixUrl($item);
            }
        });

        header("Content-Type: application/json; charset=UTF-8");
        header("X-Content-Type-Options: nosniff");
        
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;
    }

    /**
     * Helper to fix URLs for production (HTTPS and path cleaning)
     */
    protected function fixUrl(string $url): string 
    {
        if (empty($url)) return '';
        
        // Remove local dev prefixes
        $url = str_replace(['http://localhost/algraphy/', 'https://localhost/algraphy/'], '', $url);
        
        // Force HTTPS on Vercel
        if (strpos($url, 'http') === 0 && getenv('VERCEL') === '1') {
            $url = str_replace('http://', 'https://', $url);
        }
        
        // Ensure leading slash for local paths
        if (strpos($url, 'http') !== 0 && strpos($url, '/') !== 0) {
            $url = '/' . $url;
        }
        
        return $url;
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
