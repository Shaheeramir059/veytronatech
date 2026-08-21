document.addEventListener('DOMContentLoaded', () => {
  const siteUrl = 'https://veytronatech.vercel.app';
  const route = location.pathname.replace(/\/$/, '') || '/';
  const pageMetadata = {
    '/': {
      title: 'VeytronaTech | AI, Web Development & Digital Innovation',
      description: 'VeytronaTech builds intelligent AI solutions, modern websites, automation systems, and digital experiences.'
    },
    '/contact': {
      title: 'Contact VeytronaTech | Start a Digital Project',
      description: 'Contact VeytronaTech to discuss AI solutions, websites, web applications, automation, or a digital product for your business.'
    },
    '/build-solution': {
      title: 'Find the Right Digital Solution | VeytronaTech',
      description: 'Explore the right AI, website, web application, e-commerce, or automation direction for your business with VeytronaTech.'
    },
    '/about': {
      title: 'About VeytronaTech | Practical AI and Digital Products',
      description: 'Learn how VeytronaTech combines AI, software engineering, and thoughtful digital design to solve real business problems.'
    },
    '/services': {
      title: 'AI, Web Development and Automation Services | VeytronaTech',
      description: 'VeytronaTech delivers AI solutions, web development, business automation, and digital innovation for useful real-world outcomes.'
    },
    '/portfolio': {
      title: 'AI and Digital Product Portfolio | VeytronaTech',
      description: 'Explore VeytronaTech projects in AI commerce, computer vision, and educational AI products.'
    }
  }[route];
  if (pageMetadata) {
    document.title = pageMetadata.title;
    const setMeta = (selector, attribute, key, content) => {
      let element = document.head.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        document.head.append(element);
      }
      element.setAttribute(attribute, key);
      element.content = content;
    };
    setMeta('meta[name="description"]', 'name', 'description', pageMetadata.description);
    setMeta('meta[name="robots"]', 'name', 'robots', 'index,follow');
    const canonical = document.head.querySelector('link[rel="canonical"]') || document.head.appendChild(document.createElement('link'));
    canonical.rel = 'canonical';
    canonical.href = `${siteUrl}${route}`;
    setMeta('meta[property="og:type"]', 'property', 'og:type', 'website');
    setMeta('meta[property="og:title"]', 'property', 'og:title', pageMetadata.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', pageMetadata.description);
    setMeta('meta[property="og:url"]', 'property', 'og:url', `${siteUrl}${route}`);
    setMeta('meta[property="og:image"]', 'property', 'og:image', `${siteUrl}/assets/images/veytronatech-logo-full.png`);
    setMeta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', pageMetadata.title);
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', pageMetadata.description);
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', `${siteUrl}/assets/images/veytronatech-logo-full.png`);
    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'VeytronaTech',
      url: siteUrl,
      logo: `${siteUrl}/assets/images/veytronatech-logo-full.png`,
      description: pageMetadata.description,
      email: 'sales@veytronatech.com',
      telephone: '+923337756155',
      sameAs: ['https://github.com/Shaheeramir059']
    });
    document.head.append(schema);
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const progress = document.createElement('div');

  progress.setAttribute('aria-hidden', 'true');
  Object.assign(progress.style, {
    position: 'fixed', top: '0', left: '0', width: '0', height: '3px',
    zIndex: '40', background: 'linear-gradient(90deg, #38bdf8, #8b5cf6)',
    transition: reducedMotion ? 'none' : 'width .12s linear'
  });
  document.body.append(progress);

  const updateScrollUI = () => {
    header?.classList.toggle('scrolled', scrollY > 10);
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = `${scrollable > 0 ? (scrollY / scrollable) * 100 : 0}%`;
  };
  addEventListener('scroll', updateScrollUI, { passive: true });
  updateScrollUI();

  const menu = document.querySelector('.menu-toggle');
  const links = document.querySelector('.nav-links');
  const closeMenu = () => {
    links?.classList.remove('open');
    document.body.classList.remove('nav-open');
    menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Open navigation');
  };
  menu?.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    document.body.classList.toggle('nav-open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  document.querySelectorAll('.nav-links a').forEach(link => link.addEventListener('click', closeMenu));
  addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
      menu?.focus();
    }
  });
  addEventListener('resize', () => {
    if (innerWidth > 850) closeMenu();
  });

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealTargets = document.querySelectorAll('.hero, .page-hero, .section, .cta');
    revealTargets.forEach(target => {
      target.style.opacity = '0';
      target.style.transform = 'translateY(18px)';
      target.style.transition = 'opacity .55s ease, transform .55s ease';
    });
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08 });
    revealTargets.forEach(target => observer.observe(target));
  }

  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (matchMedia('(pointer: fine)').matches && !reducedMotion && dot && ring) {
    addEventListener('mousemove', event => {
      dot.style.left = ring.style.left = `${event.clientX}px`;
      dot.style.top = ring.style.top = `${event.clientY}px`;
    });
    document.querySelectorAll('a,button,input,select,textarea').forEach(element => {
      element.addEventListener('mouseenter', () => ring.classList.add('hover'));
      element.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
    const orb = document.querySelector('.orb');
    document.querySelector('.hero')?.addEventListener('mousemove', event => {
      orb?.style.setProperty('--move-x', `${(event.clientX - innerWidth / 2) / 40}px`);
      orb?.style.setProperty('--move-y', `${(event.clientY - innerHeight / 2) / 40}px`);
    });
  }

  const tabs = [...document.querySelectorAll('.tech-tab')];
  const panel = document.querySelector('.tech-panel');
  const stacks = {
    ai: ['Python', 'PyTorch', 'TensorFlow', 'Transformers', 'OpenCV', 'Scikit-learn'],
    web: ['PHP', 'JavaScript', 'HTML', 'CSS', 'React', 'REST APIs'],
    backend: ['FastAPI', 'Flask', 'PHP', 'MySQL', 'SQLite'],
    tools: ['Git', 'GitHub', 'Google Colab', 'Linux']
  };
  const selectTab = tab => {
    if (!panel) return;
    tabs.forEach(item => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panel.replaceChildren();
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id || '');
    const title = document.createElement('h3');
    title.textContent = tab.textContent;
    const list = document.createElement('div');
    list.className = 'tech-list';
    stacks[tab.dataset.tech].forEach(technology => {
      const item = document.createElement('span');
      item.textContent = technology;
      list.append(item);
    });
    panel.append(title, list);
  };
  tabs.forEach((tab, index) => {
    tab.id ||= `tech-tab-${index}`;
    tab.setAttribute('role', 'tab');
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + direction + tabs.length) % tabs.length;
      tabs[next].focus();
      selectTab(tabs[next]);
    });
  });

  const steps = [...document.querySelectorAll('.process-step')];
  const processPanel = document.querySelector('.process-panel');
  steps.forEach(step => step.addEventListener('click', () => {
    steps.forEach(item => item.classList.toggle('active', item === step));
    if (!processPanel) return;
    processPanel.replaceChildren();
    const number = document.createElement('span');
    number.className = 'eyebrow';
    number.textContent = step.dataset.number;
    const title = document.createElement('h3');
    title.textContent = step.dataset.title;
    const copy = document.createElement('p');
    copy.className = 'muted';
    copy.textContent = step.dataset.copy;
    processPanel.append(number, title, copy);
  }));

  const response = document.querySelector('.demo-response');
  const demoOptions = document.querySelectorAll('.demo-options button');
  let demoCta = document.querySelector('.demo-cta');
  demoOptions.forEach(button => button.addEventListener('click', () => {
    demoOptions.forEach(item => item.classList.toggle('active', item === button));
    response.textContent = button.dataset.response;
    const projectType = button.dataset.projectType || button.textContent.trim();
    sessionStorage.setItem('veytronaProjectType', projectType);
    if (!demoCta) {
      demoCta = document.createElement('a');
      demoCta.className = 'text-link demo-cta';
      demoCta.href = '/contact';
      demoCta.textContent = 'Continue with this idea →';
      response.after(demoCta);
    }
    demoCta.hidden = false;
  }));

  const projectType = document.querySelector('#project_type');
  const messageField = document.querySelector('#message');
  const savedProjectType = sessionStorage.getItem('veytronaProjectType');
  let solutionBrief;
  try {
    solutionBrief = JSON.parse(sessionStorage.getItem('veytronaSolutionBrief') || 'null');
  } catch {
    solutionBrief = null;
  }
  if (projectType && solutionBrief && !projectType.value) {
    const mappedType = solutionBrief.projectType === 'I’m Not Sure Yet' ? 'Other' : solutionBrief.projectType;
    const option = [...projectType.options].find(item => item.value === mappedType);
    if (option) projectType.value = mappedType;
    if (messageField && !messageField.value) {
      messageField.value = `I’m exploring: ${solutionBrief.recommendation}\nIndustry: ${solutionBrief.industry}\nPrimary goal: ${solutionBrief.goal}\n\nI would like to discuss this direction.`;
    }
    const hint = document.createElement('p');
    hint.className = 'notice success';
    hint.textContent = `Your solution brief for ${solutionBrief.recommendation} has been added to this form.`;
    projectType.closest('.field-grid')?.before(hint);
    sessionStorage.removeItem('veytronaSolutionBrief');
  } else if (projectType && savedProjectType && !projectType.value) {
    const option = [...projectType.options].find(item => item.value === savedProjectType);
    if (option) {
      projectType.value = savedProjectType;
      const hint = document.createElement('p');
      hint.className = 'notice success';
      hint.textContent = `Project type set to ${savedProjectType} based on your selection.`;
      projectType.closest('.field-grid')?.before(hint);
    }
    sessionStorage.removeItem('veytronaProjectType');
  }

  const message = messageField;
  if (message) {
    const label = document.querySelector('label[for="message"]');
    const count = document.createElement('span');
    count.className = 'muted';
    count.style.float = 'right';
    count.setAttribute('aria-live', 'polite');
    const updateCount = () => { count.textContent = `${message.value.length.toLocaleString()} / 5,000`; };
    updateCount();
    label?.append(' ', count);
    message.addEventListener('input', updateCount);
  }
});
