<footer class="site-footer">
  <div class="shell footer-grid">
    <div>
      <a href="index.php" aria-label="VeytronaTech home" style="display:inline-block">
        <img src="assets/images/veytronatech-logo-full.png" alt="VeytronaTech — AI, Web, Digital Innovation" width="190" height="111" style="display:block;width:190px;height:111px;object-fit:contain">
      </a>
      <p>AI solutions, intelligent websites, and digital systems built for the future.</p>
    </div>
    <div>
      <p class="eyebrow">Navigate</p>
      <a href="services.php">Services</a>
      <a href="portfolio.php">Selected work</a>
      <a href="about.php">Our approach</a>
    </div>
    <div>
      <p class="eyebrow">Start a conversation</p>
      <a href="contact.php">Tell us what you are building <span>↗</span></a>
      <p class="muted">© <?= date('Y') ?> VeytronaTech</p>
    </div>
  </div>
</footer>
<?php foreach (($page_scripts ?? []) as $script): ?><script src="<?= e($script) ?>" defer></script><?php endforeach ?>
<script src="assets/js/main.js" defer></script>
</body>
</html>
