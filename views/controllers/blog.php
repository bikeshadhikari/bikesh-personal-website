<?php
/** @var string|null $slug @var array $segments */
$perPage = max(1, (int) Settings::get('posts_per_page', 6));

// /blog/category/{slug}
if (($segments[1] ?? '') === 'category') {
    $catSlug  = $segments[2] ?? '';
    $category = Content::category($catSlug);
    if (!$category) {
        notFound('No such category.');
    }
    $result = Content::posts([
        'category_id' => $category['id'],
        'page'        => max(1, (int) query('page', 1)),
        'per_page'    => $perPage,
    ]);
    View::render('pages/blog', [
        'title'       => $category['name'] . ' — ' . Settings::get('blog_title', 'Blog'),
        'description' => $category['description'] ?: ('Posts filed under ' . $category['name'] . '.'),
        'result'      => $result,
        'heading'     => $category['name'],
        'intro'       => $category['description'],
        'categories'  => Content::categories(),
        'tags'        => Content::tags(),
        'activeCat'   => $category['slug'],
        'baseUrl'     => url('/blog/category/' . $category['slug']),
    ]);
    return;
}

// /blog/tag/{tag}
if (($segments[1] ?? '') === 'tag') {
    $tag    = $segments[2] ?? '';
    $result = Content::posts(['tag' => $tag, 'page' => max(1, (int) query('page', 1)), 'per_page' => $perPage]);
    View::render('pages/blog', [
        'title'       => 'Tagged “' . $tag . '” — ' . Settings::get('blog_title', 'Blog'),
        'description' => 'Posts tagged ' . $tag . '.',
        'result'      => $result,
        'heading'     => 'Tagged “' . $tag . '”',
        'intro'       => '',
        'categories'  => Content::categories(),
        'tags'        => Content::tags(),
        'activeCat'   => '',
        'baseUrl'     => url('/blog/tag/' . rawurlencode($tag)),
    ]);
    return;
}

// /blog/{slug}
if ($slug !== null && $slug !== '') {
    $post = Content::post($slug);
    if (!$post) {
        notFound('That article is not published.');
    }

    // Comment submission.
    $commentError = '';
    $commentOk    = false;
    if (isPost() && isset($_POST['comment_body'])) {
        Csrf::verify();
        $commentsOn = Settings::bool('comments_enabled', true) && (int) $post['allow_comments'] === 1;
        $name = post('comment_name');
        $mail = post('comment_email');
        $body = post('comment_body');
        $trap = post('website'); // honeypot

        if (!$commentsOn) {
            $commentError = 'Comments are closed on this post.';
        } elseif ($trap !== '') {
            $commentError = 'Your comment could not be posted.';
        } elseif ($name === '' || $body === '') {
            $commentError = 'Please add your name and a comment.';
        } elseif ($mail !== '' && !filter_var($mail, FILTER_VALIDATE_EMAIL)) {
            $commentError = 'That email address does not look right.';
        } elseif (mb_strlen($body) > 3000) {
            $commentError = 'Please keep comments under 3000 characters.';
        } else {
            $moderated = Settings::bool('comments_moderated', true);
            Database::insert('comments', [
                'post_id' => (int) $post['id'],
                'name'    => mb_substr($name, 0, 120),
                'email'   => mb_substr($mail, 0, 190),
                'body'    => $body,
                'status'  => $moderated ? 'pending' : 'approved',
                'ip'      => clientIp(),
                'created_at' => date('Y-m-d H:i:s'),
            ]);
            $commentOk = true;
        }
    }

    Content::registerView((int) $post['id']);

    View::render('pages/post', [
        'title'        => ($post['meta_title'] ?: $post['title']) . ' — ' . Settings::get('site_name'),
        'description'  => $post['meta_description'] ?: excerptOf((string) $post['content'], 30),
        'image'        => $post['cover_image'],
        'type'         => 'article',
        'canonical'    => url('/blog/' . $post['slug']),
        'post'         => $post,
        'related'      => Content::relatedPosts($post),
        'comments'     => Content::comments((int) $post['id']),
        'commentError' => $commentError,
        'commentOk'    => $commentOk,
        'categories'   => Content::categories(),
        'tags'         => Content::tags(),
    ]);
    return;
}

// /blog
$result = Content::posts(['page' => max(1, (int) query('page', 1)), 'per_page' => $perPage]);
View::render('pages/blog', [
    'title'       => Settings::get('blog_title', 'Blog') . ' — ' . Settings::get('site_name'),
    'description' => Settings::get('blog_intro', ''),
    'result'      => $result,
    'heading'     => Settings::get('blog_title', 'Notes & Articles'),
    'intro'       => Settings::get('blog_intro', ''),
    'categories'  => Content::categories(),
    'tags'        => Content::tags(),
    'activeCat'   => '',
    'baseUrl'     => url('/blog'),
]);
