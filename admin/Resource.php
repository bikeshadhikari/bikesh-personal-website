<?php
/**
 * Every manageable content type is described once here: its table, its fields
 * and how it appears in a list. The generic list and form views read these
 * definitions, so adding a new field is a one-line change and nothing else.
 */
class Resource
{
    public static function all(): array
    {
        return [
            'posts' => [
                'table'    => 'posts',
                'label'    => 'Blog posts',
                'singular' => 'Post',
                'icon'     => 'quote',
                'group'    => 'Blog',
                'order'    => 'published_at DESC, id DESC',
                'search'   => ['title', 'excerpt', 'tags'],
                'timestamps' => true,
                'list' => [
                    ['key' => 'title', 'label' => 'Title', 'primary' => true, 'link' => 'blog/%slug%'],
                    ['key' => 'category_label', 'label' => 'Category', 'type' => 'chip'],
                    ['key' => 'status', 'label' => 'Status', 'type' => 'status'],
                    ['key' => 'views', 'label' => 'Views', 'type' => 'number'],
                    ['key' => 'published_at', 'label' => 'Published', 'type' => 'date'],
                ],
                'fields' => [
                    'title'       => ['type' => 'text', 'label' => 'Title', 'required' => true, 'width' => 'full'],
                    'slug'        => ['type' => 'slug', 'label' => 'URL slug', 'from' => 'title', 'hint' => 'Leave empty and it is made from the title.'],
                    'category_id' => ['type' => 'select', 'label' => 'Category', 'options' => 'categories'],
                    'excerpt'     => ['type' => 'textarea', 'label' => 'Short summary', 'rows' => 3, 'width' => 'full', 'hint' => 'Shown on cards and in search results. Around 25 words.'],
                    'content'     => ['type' => 'richtext', 'label' => 'Article', 'width' => 'full', 'required' => true],
                    'cover_image' => ['type' => 'image', 'label' => 'Cover image', 'folder' => 'posts'],
                    'tags'        => ['type' => 'text', 'label' => 'Tags', 'hint' => 'Comma separated, e.g. teaching, php, nepal'],
                    'status'      => ['type' => 'select', 'label' => 'Status', 'options' => ['draft' => 'Draft', 'published' => 'Published'], 'default' => 'draft'],
                    'published_at'=> ['type' => 'datetime', 'label' => 'Publish date', 'hint' => 'A future date keeps the post hidden until then.'],
                    'is_featured' => ['type' => 'checkbox', 'label' => 'Feature this post on the home page'],
                    'allow_comments' => ['type' => 'checkbox', 'label' => 'Allow comments', 'default' => 1],
                    'meta_title'  => ['type' => 'text', 'label' => 'SEO title', 'group' => 'seo', 'hint' => 'Only if it should differ from the title.'],
                    'meta_description' => ['type' => 'textarea', 'label' => 'SEO description', 'rows' => 2, 'group' => 'seo', 'width' => 'full'],
                ],
            ],

            'categories' => [
                'table' => 'categories', 'label' => 'Categories', 'singular' => 'Category',
                'icon' => 'tag', 'group' => 'Blog', 'order' => 'sort_order ASC, name ASC',
                'list' => [
                    ['key' => 'name', 'label' => 'Name', 'primary' => true],
                    ['key' => 'slug', 'label' => 'Slug', 'type' => 'mono'],
                    ['key' => 'post_count', 'label' => 'Posts', 'type' => 'number'],
                    ['key' => 'sort_order', 'label' => 'Order', 'type' => 'number'],
                ],
                'fields' => [
                    'name'        => ['type' => 'text', 'label' => 'Name', 'required' => true],
                    'slug'        => ['type' => 'slug', 'label' => 'URL slug', 'from' => 'name'],
                    'description' => ['type' => 'textarea', 'label' => 'Description', 'rows' => 2, 'width' => 'full'],
                    'color'       => ['type' => 'color', 'label' => 'Colour', 'default' => '#2563eb'],
                    'sort_order'  => ['type' => 'number', 'label' => 'Sort order', 'default' => 0],
                ],
            ],

            'experiences' => [
                'table' => 'experiences', 'label' => 'Experience pipeline', 'singular' => 'Experience entry',
                'icon' => 'briefcase', 'group' => 'Profile',
                'order' => 'is_current DESC, start_date DESC, sort_order ASC',
                'search' => ['role', 'organization'],
                'toggle' => 'enabled',
                'list' => [
                    ['key' => 'role', 'label' => 'Role', 'primary' => true],
                    ['key' => 'organization', 'label' => 'Organisation'],
                    ['key' => 'track', 'label' => 'Track', 'type' => 'chip'],
                    ['key' => 'period', 'label' => 'Period'],
                    ['key' => 'enabled', 'label' => 'Visible', 'type' => 'toggle'],
                ],
                'fields' => [
                    'role'            => ['type' => 'text', 'label' => 'Role or title', 'required' => true, 'width' => 'full'],
                    'organization'    => ['type' => 'text', 'label' => 'Organisation'],
                    'organization_url'=> ['type' => 'url', 'label' => 'Organisation website'],
                    'location'        => ['type' => 'text', 'label' => 'Location'],
                    'track'           => ['type' => 'select', 'label' => 'Track', 'default' => 'work',
                                          'options' => ['work' => 'Work', 'education' => 'Education', 'volunteer' => 'Volunteer', 'award' => 'Award'],
                                          'hint' => 'Groups the entry on the Experience page.'],
                    'employment_type' => ['type' => 'text', 'label' => 'Type', 'hint' => 'Full-time, Freelance, Volunteer, Bachelor\'s degree…'],
                    'start_date'      => ['type' => 'date', 'label' => 'Start date'],
                    'end_date'        => ['type' => 'date', 'label' => 'End date', 'hint' => 'Leave empty if this is current.'],
                    'is_current'      => ['type' => 'checkbox', 'label' => 'This is my current role'],
                    'summary'         => ['type' => 'textarea', 'label' => 'Summary', 'rows' => 3, 'width' => 'full'],
                    'highlights'      => ['type' => 'textarea', 'label' => 'Key points', 'rows' => 5, 'width' => 'full', 'hint' => 'One per line. Each becomes a ticked bullet.'],
                    'logo'            => ['type' => 'image', 'label' => 'Organisation logo', 'folder' => 'site'],
                    'sort_order'      => ['type' => 'number', 'label' => 'Sort order', 'default' => 0],
                    'enabled'         => ['type' => 'checkbox', 'label' => 'Show on the website', 'default' => 1],
                ],
            ],

            'skills' => [
                'table' => 'skills', 'label' => 'Skills', 'singular' => 'Skill',
                'icon' => 'sparkle', 'group' => 'Profile', 'order' => 'sort_order ASC, id ASC',
                'toggle' => 'enabled',
                'list' => [
                    ['key' => 'name', 'label' => 'Skill', 'primary' => true],
                    ['key' => 'category', 'label' => 'Group', 'type' => 'chip'],
                    ['key' => 'level', 'label' => 'Level', 'type' => 'meter'],
                    ['key' => 'enabled', 'label' => 'Visible', 'type' => 'toggle'],
                ],
                'fields' => [
                    'name'       => ['type' => 'text', 'label' => 'Skill', 'required' => true],
                    'category'   => ['type' => 'text', 'label' => 'Group', 'default' => 'General', 'hint' => 'Skills sharing a group are shown in one column.'],
                    'level'      => ['type' => 'range', 'label' => 'Proficiency', 'default' => 70],
                    'sort_order' => ['type' => 'number', 'label' => 'Sort order', 'default' => 0],
                    'enabled'    => ['type' => 'checkbox', 'label' => 'Show on the website', 'default' => 1],
                ],
            ],

            'services' => [
                'table' => 'services', 'label' => 'Services', 'singular' => 'Service',
                'icon' => 'layers', 'group' => 'Content', 'order' => 'sort_order ASC, id ASC',
                'toggle' => 'enabled',
                'list' => [
                    ['key' => 'title', 'label' => 'Service', 'primary' => true],
                    ['key' => 'icon', 'label' => 'Icon', 'type' => 'mono'],
                    ['key' => 'sort_order', 'label' => 'Order', 'type' => 'number'],
                    ['key' => 'enabled', 'label' => 'Visible', 'type' => 'toggle'],
                ],
                'fields' => [
                    'title'      => ['type' => 'text', 'label' => 'Title', 'required' => true, 'width' => 'full'],
                    'summary'    => ['type' => 'textarea', 'label' => 'Summary', 'rows' => 3, 'width' => 'full'],
                    'bullets'    => ['type' => 'textarea', 'label' => 'What it includes', 'rows' => 4, 'width' => 'full', 'hint' => 'One per line.'],
                    'icon'       => ['type' => 'icon', 'label' => 'Icon'],
                    'price_note' => ['type' => 'text', 'label' => 'Note', 'hint' => 'Optional, e.g. "From NPR 15,000" or "Free first session".'],
                    'sort_order' => ['type' => 'number', 'label' => 'Sort order', 'default' => 0],
                    'enabled'    => ['type' => 'checkbox', 'label' => 'Show on the website', 'default' => 1],
                ],
            ],

            'projects' => [
                'table' => 'projects', 'label' => 'Projects', 'singular' => 'Project',
                'icon' => 'code', 'group' => 'Content', 'order' => 'is_featured DESC, sort_order ASC, id DESC',
                'search' => ['title', 'summary', 'tech'],
                'toggle' => 'enabled',
                'list' => [
                    ['key' => 'title', 'label' => 'Project', 'primary' => true, 'link' => 'projects/%slug%'],
                    ['key' => 'category', 'label' => 'Type', 'type' => 'chip'],
                    ['key' => 'year', 'label' => 'Year'],
                    ['key' => 'is_featured', 'label' => 'Featured', 'type' => 'bool'],
                    ['key' => 'enabled', 'label' => 'Visible', 'type' => 'toggle'],
                ],
                'fields' => [
                    'title'       => ['type' => 'text', 'label' => 'Title', 'required' => true, 'width' => 'full'],
                    'slug'        => ['type' => 'slug', 'label' => 'URL slug', 'from' => 'title'],
                    'summary'     => ['type' => 'textarea', 'label' => 'Short summary', 'rows' => 3, 'width' => 'full'],
                    'description' => ['type' => 'richtext', 'label' => 'Full write-up', 'width' => 'full'],
                    'image'       => ['type' => 'image', 'label' => 'Cover image', 'folder' => 'projects'],
                    'category'    => ['type' => 'text', 'label' => 'Type', 'hint' => 'Education, Business, Training…'],
                    'tech'        => ['type' => 'text', 'label' => 'Built with', 'hint' => 'Comma separated.'],
                    'client'      => ['type' => 'text', 'label' => 'Client'],
                    'year'        => ['type' => 'text', 'label' => 'Year'],
                    'live_url'    => ['type' => 'url', 'label' => 'Live URL'],
                    'repo_url'    => ['type' => 'url', 'label' => 'Source code URL'],
                    'is_featured' => ['type' => 'checkbox', 'label' => 'Feature on the home page'],
                    'sort_order'  => ['type' => 'number', 'label' => 'Sort order', 'default' => 0],
                    'enabled'     => ['type' => 'checkbox', 'label' => 'Show on the website', 'default' => 1],
                ],
            ],

            'certifications' => [
                'table' => 'certifications', 'label' => 'Certifications', 'singular' => 'Certification',
                'icon' => 'award', 'group' => 'Profile', 'order' => 'sort_order ASC, issue_date DESC',
                'toggle' => 'enabled',
                'list' => [
                    ['key' => 'title', 'label' => 'Title', 'primary' => true],
                    ['key' => 'issuer', 'label' => 'Issued by'],
                    ['key' => 'issue_date', 'label' => 'Date', 'type' => 'date'],
                    ['key' => 'enabled', 'label' => 'Visible', 'type' => 'toggle'],
                ],
                'fields' => [
                    'title'          => ['type' => 'text', 'label' => 'Title', 'required' => true, 'width' => 'full'],
                    'issuer'         => ['type' => 'text', 'label' => 'Issued by'],
                    'issue_date'     => ['type' => 'date', 'label' => 'Date issued'],
                    'credential_id'  => ['type' => 'text', 'label' => 'Credential ID'],
                    'credential_url' => ['type' => 'url', 'label' => 'Credential URL'],
                    'image'          => ['type' => 'image', 'label' => 'Certificate image', 'folder' => 'site'],
                    'sort_order'     => ['type' => 'number', 'label' => 'Sort order', 'default' => 0],
                    'enabled'        => ['type' => 'checkbox', 'label' => 'Show on the website', 'default' => 1],
                ],
            ],

            'testimonials' => [
                'table' => 'testimonials', 'label' => 'Testimonials', 'singular' => 'Testimonial',
                'icon' => 'quote', 'group' => 'Content', 'order' => 'sort_order ASC, id ASC',
                'toggle' => 'enabled',
                'list' => [
                    ['key' => 'name', 'label' => 'Person', 'primary' => true],
                    ['key' => 'organization', 'label' => 'Organisation'],
                    ['key' => 'rating', 'label' => 'Rating', 'type' => 'number'],
                    ['key' => 'enabled', 'label' => 'Visible', 'type' => 'toggle'],
                ],
                'fields' => [
                    'name'         => ['type' => 'text', 'label' => 'Name', 'required' => true],
                    'role'         => ['type' => 'text', 'label' => 'Their role'],
                    'organization' => ['type' => 'text', 'label' => 'Organisation'],
                    'quote'        => ['type' => 'textarea', 'label' => 'What they said', 'rows' => 4, 'width' => 'full', 'required' => true],
                    'photo'        => ['type' => 'image', 'label' => 'Photo', 'folder' => 'site'],
                    'rating'       => ['type' => 'number', 'label' => 'Stars (0–5)', 'default' => 5, 'min' => 0, 'max' => 5],
                    'sort_order'   => ['type' => 'number', 'label' => 'Sort order', 'default' => 0],
                    'enabled'      => ['type' => 'checkbox', 'label' => 'Show on the website', 'default' => 0],
                ],
            ],

            'highlights' => [
                'table' => 'highlights', 'label' => 'Key numbers', 'singular' => 'Number',
                'icon' => 'sparkle', 'group' => 'Content', 'order' => 'sort_order ASC, id ASC',
                'toggle' => 'enabled',
                'list' => [
                    ['key' => 'label', 'label' => 'Label', 'primary' => true],
                    ['key' => 'value', 'label' => 'Value'],
                    ['key' => 'suffix', 'label' => 'Suffix'],
                    ['key' => 'enabled', 'label' => 'Visible', 'type' => 'toggle'],
                ],
                'fields' => [
                    'label'      => ['type' => 'text', 'label' => 'Label', 'required' => true, 'width' => 'full'],
                    'value'      => ['type' => 'text', 'label' => 'Number', 'required' => true, 'hint' => 'Digits only — it counts up on screen.'],
                    'suffix'     => ['type' => 'text', 'label' => 'Suffix', 'hint' => '+ or %'],
                    'icon'       => ['type' => 'icon', 'label' => 'Icon'],
                    'sort_order' => ['type' => 'number', 'label' => 'Sort order', 'default' => 0],
                    'enabled'    => ['type' => 'checkbox', 'label' => 'Show on the website', 'default' => 1],
                ],
            ],
        ];
    }

    public static function get(string $name): ?array
    {
        $all = self::all();
        return $all[$name] ?? null;
    }

    /** Icon names offered by the icon picker. */
    public static function iconChoices(): array
    {
        return ['sparkle', 'code', 'graduation', 'layers', 'mic', 'compass', 'globe', 'briefcase',
                'award', 'heart', 'users', 'clock', 'mail', 'phone', 'pin', 'star', 'quote', 'tag', 'eye', 'check'];
    }
}
