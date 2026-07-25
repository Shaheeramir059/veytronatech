<?php
require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/functions.php';

$page_title = $page_title ?? 'VeytronaTech | AI, Web Development & Digital Innovation';
$page_description = $page_description ?? 'VeytronaTech builds intelligent AI solutions, modern websites, web applications, automation systems, and digital experiences.';
$page_styles = $page_styles ?? [];
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="<?= e($page_description) ?>">
  <meta property="og:title" content="<?= e($page_title) ?>">
  <meta property="og:description" content="<?= e($page_description) ?>">
  <meta property="og:type" content="website">
  <meta property="og:url" content="<?= e(url(current_path())) ?>">
  <title><?= e($page_title) ?></title>
  <link rel="icon" type="image/png" sizes="64x64" href="assets/images/favicon.png">
  <link rel="apple-touch-icon" href="assets/images/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
  <?php foreach ($page_styles as $style): ?><link rel="stylesheet" href="<?= e($style) ?>"><?php endforeach ?>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="cursor-dot" aria-hidden="true"></div>
  <div class="cursor-ring" aria-hidden="true"></div>
