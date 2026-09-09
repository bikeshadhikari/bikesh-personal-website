<?php
/** Validated image / document uploads into /uploads. */
class Upload
{
    private const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'avif'];
    private const DOC_EXT   = ['pdf', 'doc', 'docx'];
    private const MAX_BYTES = 5 * 1024 * 1024;

    /**
     * Move an uploaded file into uploads/$folder and return its site-relative path.
     * Returns null when no file was submitted; throws on a rejected file.
     */
    public static function handle(string $field, string $folder = 'site', array $extra = []): ?string
    {
        if (empty($_FILES[$field]) || ($_FILES[$field]['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            return null;
        }

        $file = $_FILES[$field];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Upload failed (error code ' . $file['error'] . '). The file may be larger than the server allows.');
        }
        if ($file['size'] > self::MAX_BYTES) {
            throw new RuntimeException('That file is larger than 5 MB. Please compress it and try again.');
        }

        $ext     = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = array_merge(self::IMAGE_EXT, self::DOC_EXT, $extra);
        if (!in_array($ext, $allowed, true)) {
            throw new RuntimeException('File type .' . $ext . ' is not allowed. Use: ' . implode(', ', $allowed) . '.');
        }

        // Raster images must really be images.
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp'], true) && @getimagesize($file['tmp_name']) === false) {
            throw new RuntimeException('That file is not a readable image.');
        }

        $folder = preg_replace('/[^a-z0-9_-]/i', '', $folder) ?: 'site';
        $dir    = App::root() . '/uploads/' . $folder;
        if (!is_dir($dir) && !mkdir($dir, 0775, true) && !is_dir($dir)) {
            throw new RuntimeException('Could not create the uploads folder. Check folder permissions (755).');
        }

        $name = slugify(pathinfo($file['name'], PATHINFO_FILENAME), 'file');
        $name = substr($name, 0, 60) . '-' . substr(bin2hex(random_bytes(4)), 0, 8) . '.' . $ext;
        $dest = $dir . '/' . $name;

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            throw new RuntimeException('Could not save the uploaded file. Check that /uploads is writable.');
        }
        @chmod($dest, 0644);

        return 'uploads/' . $folder . '/' . $name;
    }

    /** Delete a previously uploaded file, ignoring anything outside /uploads. */
    public static function remove(?string $path): void
    {
        $path = trim((string) $path);
        if ($path === '' || !str_starts_with($path, 'uploads/') || str_contains($path, '..')) {
            return;
        }
        $full = App::root() . '/' . $path;
        if (is_file($full)) {
            @unlink($full);
        }
    }

    /** List everything in /uploads for the media library. */
    public static function library(): array
    {
        $base  = App::root() . '/uploads';
        $items = [];
        if (!is_dir($base)) {
            return $items;
        }
        $it = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base, FilesystemIterator::SKIP_DOTS));
        foreach ($it as $file) {
            if (!$file->isFile() || $file->getFilename() === '.htaccess' || $file->getFilename() === 'index.html') {
                continue;
            }
            $rel = 'uploads/' . ltrim(str_replace($base, '', $file->getPathname()), '/\\');
            $items[] = [
                'path'     => str_replace('\\', '/', $rel),
                'name'     => $file->getFilename(),
                'size'     => $file->getSize(),
                'modified' => $file->getMTime(),
                'is_image' => in_array(strtolower($file->getExtension()), self::IMAGE_EXT, true),
            ];
        }
        usort($items, static fn($a, $b) => $b['modified'] <=> $a['modified']);
        return $items;
    }

    public static function humanSize(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, $i === 0 ? 0 : 1) . ' ' . $units[$i];
    }
}
