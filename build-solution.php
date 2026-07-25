<?php
$page_title = 'Build Your Solution | VeytronaTech';
$page_description = 'Explore the right AI, web, automation, or digital product direction for your business.';
$page_styles = ['assets/css/solution-builder.css'];
$page_scripts = ['assets/js/solution-builder.js'];
require 'includes/header.php';
require 'includes/navbar.php';
?>
<main id="main" class="shell">
  <section class="page-hero solution-hero">
    <p class="eyebrow">Build your solution</p>
    <h1>What Should We Build For You?</h1>
    <p>Tell us what you are trying to achieve. We will help you explore the right digital solution.</p>
  </section>

  <section class="solution-builder" aria-labelledby="solution-builder-title">
    <h2 id="solution-builder-title" class="skip-link">Build your solution</h2>
    <ol class="solution-progress" aria-label="Solution builder progress">
      <li class="active" data-progress="1"><b>01</b><span>Solution</span></li>
      <li data-progress="2"><b>02</b><span>Industry</span></li>
      <li data-progress="3"><b>03</b><span>Goal</span></li>
      <li data-progress="4"><b>04</b><span>Direction</span></li>
    </ol>

    <div class="solution-shell">
      <section class="solution-step active" data-step="1" aria-labelledby="solution-step-1-title">
        <div class="solution-step-head">
          <div><p class="eyebrow">Step 01 · Solution type</p><h2 id="solution-step-1-title">What are you looking to build?</h2><p>Choose the direction that feels closest to the challenge in front of you.</p></div>
          <span class="solution-step-number" aria-hidden="true">01</span>
        </div>
        <div class="solution-options" data-step="type" role="group" aria-label="Choose a solution type">
          <button class="solution-option" type="button" data-value="ai_solution"><span class="option-icon">AI</span><strong>AI Solution</strong><small>Intelligent systems, automation, computer vision, and data-led tools.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="website"><span class="option-icon">W</span><strong>Website</strong><small>A clear, high-performance digital presence built around your goals.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="web_application"><span class="option-icon">↗</span><strong>Web Application</strong><small>A purpose-built system for users, workflows, and future growth.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="ecommerce_platform"><span class="option-icon">+</span><strong>E-Commerce Platform</strong><small>A better way to discover, sell, manage, and grow online.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="business_automation"><span class="option-icon">↻</span><strong>Business Automation</strong><small>Connected workflows that reduce repetitive operational work.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="not_sure"><span class="option-icon">?</span><strong>I’m Not Sure Yet</strong><small>Start with the problem; we will help uncover the useful direction.</small><span class="option-check" aria-hidden="true">✓</span></button>
        </div>
      </section>

      <section class="solution-step" data-step="2" aria-labelledby="solution-step-2-title" hidden>
        <div class="solution-step-head">
          <div><p class="eyebrow">Step 02 · Industry</p><h2 id="solution-step-2-title">What industry or area are you working in?</h2><p>Context helps us suggest a direction that is relevant to the people and systems involved.</p></div>
          <span class="solution-step-number" aria-hidden="true">02</span>
        </div>
        <div class="solution-options" data-step="industry" role="group" aria-label="Choose an industry">
          <button class="solution-option" type="button" data-value="retail"><span class="option-icon">R</span><strong>Retail</strong><small>Stores, inventory, customer journeys, and operations.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="education"><span class="option-icon">E</span><strong>Education</strong><small>Learning experiences, administration, and student support.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="healthcare"><span class="option-icon">H</span><strong>Healthcare</strong><small>Patient experiences, information, and operational support.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="finance"><span class="option-icon">F</span><strong>Finance</strong><small>Trust, reporting, workflows, and customer services.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="real_estate"><span class="option-icon">RE</span><strong>Real Estate</strong><small>Properties, leads, operations, and client experiences.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="ecommerce"><span class="option-icon">EC</span><strong>E-Commerce</strong><small>Discovery, conversion, fulfilment, and repeat business.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="manufacturing"><span class="option-icon">M</span><strong>Manufacturing</strong><small>Production visibility, quality, and connected operations.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="other"><span class="option-icon">+</span><strong>Other</strong><small>A different context with a problem worth solving.</small><span class="option-check" aria-hidden="true">✓</span></button>
        </div>
        <div class="solution-actions"><button class="solution-back" type="button" data-back>← Back to solution type</button></div>
      </section>

      <section class="solution-step" data-step="3" aria-labelledby="solution-step-3-title" hidden>
        <div class="solution-step-head">
          <div><p class="eyebrow">Step 03 · Primary goal</p><h2 id="solution-step-3-title">What would you like to achieve?</h2><p>Select the outcome that would make the biggest practical difference.</p></div>
          <span class="solution-step-number" aria-hidden="true">03</span>
        </div>
        <div class="solution-options" data-step="goal" role="group" aria-label="Choose a primary goal">
          <button class="solution-option" type="button" data-value="automate"><span class="option-icon">↻</span><strong>Automate repetitive work</strong><small>Reduce manual steps and improve consistency.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="sales"><span class="option-icon">↑</span><strong>Increase sales</strong><small>Create a clearer, more effective path to conversion.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="experience"><span class="option-icon">◎</span><strong>Improve customer experience</strong><small>Make every important interaction easier and more useful.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="data"><span class="option-icon">◫</span><strong>Analyze business data</strong><small>Turn information into clearer operational decisions.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="product"><span class="option-icon">✦</span><strong>Build a new digital product</strong><small>Shape a valuable new service, platform, or experience.</small><span class="option-check" aria-hidden="true">✓</span></button>
          <button class="solution-option" type="button" data-value="problem"><span class="option-icon">?</span><strong>Solve a specific business problem</strong><small>Start with the challenge and define the right response.</small><span class="option-check" aria-hidden="true">✓</span></button>
        </div>
        <div class="solution-actions"><button class="solution-back" type="button" data-back>← Back to industry</button></div>
      </section>

      <section class="solution-step" data-step="4" aria-labelledby="solution-step-4-title" hidden aria-live="polite">
        <div class="solution-step-head">
          <div><p class="eyebrow">Step 04 · Recommended direction</p><h2 id="solution-step-4-title">A practical direction to explore.</h2><p>This is a structured starting point based on the choices you made—not a substitute for a discovery conversation.</p></div>
          <span class="solution-step-number" aria-hidden="true">04</span>
        </div>
        <div class="solution-result">
          <div class="solution-result-summary"><p class="eyebrow">Recommended direction</p><h3 data-result-title></h3><p data-result-description></p><div class="solution-indicator" aria-label="Solution direction generated"><span class="active"></span><span class="active"></span><span class="active"></span><span class="active"></span></div><p class="solution-brief" data-result-brief></p></div>
          <div class="solution-result-detail"><h3>Potential capabilities</h3><ul data-result-capabilities></ul><h3>Recommended technology direction</h3><ul data-result-technologies></ul><a class="button" href="contact.php" data-discuss>Discuss This Project <span>↗</span></a></div>
        </div>
        <div class="solution-actions"><button class="solution-restart" type="button" data-restart>← Start again</button><button class="solution-back" type="button" data-back>Back to primary goal</button></div>
      </section>
    </div>
  </section>
</main>
<?php require 'includes/footer.php'; ?>
