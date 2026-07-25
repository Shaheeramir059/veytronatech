<?php
declare(strict_types=1);

function e(?string $value): string { return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function url(string $path = ''): string { return rtrim(SITE_URL, '/') . '/' . ltrim($path, '/'); }
function current_path(): string { return basename(parse_url($_SERVER['REQUEST_URI'] ?? 'index.php', PHP_URL_PATH) ?: 'index.php'); }
function is_active(string $file): string { return current_path() === $file ? ' aria-current="page"' : ''; }

function start_secure_session(): void {
    if (session_status() === PHP_SESSION_NONE) {
        session_name('veytrona_session');
        session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')]);
        session_start();
    }
}
function csrf_token(): string {
    start_secure_session();
    if (empty($_SESSION['csrf_token'])) $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf_token'];
}
function verify_csrf(?string $token): bool { start_secure_session(); return is_string($token) && hash_equals($_SESSION['csrf_token'] ?? '', $token); }
function flash(string $key, ?string $value = null): ?string {
    start_secure_session();
    if ($value !== null) { $_SESSION['flash'][$key] = $value; return null; }
    $message = $_SESSION['flash'][$key] ?? null; unset($_SESSION['flash'][$key]); return $message;
}
function admin_required(): void { start_secure_session(); if (empty($_SESSION['admin_id'])) { flash('error', 'Please sign in to continue.'); header('Location: login.php'); exit; } }
function project_data(): array {
    return [
        'virsa' => ['name'=>'VIRSA', 'category'=>'AI Commerce', 'summary'=>'An AI-powered e-commerce ecosystem combining intelligent discovery and practical shopping tools.', 'tech'=>['AI','Computer Vision','OCR','FastAPI','React'], 'challenge'=>'Bring multiple AI-enabled shopping experiences into one cohesive product direction.', 'solution'=>'A modular ecosystem for AI search, virtual fitting, biometric checkout, skin analysis, and OCR-led shopping.', 'implementation'=>'Product concepts and services were structured around clear, privacy-aware customer journeys.', 'outcome'=>'A foundation for exploring modern commerce interactions without relying on invented results.'],
        'smartqueue-ai' => ['name'=>'SmartQueue-AI', 'category'=>'Computer Vision', 'summary'=>'An AI-powered queue analysis system for understanding queue behaviour and supporting operations.', 'tech'=>['Computer Vision','Deep Learning','InceptionV3','BiLSTM','Python'], 'challenge'=>'Make busy physical queues easier to observe and reason about.', 'solution'=>'A computer-vision workflow that models relevant queue behaviour for operational review.', 'implementation'=>'Deep-learning components were paired with a clear analysis-oriented project structure.', 'outcome'=>'A practical concept for making queue information more visible and actionable.'],
        'educational-gpt' => ['name'=>'Educational GPT', 'category'=>'Learning AI', 'summary'=>'An educational AI assistant built to support interactive learning and knowledge assistance.', 'tech'=>['Python','NLP','Transformers','Machine Learning','Flask'], 'challenge'=>'Make learning support responsive while retaining a clear, user-focused experience.', 'solution'=>'An assistant concept designed for guided questions, explanations, and contextual learning help.', 'implementation'=>'NLP and transformer capabilities sit behind a straightforward web interaction.', 'outcome'=>'A flexible base for experimenting with intelligent educational support.'],
        'produce-vision' => ['name'=>'Fruit & Vegetable Recognition', 'category'=>'Computer Vision', 'summary'=>'A vision concept for image-based product recognition at automated supermarket checkout.', 'tech'=>['Computer Vision','Python','OpenCV','Machine Learning'], 'challenge'=>'Identify varied produce reliably in a fast retail interaction.', 'solution'=>'A recognition concept that treats checkout as a simple visual classification experience.', 'implementation'=>'The project is framed around image input, model output, and a low-friction interface.', 'outcome'=>'An honest exploration of AI-assisted retail automation.'],
        'invitation' => ['name'=>'Interactive Invitation', 'category'=>'Digital Experience', 'summary'=>'A personalised web experience that combines motion, music, and modern frontend craft.', 'tech'=>['JavaScript','CSS','Animation','Web Design'], 'challenge'=>'Turn a static invitation into a memorable, personal digital moment.', 'solution'=>'A responsive interaction that layers personalisation, timed movement, and media with restraint.', 'implementation'=>'The experience uses progressive enhancement and performance-conscious frontend techniques.', 'outcome'=>'A distinctive example of digital storytelling through the browser.']
    ];
}
