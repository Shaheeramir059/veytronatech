import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { World } from './world.js';
import { capabilities, processSteps, projects, services } from './data.js';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const legacySection = {
  '/about': 'about',
  '/services': 'services',
  '/portfolio': 'work',
  '/project': 'work',
  '/build-solution': 'build',
  '/contact': 'contact'
}[location.pathname];
const canvas = document.querySelector('#scene');
const world = new World(canvas);
const pulseControl = document.querySelector('[data-scene-pulse]');
const motionControl = document.querySelector('[data-scene-motion]');
const resetControl = document.querySelector('[data-scene-reset]');

pulseControl.addEventListener('click', () => world.pulseCore());
motionControl.addEventListener('click', () => {
  const playing = world.toggleMotion();
  motionControl.textContent = playing ? 'Pause motion' : 'Play motion';
  motionControl.setAttribute('aria-pressed', String(playing));
});
resetControl.addEventListener('click', () => world.resetView());
world.on('pulse', () => {
  pulseControl.classList.remove('active');
  requestAnimationFrame(() => pulseControl.classList.add('active'));
});

const fill = (root, html) => { root.innerHTML = html; };

fill(document.querySelector('[data-capabilities]'), capabilities.map(item => `<span>${item}</span>`).join(''));
fill(document.querySelector('[data-process]'), processSteps.map(step => `
  <article>
    <small>${step.number}</small>
    <h3>${step.title}</h3>
    <p>${step.copy}</p>
  </article>
`).join(''));

const serviceRoot = document.querySelector('[data-services]');
fill(serviceRoot, services.map(service => `
  <button type="button" class="service-card" data-service="${service.id}">
    <small>${service.index}</small>
    <h3>${service.title}</h3>
    <p>${service.copy}</p>
  </button>
`).join(''));

const inspect = document.querySelector('[data-inspect]');
const setInspect = service => {
  serviceRoot.querySelectorAll('[data-service]').forEach(card => {
    card.classList.toggle('active', Boolean(service) && card.dataset.service === service.id);
  });
  if (!service) {
    inspect.hidden = true;
    world.clearFocus();
    return;
  }
  inspect.hidden = false;
  inspect.querySelector('[data-inspect-index]').textContent = `Node ${service.index}`;
  inspect.querySelector('[data-inspect-title]').textContent = service.title;
  inspect.querySelector('[data-inspect-copy]').textContent = service.copy;
  world.focusService(service.id);
};

world.on('select', setInspect);
world.on('project', project => openProject(project));
world.on('hover', data => {
  const hint = document.querySelector('[data-hint]');
  const tooltip = document.querySelector('[data-tooltip]');
  if (!data) {
    hint.textContent = 'Drag the sculpture · click a node';
    tooltip.hidden = true;
    return;
  }
  if (data.kind === 'service') hint.textContent = `${data.service.title} · click to focus`;
  if (data.kind === 'project') hint.textContent = `${data.project.name} · click to open`;
  if (data.kind === 'core') hint.textContent = 'Click the core to send a pulse through it';
  if (data.kind === 'hologram') hint.textContent = 'Signal relay - click to pulse the core';
  if (data.kind === 'core') {
    tooltip.hidden = true;
    return;
  }
  tooltip.hidden = false;
  tooltip.textContent = data.service?.title || data.project?.name || data.title || '';
});

const tooltip = document.querySelector('[data-tooltip]');
addEventListener('pointermove', event => {
  if (tooltip.hidden) return;
  tooltip.style.left = `${event.clientX}px`;
  tooltip.style.top = `${event.clientY}px`;
});

serviceRoot.addEventListener('click', event => {
  const card = event.target.closest('[data-service]');
  if (!card) return;
  const service = services.find(item => item.id === card.dataset.service);
  setInspect(inspect.hidden || inspect.querySelector('[data-inspect-title]').textContent !== service.title ? service : null);
});
document.querySelector('[data-inspect-close]').addEventListener('click', () => setInspect(null));

