<?php
/** Read helpers used by the public templates. */
class Content
{
    public static function highlights(): array
    {
        return Database::all('SELECT * FROM highlights WHERE enabled = 1 ORDER BY sort_order, id');
    }

    /** Skills grouped by category, ready to render as columns. */
    public static function skillsGrouped(): array
    {
        $out = [];
        foreach (Database::all('SELECT * FROM skills WHERE enabled = 1 ORDER BY sort_order, id') as $row) {
            $out[$row['category'] ?: 'General'][] = $row;
        }
        return $out;
    }

    /** The experience pipeline. Pass a track to filter: work, education, volunteer. */
    public static function experiences(?string $track = null, ?int $limit = null): array
    {
        $sql    = 'SELECT * FROM experiences WHERE enabled = 1';
        $params = [];
        if ($track !== null && $track !== 'all') {
            $sql .= ' AND track = ?';
            $params[] = $track;
        }
        $sql .= ' ORDER BY is_current DESC, start_date DESC, sort_order ASC, id DESC';
        if ($limit !== null) {
            $sql .= ' LIMIT ' . (int) $limit;
        }
        return Database::all($sql, $params);
    }

    public static function experienceTracks(): array
    {
        $rows = Database::all('SELECT DISTINCT track FROM experiences WHERE enabled = 1');
        return array_column($rows, 'track');
    }

    public static function services(?int $limit = null): array
    {
        $sql = 'SELECT * FROM services WHERE enabled = 1 ORDER BY sort_order, id';
        if ($limit !== null) {
            $sql .= ' LIMIT ' . (int) $limit;
        }
        return Database::all($sql);
    }

    public static function projects(bool $featuredOnly = false, ?int $limit = null): array
    {
        $sql = 'SELECT * FROM projects WHERE enabled = 1';
        if ($featuredOnly) {
            $sql .= ' AND is_featured = 1';
        }
        $sql .= ' ORDER BY is_featured DESC, sort_order, id DESC';
        if ($limit !== null) {
            $sql .= ' LIMIT ' . (int) $limit;
        }
        return Database::all($sql);
    }

    public static function project(string $slug): ?array
    {
        return Database::first('SELECT * FROM projects WHERE slug = ? AND enabled = 1', [$slug]);
    }

    public static function projectCategories(): array
    {
        $rows = Database::all("SELECT DISTINCT category FROM projects WHERE enabled = 1 AND category <> '' ORDER BY category");
        return array_values(array_filter(array_column($rows, 'category')));
    }

    public static function certifications(): array
    {
        return Database::all('SELECT * FROM certifications WHERE enabled = 1 ORDER BY sort_order, issue_date DESC, id');
    }

    public static function testimonials(): array
    {
        return Database::all('SELECT * FROM testimonials WHERE enabled = 1 ORDER BY sort_order, id');
    }

    public static function categories(): array
    {
        return Database::all(
            'SELECT c.*, (SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.status = ?) AS post_count
             FROM categories c ORDER BY c.sort_order, c.name', ['published']
        );
    }

    public static function category(string $slug): ?array
    {
        return Database::first('SELECT * FROM categories WHERE slug = ?', [$slug]);
    }

    /**
     * Published posts with optional category / tag / search filters.
     * @return array{items: array, total: int, pages: int, page: int}
     */
    public static function posts(array $opts = []): array
    {
        $page    = max(1, (int) ($opts['page'] ?? 1));
        $perPage = max(1, (int) ($opts['per_page'] ?? 6));
        $where   = ['p.status = ?', "(p.published_at IS NULL OR p.published_at <= ?)"];
        $params  = ['published', date('Y-m-d H:i:s')];

        if (!empty($opts['category_id'])) {
            $where[]  = 'p.category_id = ?';
            $params[] = (int) $opts['category_id'];
        }
        if (!empty($opts['tag'])) {
            $where[]  = 'p.tags LIKE ?';
            $params[] = '%' . $opts['tag'] . '%';
        }
        if (!empty($opts['search'])) {
            $where[]  = '(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ? OR p.tags LIKE ?)';
            $term     = '%' . $opts['search'] . '%';
            array_push($params, $term, $term, $term, $term);
        }
        if (!empty($opts['featured'])) {
            $where[] = 'p.is_featured = 1';
        }
        if (!empty($opts['exclude_id'])) {
            $where[]  = 'p.id <> ?';
            $params[] = (int) $opts['exclude_id'];
        }

        $whereSql = implode(' AND ', $where);
        $total    = (int) Database::value('SELECT COUNT(*) FROM posts p WHERE ' . $whereSql, $params, 0);
        $offset   = ($page - 1) * $perPage;

        $items = Database::all(
            'SELECT p.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color, u.name AS author_name
             FROM posts p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN users u ON u.id = p.author_id
             WHERE ' . $whereSql . '
             ORDER BY p.published_at DESC, p.id DESC
             LIMIT ' . (int) $perPage . ' OFFSET ' . (int) $offset,
            $params
        );

        return [
            'items' => $items,
            'total' => $total,
            'pages' => (int) ceil($total / $perPage),
            'page'  => $page,
        ];
    }

    public static function post(string $slug): ?array
    {
        return Database::first(
            'SELECT p.*, c.name AS category_name, c.slug AS category_slug, c.color AS category_color,
                    u.name AS author_name, u.avatar AS author_avatar
             FROM posts p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN users u ON u.id = p.author_id
             WHERE p.slug = ? AND p.status = ?',
            [$slug, 'published']
        );
    }

    public static function registerView(int $postId): void
    {
        $seen = $_SESSION['viewed_posts'] ?? [];
        if (in_array($postId, $seen, true)) {
            return;
        }
        $seen[] = $postId;
        $_SESSION['viewed_posts'] = $seen;
        Database::run('UPDATE posts SET views = views + 1 WHERE id = ?', [$postId]);
    }

    public static function relatedPosts(array $post, int $limit = 3): array
    {
        $rows = [];
        if (!empty($post['category_id'])) {
            $rows = self::posts([
                'category_id' => $post['category_id'],
                'exclude_id'  => $post['id'],
                'per_page'    => $limit,
            ])['items'];
        }
        if (count($rows) < $limit) {
            $more = self::posts(['exclude_id' => $post['id'], 'per_page' => $limit])['items'];
            foreach ($more as $m) {
                if (count($rows) >= $limit) {
                    break;
                }
                if (!in_array($m['id'], array_column($rows, 'id'), true)) {
                    $rows[] = $m;
                }
            }
        }
        return $rows;
    }

    /** Tag cloud built from the comma separated tags column. */
    public static function tags(int $limit = 20): array
    {
        $counts = [];
        foreach (Database::all("SELECT tags FROM posts WHERE status = 'published' AND tags <> ''") as $row) {
            foreach (csvList($row['tags']) as $tag) {
                $key = mb_strtolower($tag);
                $counts[$key] = ($counts[$key] ?? 0) + 1;
            }
        }
        arsort($counts);
        return array_slice($counts, 0, $limit, true);
    }

    public static function comments(int $postId): array
    {
        return Database::all(
            'SELECT * FROM comments WHERE post_id = ? AND status = ? ORDER BY created_at ASC',
            [$postId, 'approved']
        );
    }

    public static function archiveCounts(): array
    {
        $out = [];
        foreach (Database::all("SELECT published_at FROM posts WHERE status = 'published' AND published_at IS NOT NULL") as $row) {
            $key = date('Y-m', strtotime($row['published_at']));
            $out[$key] = ($out[$key] ?? 0) + 1;
        }
        krsort($out);
        return $out;
    }
}
