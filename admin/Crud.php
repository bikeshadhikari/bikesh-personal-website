<?php
/** Generic list / create / update / delete driven by the Resource definitions. */
class Crud
{
    /** Rows for the list screen, with search, pagination and derived columns. */
    public static function index(array $def, string $search = '', int $page = 1, int $perPage = 20): array
    {
        $table  = $def['table'];
        $where  = '1 = 1';
        $params = [];

        if ($search !== '' && !empty($def['search'])) {
            $parts = [];
            foreach ($def['search'] as $col) {
                $parts[]  = Database::q($col) . ' LIKE ?';
                $params[] = '%' . $search . '%';
            }
            $where = '(' . implode(' OR ', $parts) . ')';
        }

        $total  = (int) Database::value('SELECT COUNT(*) FROM ' . Database::q($table) . ' WHERE ' . $where, $params, 0);
        $offset = max(0, ($page - 1) * $perPage);
        $rows   = Database::all(
            'SELECT * FROM ' . Database::q($table) . ' WHERE ' . $where .
            ' ORDER BY ' . ($def['order'] ?? 'id DESC') .
            ' LIMIT ' . (int) $perPage . ' OFFSET ' . $offset,
            $params
        );

        foreach ($rows as &$row) {
            if ($table === 'posts') {
                $row['category_label'] = $row['category_id']
                    ? (string) Database::value('SELECT name FROM categories WHERE id = ?', [$row['category_id']], '—')
                    : '—';
            }
            if ($table === 'categories') {
                $row['post_count'] = (int) Database::value('SELECT COUNT(*) FROM posts WHERE category_id = ?', [$row['id']], 0);
            }
            if ($table === 'experiences') {
                $row['period'] = dateRange($row['start_date'], $row['end_date'], (int) $row['is_current'] === 1);
            }
        }
        unset($row);

        return ['rows' => $rows, 'total' => $total, 'pages' => (int) ceil($total / $perPage), 'page' => $page];
    }

    public static function find(array $def, int $id): ?array
    {
        return Database::first('SELECT * FROM ' . Database::q($def['table']) . ' WHERE id = ?', [$id]);
    }

    /** A blank record populated with each field's default. */
    public static function blank(array $def): array
    {
        $row = ['id' => 0];
        foreach ($def['fields'] as $name => $field) {
            $row[$name] = $field['default'] ?? '';
        }
        return $row;
    }