const projectRoot = document.querySelector('[data-projects]');
fill(projectRoot, projects.map(project => `
  <button type="button" class="work-card" data-project="${project.id}">
    <small>${project.category}</small>
    <h3>${project.name}</h3>
    <p>${project.summary}</p>
  </button>
`).join(''));

const dialog = document.querySelector('[data-project-dialog]');
function openProject(project) {
  dialog.querySelector('[data-d-category]').textContent = project.category;
  dialog.querySelector('[data-d-name]').textContent = project.name;
  dialog.querySelector('[data-d-summary]').textContent = project.summary;
  dialog.querySelector('[data-d-challenge]').textContent = project.challenge;
  dialog.querySelector('[data-d-solution]').textContent = project.solution;
  fill(dialog.querySelector('[data-d-tech]'), project.tech.map(tag => `<span class="chip">${tag}</span>`).join(''));
  dialog.showModal();
}
projectRoot.addEventListener('click', event => {
  const card = event.target.closest('[data-project]');
  if (!card) return;
  openProject(projects.find(item => item.id === card.dataset.project));
});
dialog.querySelector('[data-d-close]').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});

const builder = document.querySelector('[data-builder]');
const builderState = { type: '', industry: '', goal: '' };
const builderOptions = {
  type: [
    ['ai_solution', 'AI Solution'],
    ['website', 'Website'],
    ['web_application', 'Web Application'],
    ['ecommerce_platform', 'E-Commerce Platform'],
    ['business_automation', 'Business Automation'],
    ['not_sure', 'I’m Not Sure Yet']
  ],
  industry: [
    ['retail', 'Retail'],
    ['education', 'Education'],
    ['healthcare', 'Healthcare'],
    ['finance', 'Finance'],
    ['real_estate', 'Real Estate'],
    ['ecommerce', 'E-Commerce'],
    ['manufacturing', 'Manufacturing'],
    ['other', 'Other']
  ],
  goal: [
    ['automate', 'Automate repetitive work'],
    ['sales', 'Increase sales'],
    ['experience', 'Improve customer experience'],
    ['data', 'Analyze business data'],
    ['product', 'Build a new digital product'],
    ['problem', 'Solve a specific business problem']
  ]
};

const builderCopy = {
  type: {
    ai_solution: 'Intelligent Operations System',
    website: 'High-Performance Digital Platform',
    web_application: 'Custom Web Application',
    ecommerce_platform: 'Connected Commerce Platform',
    business_automation: 'Business Workflow Automation',
    not_sure: 'Discovery-Led Digital Solution'
  }
};

Object.entries(builderOptions).forEach(([key, options]) => {
  fill(builder.querySelector(`[data-choice="${key}"]`), options.map(([value, label]) => `
    <button type="button" class="option" data-value="${value}">${label}</button>
  `).join(''));
});

const showBuilderStep = step => {
  builder.querySelectorAll('.builder-step').forEach(node => {
    node.hidden = Number(node.dataset.step) !== step;
  });
  fill(builder.querySelector('[data-builder-progress]'), [1, 2, 3, 4].map(n => `<i class="${n <= step ? 'on' : ''}"></i>`).join(''));
};

builder.addEventListener('click', event => {
  const option = event.target.closest('.option');
  if (!option) return;
  const group = option.closest('[data-choice]');
  const key = group.dataset.choice;
  builderState[key] = option.dataset.value;
  group.querySelectorAll('.option').forEach(item => item.classList.toggle('selected', item === option));
  if (key === 'type') showBuilderStep(2);
  if (key === 'industry') showBuilderStep(3);
  if (key === 'goal') {
    const typeLabel = builderOptions.type.find(([value]) => value === builderState.type)[1];
    const industryLabel = builderOptions.industry.find(([value]) => value === builderState.industry)[1];
    const goalLabel = builderOptions.goal.find(([value]) => value === builderState.goal)[1];
    const title = `${industryLabel} ${builderCopy.type[builderState.type]}`;
    builder.querySelector('[data-result-title]').textContent = title;
    builder.querySelector('[data-result-copy]').textContent = 'A focused direction connecting technical possibility with a clear human or business need.';
    builder.querySelector('[data-result-brief]').textContent = `${typeLabel} · ${industryLabel} · ${goalLabel}`;
    sessionStorage.setItem('veytronaSolutionBrief', JSON.stringify({
      projectType: typeLabel,
      industry: industryLabel,
      goal: goalLabel,
      recommendation: title
    }));
    showBuilderStep(4);
  }
});

