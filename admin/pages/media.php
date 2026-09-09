<?php
$error = '';
if (isPost()) {
    Csrf::verify();
    if ($action === 'delete') {
        $path = (string) post('path');
        Upload::remove($path);
        flash('File deleted.');
        redirect('/admin/?page=media');
    }
    try {
        $stored = Upload::handle('file', (string) post('folder', 'site'));
        flash($stored ? 'File uploaded.' : 'No file was selected.', $stored ? 'success' : 'error');
    } catch (Throwable $e) {
        flash($e->getMessage(), 'error');
    }
    redirect('/admin/?page=media');
}

$files = Upload::library();
$bytes = array_sum(array_column($files, 'size'));
adminView('media', ['pageTitle' => 'Media library', 'files' => $files, 'bytes' => $bytes]);
