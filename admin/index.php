<?php
/**
 * Dashboard front controller. Routes are query based (?page=…&action=…) so the
 * admin works even on hosts without mod_rewrite.
 */
require dirname(__DIR__) . '/app/bootstrap.php';
require __DIR__ . '/Resource.php';
require __DIR__ . '/Crud.php';
require_once App::root() . '/views/partials/icons.php';

if (!App::isInstalled()) {
    redirect('/install.php');
}

$page   = preg_replace('/[^a-z0-9_-]/', '', (string) query('page', 'dashboard')) ?: 'dashboard';
$action = preg_replace('/[^a-z0-9_-]/', '', (string) query('action', 'index')) ?: 'index';
$id     = (int) query('id', 0);

/** Render an admin screen inside the dashboard chrome. */
function adminView(string $__template, array $__data = [], bool $__bare = false): void
{
    // Names here are prefixed so extract() can never collide with a view variable.
    $__file = __DIR__ . '/views/' . $__template . '.php';
    if (!is_file($__file)) {
        http_response_code(404);
        $__file = __DIR__ . '/views/404.php';
    }
    $adminTitle = $__data['pageTitle'] ?? 'Dashboard';
    extract($__data, EXTR_OVERWRITE);

    if ($__bare) {
        include $__file;
        return;
    }
    ob_start();
    include $__file;
    $adminContent = ob_get_clean();
    include __DIR__ . '/views/layout.php';
}

// ---- public routes (no session required) -----------------------------------

if ($page === 'login') {
    require __DIR__ . '/pages/login.php';
    exit;
}
if ($page === 'logout') {
    Auth::logout();
    redirect('/admin/?page=login');
}

Auth::requireLogin();

// ---- authenticated routes ---------------------------------------------------

$resources = Resource::all();

try {
    if (isset($resources[$page])) {
        require __DIR__ . '/pages/resource.php';
    } else {
        $file = __DIR__ . '/pages/' . $page . '.php';
        if (!is_file($file)) {
            http_response_code(404);
            adminView('404', ['pageTitle' => 'Not found']);
            exit;
        }
        require $file;
    }
} catch (Throwable $e) {
    if (App::config('debug')) {
        throw $e;
    }
    error_log('[admin] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    adminView('error', ['pageTitle' => 'Error', 'message' => $e->getMessage()]);
}
