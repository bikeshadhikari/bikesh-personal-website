<?php
View::render('pages/services', [
    'title'       => 'Services — ' . Settings::get('site_name'),
    'description' => 'Training, web development, academic planning, speaking and mentoring services.',
    'services'    => Content::services(),
    'highlights'  => Content::highlights(),
]);
