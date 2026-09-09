<?php
$track = query('track', 'all');
$valid = array_merge(['all'], Content::experienceTracks());
if (!in_array($track, $valid, true)) {
    $track = 'all';
}

View::render('pages/experience', [
    'title'       => 'Experience — ' . Settings::get('site_name'),
    'description' => 'The full professional pipeline of ' . Settings::get('full_name') . ': roles, institutions, education and volunteer work.',
    'track'       => $track,
    'tracks'      => Content::experienceTracks(),
    'experiences' => Content::experiences($track),
]);
