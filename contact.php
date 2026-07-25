<?php
require 'includes/functions.php';
require 'includes/database.php';

start_secure_session();

$page_title = 'Contact VeytronaTech | Start a Project';
$errors = [];
$values = ['name' => '', 'email' => '', 'company' => '', 'project_type' => '', 'budget' => '', 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($values as $field => $_) {
        $values[$field] = trim((string) ($_POST[$field] ?? ''));
    }

    if (!verify_csrf($_POST['csrf_token'] ?? null)) {
        $errors[] = 'Your form session expired. Please refresh and try again.';
    }
    if (mb_strlen($values['name']) < 2 || mb_strlen($values['name']) > 100) {
        $errors[] = 'Please enter a valid full name.';
    }
    if (!filter_var($values['email'], FILTER_VALIDATE_EMAIL) || mb_strlen($values['email']) > 254) {
        $errors[] = 'Please enter a valid email address.';
    }

    $allowed = ['AI Solution', 'Website', 'Web Application', 'E-Commerce', 'Automation', 'Other'];
    if (!in_array($values['project_type'], $allowed, true)) {
        $errors[] = 'Please choose a project type.';
    }
    if (mb_strlen($values['message']) < 20 || mb_strlen($values['message']) > 5000) {
        $errors[] = 'Please describe your project in 20 to 5,000 characters.';
    }
    if (mb_strlen($values['company']) > 150 || mb_strlen($values['budget']) > 100) {
        $errors[] = 'One of your optional fields is too long.';
    }

    if (!$errors) {
        try {
            $statement = db()->prepare('INSERT INTO contact_messages (name, email, company, project_type, budget, message) VALUES (:name, :email, :company, :type, :budget, :message)');
            $statement->execute([
                ':name' => $values['name'], ':email' => $values['email'], ':company' => $values['company'],
                ':type' => $values['project_type'], ':budget' => $values['budget'], ':message' => $values['message']
            ]);
            flash('success', 'Thank you — your message was received. We will review it and be in touch.');
            header('Location: contact.php');
            exit;
        } catch (Throwable $exception) {
            $errors[] = 'We could not send your message right now. Please try again shortly.';
        }
    }
}

require 'includes/header.php';
require 'includes/navbar.php';
?>
<main id="main" class="shell">
  <section class="page-hero">
    <p class="eyebrow">Start a project</p>
    <h1>Let’s talk about what you are trying to solve.</h1>
    <p>Share a little context. We will use it to understand the opportunity and suggest a useful next step.</p>
  </section>

  <section class="section">
    <div class="contact-layout">
      <aside class="contact-points">
        <div class="contact-expert">
          <p class="eyebrow">Your point of contact</p>
          <h3>Shaheer Bin Amir</h3>
          <p><strong>AI Expert</strong></p>
          <p><a href="tel:+923337756155">0333 7756155</a></p>
          <p><a href="mailto:shaheeramir059@gmail.com">shaheeramir059@gmail.com</a></p>
        </div>
        <div><h3>Clear from the start</h3><p>We begin with the problem, your users, and the outcomes that matter.</p></div>
        <div><h3>Thoughtful recommendations</h3><p>Not every project needs the same technology. We will help make the trade-offs visible.</p></div>
        <div><h3>Private by design</h3><p>Your submission is stored securely and only available to authorised administrators.</p></div>
      </aside>

      <div class="form-card">
        <?php if ($success = flash('success')): ?><p class="notice success" role="status"><?= e($success) ?></p><?php endif ?>
        <?php foreach ($errors as $error): ?><p class="notice error" role="alert"><?= e($error) ?></p><?php endforeach ?>
        <form method="post" novalidate>
          <input type="hidden" name="csrf_token" value="<?= e(csrf_token()) ?>">
          <div class="field-grid">
            <div class="field"><label for="name">Full Name</label><input id="name" name="name" autocomplete="name" required maxlength="100" value="<?= e($values['name']) ?>"></div>
            <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" required maxlength="254" value="<?= e($values['email']) ?>"></div>
          </div>
          <div class="field"><label for="company">Company / Organization</label><input id="company" name="company" autocomplete="organization" maxlength="150" value="<?= e($values['company']) ?>"></div>
          <div class="field-grid">
            <div class="field"><label for="project_type">Project Type</label><select id="project_type" name="project_type" required><option value="">Select one</option><?php foreach (['AI Solution', 'Website', 'Web Application', 'E-Commerce', 'Automation', 'Other'] as $type): ?><option<?= $values['project_type'] === $type ? ' selected' : '' ?>><?= $type ?></option><?php endforeach ?></select></div>
            <div class="field"><label for="budget">Budget Range <span class="muted">(Optional)</span></label><input id="budget" name="budget" maxlength="100" value="<?= e($values['budget']) ?>"></div>
          </div>
          <div class="field"><label for="message">Project Description</label><textarea id="message" name="message" required minlength="20" maxlength="5000"><?= e($values['message']) ?></textarea></div>
          <button class="button" type="submit">Send project details <span>↗</span></button>
        </form>
      </div>
    </div>
  </section>
</main>
<?php require 'includes/footer.php'; ?>
