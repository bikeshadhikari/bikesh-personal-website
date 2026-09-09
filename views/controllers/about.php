<?php
View::render('pages/about', [
    'title'       => 'About — ' . Settings::get('site_name'),
    'description' => excerptOf(Settings::get('about_lead', ''), 30),
    'skills'      => Content::skillsGrouped(),
    'education'   => Content::experiences('education'),
    'certs'       => Content::certifications(),
    'highlights'  => Content::highlights(),
]);