    /**
     * Validate and persist a submitted form.
     * @return array{ok: bool, id: int, errors: array, values: array}
     */
    public static function save(array $def, int $id = 0): array
    {
        $errors = [];
        $data   = [];
        $table  = $def['table'];
        $existing = $id > 0 ? self::find($def, $id) : null;

        foreach ($def['fields'] as $name => $field) {
            $type = $field['type'];

            switch ($type) {
                case 'checkbox':
                    $data[$name] = postBool($name);
                    break;

                case 'number':
                case 'range':
                    $value = (int) post($name, $field['default'] ?? 0);
                    if (isset($field['min'])) { $value = max((int) $field['min'], $value); }
                    if (isset($field['max'])) { $value = min((int) $field['max'], $value); }
                    $data[$name] = $value;
                    break;

                case 'select':
                    $raw = post($name);
                    if ($name === 'category_id') {
                        $data[$name] = $raw === '' ? null : (int) $raw;
                    } else {
                        $options = is_array($field['options'] ?? null) ? array_keys($field['options']) : [];
                        $data[$name] = ($options && !in_array($raw, $options, true)) ? ($field['default'] ?? $options[0]) : $raw;
                    }
                    break;

                case 'image':
                case 'file':
                    if (postBool('remove_' . $name)) {
                        Upload::remove($existing[$name] ?? null);
                        $data[$name] = '';
                        break;
                    }
                    try {
                        $uploaded = Upload::handle($name, $field['folder'] ?? 'site');
                    } catch (Throwable $e) {
                        $errors[$name] = $e->getMessage();
                        $uploaded = null;
                    }
                    if ($uploaded !== null) {
                        Upload::remove($existing[$name] ?? null);
                        $data[$name] = $uploaded;
                    } elseif (post($name . '_path') !== '') {
                        $data[$name] = post($name . '_path');           // picked from the media library
                    } elseif ($existing !== null) {
                        $data[$name] = $existing[$name];
                    } else {
                        $data[$name] = '';
                    }
                    break;

                case 'url':
                    $raw = post($name);
                    if ($raw !== '' && !preg_match('#^https?://#i', $raw)) {
                        $raw = 'https://' . $raw;
                    }
                    if ($raw !== '' && !filter_var($raw, FILTER_VALIDATE_URL)) {
                        $errors[$name] = 'That does not look like a valid web address.';
                    }
                    $data[$name] = $raw;
                    break;

                case 'date':
                    $raw = post($name);
                    $data[$name] = $raw === '' ? null : $raw;
                    break;

                case 'datetime':
                    $raw = post($name);
                    $data[$name] = $raw === '' ? null : str_replace('T', ' ', $raw) . (strlen($raw) === 16 ? ':00' : '');
                    break;

                case 'richtext':
                    $data[$name] = safeHtml((string) ($_POST[$name] ?? ''));
                    break;

                case 'slug':
                    $raw    = post($name);
                    $source = $raw !== '' ? $raw : post($field['from'] ?? 'title');
                    $data[$name] = uniqueSlug($table, slugify($source, $table), $id ?: null);
                    break;

                default:
                    $data[$name] = post($name);
            }

            if (!empty($field['required']) && ($data[$name] === '' || $data[$name] === null)) {
                $errors[$name] = ($field['label'] ?? $name) . ' is required.';
            }
        }

        // Posts get their author, timestamps and a publish date filled in.
        if ($table === 'posts') {
            $now = date('Y-m-d H:i:s');
            if ($id === 0) {
                $data['author_id'] = Auth::id();
                $data['created_at'] = $now;
                $data['views'] = 0;
            }
            $data['updated_at'] = $now;
            if (($data['status'] ?? '') === 'published' && empty($data['published_at'])) {
                $data['published_at'] = $now;
            }
            if (trim((string) ($data['excerpt'] ?? '')) === '') {
                $data['excerpt'] = excerptOf((string) $data['content'], 28);
            }
        }

        if ($errors) {
            return ['ok' => false, 'id' => $id, 'errors' => $errors, 'values' => array_merge($existing ?? self::blank($def), $data)];
        }

        if ($id > 0) {
            Database::update($table, $data, 'id = :where_id', ['where_id' => $id]);
        } else {
            $id = Database::insert($table, $data);
        }

        Menu::all(true);
        return ['ok' => true, 'id' => $id, 'errors' => [], 'values' => $data];
    }

    public static function delete(array $def, int $id): bool
    {
        $row = self::find($def, $id);
        if (!$row) {
            return false;
        }
        // Clean up any files this record owned.
        foreach ($def['fields'] as $name => $field) {
            if (in_array($field['type'], ['image', 'file'], true) && !empty($row[$name])) {
                Upload::remove($row[$name]);
            }
        }
        if ($def['table'] === 'posts') {
            Database::delete('comments', 'post_id = ?', [$id]);
        }
        if ($def['table'] === 'categories') {
            Database::run('UPDATE posts SET category_id = NULL WHERE category_id = ?', [$id]);
        }
        Database::delete($def['table'], 'id = ?', [$id]);
        return true;
    }

    public static function toggle(array $def, int $id, string $column): void
    {
        $row = self::find($def, $id);
        if (!$row || !array_key_exists($column, $row)) {
            return;
        }
        Database::run(
            'UPDATE ' . Database::q($def['table']) . ' SET ' . Database::q($column) . ' = ? WHERE id = ?',
            [(int) $row[$column] === 1 ? 0 : 1, $id]
        );
    }
}
