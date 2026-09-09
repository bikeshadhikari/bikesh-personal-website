<?php
/** Home page: renders only the sections switched on in the dashboard. */
$sections = Menu::sections();

$data = [
    'title'       => Settings::get('meta_title', Settings::get('site_name')),
    'description' => Settings::get('meta_description'),
    'sections'    => $sections,
    'highlights'  => Menu::enabled('highlights') ? Content::highlights() : [],
    'skills'      => Menu::enabled('skills') ? Content::skillsGrouped() : [],
    'experiences' => Menu::enabled('experience-section') ? Content::experiences('work', 4) : [],
    'services'    => Menu::enabled('services-section') ? Content::services(6) : [],
    'projects'    => Menu::enabled('projects-section') ? Content::projects(true, 6) : [],
    'certs'       => Menu::enabled('certifications') ? Content::certifications() : [],
    'testimonials'=> Menu::enabled('testimonials') ? Content::testimonials() : [],
    'posts'       => (Menu::enabled('blog-section') && Menu::enabled('blog')) ? Content::posts(['per_page' => 3])['items'] : [],
    'isHome'      => true,
];

View::render('pages/home', $data);
