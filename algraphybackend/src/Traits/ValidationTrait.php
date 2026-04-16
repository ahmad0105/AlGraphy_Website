<?php
declare(strict_types=1);

namespace AlGraphy\Traits;

/**
 * AlGraphy Studio — Validation Trait (Internal Library)
 * 
 * Centralized business logic for data validation. This can be 'used' 
 * by any controller to ensure consistency across the API.
 */

trait ValidationTrait 
{
    /**
     * Validates email format strictly.
     */
    protected function isValidEmail(string $email): bool 
    {
        // Strict format validation using PHP's native filter
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Ensures required keys exist in a POST request.
     */
    protected function validateRequired(array $data, array $fields): ?string 
    {
        foreach ($fields as $field) {
            if (!isset($data[$field]) || empty(trim((string)$data[$field]))) {
                return "The field '" . str_replace('_', ' ', $field) . "' is required.";
            }
        }
        return null;
    }

    /**
     * Validates file upload constraints (Size / MIME)
     */
    protected function validateImageUpload(array $file, int $maxMb = 5): ?string 
    {
        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
        $maxSizeBytes = $maxMb * 1024 * 1024;

        if ($file['size'] > $maxSizeBytes) {
            return "File is too large. Max allowed is {$maxMb}MB.";
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        if (!in_array($mimeType, $allowedMimeTypes)) {
            return "Invalid file type. Only JPG, PNG, and WebP are allowed.";
        }

        return null;
    }
}