builder.querySelector('[data-restart]').addEventListener('click', () => {
  builderState.type = builderState.industry = builderState.goal = '';
  builder.querySelectorAll('.option.selected').forEach(item => item.classList.remove('selected'));
  sessionStorage.removeItem('veytronaSolutionBrief');
  showBuilderStep(1);
});
showBuilderStep(1);

const form = document.querySelector('#contact-form');
const notice = document.querySelector('#form-notice');
form.addEventListener('submit', async event => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  notice.hidden = true;
  const values = Object.fromEntries(new FormData(form));
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'We could not send your message right now.');
    notice.className = 'notice success';
    notice.textContent = data.message || 'Message sent.';
    notice.hidden = false;
    form.reset();
  } catch (error) {
    notice.className = 'notice error';
    notice.textContent = `${error.message} You can also email sales@veytronatech.com.`;
    notice.hidden = false;
  } finally {
    button.disabled = false;
  }
});

try {
  const brief = JSON.parse(sessionStorage.getItem('veytronaSolutionBrief') || 'null');
  if (brief) {
    const typeField = document.querySelector('#project_type');
    const mapped = brief.projectType === 'I’m Not Sure Yet' ? 'Other' : brief.projectType;
    if ([...typeField.options].some(option => option.value === mapped)) typeField.value = mapped;
    document.querySelector('#message').value = `I’m exploring: ${brief.recommendation}\nIndustry: ${brief.industry}\nPrimary goal: ${brief.goal}\n\nI would like to discuss this direction.`;
  }
} catch {
  /* ignore malformed storage */
}

const nav = document.querySelector('.nav');
const menu = document.querySelector('.menu-toggle');
const links = document.querySelector('.links');
menu.addEventListener('click', () => {
  const open = links.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
links.querySelectorAll('a').forEach(link => link.addEventListener('click', () => links.classList.remove('open')));

const sections = [...document.querySelectorAll('main section[id]')];
const updateActive = () => {
  const current = [...sections].reverse().find(section => section.getBoundingClientRect().top < innerHeight * 0.45) || sections[0];
  links.querySelectorAll('a').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
  });
  nav.classList.toggle('scrolled', scrollY > 12);
  world.setSection(current.id);
  document.body.dataset.section = current.id;
};
addEventListener('scroll', updateActive, { passive: true });
updateActive();

if (legacySection && !location.hash) {
  history.replaceState(null, '', `/#${legacySection}`);
  requestAnimationFrame(() => document.querySelector(`#${legacySection}`)?.scrollIntoView());
}

if (!reducedMotion) {
  gsap.from('.hero h1, .hero .lede, .hero .actions, .hero .hint', {
    y: 24,
    opacity: 0,
    duration: 1.05,
    stagger: 0.1,
    ease: 'power3.out'
  });
  document.querySelectorAll('.copy:not(.hero)').forEach(panel => {
    gsap.from(panel.children, {
      scrollTrigger: { trigger: panel, start: 'top 92%' },
      y: 22,
      opacity: 0,
      duration: 0.7,
      stagger: 0.06,
      ease: 'power2.out'
    });
  });
}

const dot = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
if (matchMedia('(pointer: fine)').matches && !reducedMotion) {
  addEventListener('pointermove', event => {
    dot.style.left = ring.style.left = `${event.clientX}px`;
    dot.style.top = ring.style.top = `${event.clientY}px`;
  });
  document.querySelectorAll('a,button,input,select,textarea').forEach(element => {
    element.addEventListener('mouseenter', () => ring.classList.add('hover'));
    element.addEventListener('mouseleave', () => ring.classList.remove('hover'));
  });
}
