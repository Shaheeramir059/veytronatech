<header class="site-header">
  <div class="nav shell">
    <a class="brand" href="index.php" aria-label="VeytronaTech home">
      <img src="assets/images/veytronatech-mark.png" alt="" width="42" height="42" style="display:block;width:42px;height:42px;object-fit:contain">
      <span>VEYTRONA<span>TECH</span></span>
    </a>
    <button class="menu-toggle" aria-label="Open navigation" aria-expanded="false"><i></i><i></i></button>
    <nav class="nav-links" aria-label="Primary navigation">
      <a href="index.php"<?= is_active('index.php') ?>>Home</a>
      <a href="about.php"<?= is_active('about.php') ?>>About</a>
      <a href="services.php"<?= is_active('services.php') ?>>Services</a>
      <a href="build-solution.php"<?= is_active('build-solution.php') ?>>Build</a>
      <a href="portfolio.php"<?= is_active('portfolio.php') ?>>Work</a>
      <a href="index.php#process">Process</a>
      <a href="contact.php"<?= is_active('contact.php') ?>>Contact</a>
      <a class="button button-small" href="contact.php">Start a Project <span>↗</span></a>
    </nav>
  </div>
</header>
