<?php

namespace AlGraphy\Controllers;

/**
 * AlGraphy Studio — Base Controller
 * 
 * Provides centralized logic for all child controllers, including
 * authentication checks, JSON response formatting, and input validation.
 */
abstract class BaseController 
{
    /**
     * Standardized JSON response handler.
     * Centralizing this allows for global changes to response formats.
     */
    protected function sendJson(array $data, int $statusCode = 200): void 
    {
        // Recursively fix URLs in the data array before sending (only on production)
        if (getenv('VERCEL') === '1') {
            array_walk_recursive($data, function (&$item) {
                if (is_string($item) && (strpos($item, 'http') === 0 || strpos($item, 'Assets/') === 0 || strpos($item, 'algraphybackend/') === 0)) {
                    $item = $this->fixUrl($item);
                }
            });
        }

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
        
        // ONLY apply aggressive cleaning if we are on Vercel
        if (getenv('VERCEL') === '1') {
            // 1. Force HTTPS globally
            $url = str_replace('http://', 'https://', $url);
            
            // 2. Remove legacy subdirectory for production
            $url = str_replace('/algraphy/algraphybackend/', '/algraphybackend/', $url);
            $url = str_replace('.app/algraphy/', '.app/', $url);
            
            // 3. Ensure clean root for relative paths
            if (strpos($url, 'http') !== 0) {
                $url = '/' . ltrim($url, '/');
            }
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
