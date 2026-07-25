document.addEventListener('DOMContentLoaded', () => {
  const builder = document.querySelector('.solution-builder');
  if (!builder) return;

  const state = { type: '', industry: '', goal: '' };
  const labels = {
    type: { ai_solution: 'AI Solution', website: 'Website', web_application: 'Web Application', ecommerce_platform: 'E-Commerce Platform', business_automation: 'Business Automation', not_sure: 'I’m Not Sure Yet' },
    industry: { retail: 'Retail', education: 'Education', healthcare: 'Healthcare', finance: 'Finance', real_estate: 'Real Estate', ecommerce: 'E-Commerce', manufacturing: 'Manufacturing', other: 'Other' },
    goal: { automate: 'Automate repetitive work', sales: 'Increase sales', experience: 'Improve customer experience', data: 'Analyze business data', product: 'Build a new digital product', problem: 'Solve a specific business problem' }
  };

  const solutionRecommendations = {
    ai_solution: {
      retail: {
        automate: {
          title: 'AI-Powered Retail Automation',
          description: 'A focused system for making retail operations more visible, consistent, and efficient.',
          capabilities: ['Computer vision', 'Product recognition', 'Inventory monitoring', 'Automated analytics', 'Intelligent business dashboards'],
          technologies: ['Computer Vision', 'Machine Learning', 'Python', 'FastAPI', 'Web Dashboard']
        }
      }
    },
    website: {
      education: {
        experience: {
          title: 'Intelligent Education Platform',
          description: 'A clear digital learning experience that supports students, educators, and ongoing improvement.',
          capabilities: ['Student portals', 'Course management', 'Interactive learning', 'AI assistance', 'Analytics dashboard'],
          technologies: ['PHP', 'JavaScript', 'Learning APIs', 'AI Integration', 'Analytics']
        }
      }
    },
    ecommerce_platform: {
      ecommerce: {
        sales: {
          title: 'Conversion-Focused Commerce Platform',
          description: 'A practical e-commerce foundation that helps customers find the right products and complete purchases with confidence.',
          capabilities: ['Product discovery', 'Responsive storefront', 'Checkout optimisation', 'Customer insights', 'Order workflows'],
          technologies: ['E-Commerce Platform', 'PHP', 'JavaScript', 'Payment APIs', 'Analytics']
        }
      }
    }
  };

  const solutionDefaults = {
    ai_solution: { direction: 'Intelligent Operations System', description: 'A focused AI solution that connects useful data, repeatable decisions, and practical workflows.', capabilities: ['Process intelligence', 'Predictive insights', 'Workflow support'], technologies: ['Python', 'Machine Learning', 'FastAPI', 'Web Dashboard'] },
    website: { direction: 'High-Performance Digital Platform', description: 'A considered website direction that makes the value of your offer easier to understand and act on.', capabilities: ['Responsive experience', 'Clear content structure', 'Conversion paths'], technologies: ['PHP', 'JavaScript', 'HTML', 'CSS', 'Analytics'] },
    web_application: { direction: 'Custom Web Application', description: 'A web application direction built around the users, workflows, and information that matter most.', capabilities: ['Role-based workflows', 'Connected data', 'Operational dashboard'], technologies: ['PHP', 'JavaScript', 'REST APIs', 'SQLite or MySQL'] },
    ecommerce_platform: { direction: 'Connected Commerce Platform', description: 'An e-commerce foundation designed to make buying, fulfilment, and ongoing improvement easier to manage.', capabilities: ['Product catalogue', 'Customer journeys', 'Order workflows'], technologies: ['E-Commerce APIs', 'PHP', 'JavaScript', 'Analytics'] },
    business_automation: { direction: 'Business Workflow Automation', description: 'An automation direction that removes repeated handoffs and makes key business processes more reliable.', capabilities: ['Workflow automation', 'System integrations', 'Status visibility'], technologies: ['APIs', 'Python', 'Automation Tools', 'Web Dashboard'] },
    not_sure: { direction: 'Discovery-Led Digital Solution', description: 'A structured discovery direction for clarifying the problem, opportunity, and most useful next step.', capabilities: ['Problem mapping', 'User journey review', 'Opportunity prioritisation'], technologies: ['Discovery Workshop', 'Prototype', 'Analytics', 'Roadmap'] }
  };

  const industryProfiles = {
    retail: { adjective: 'Retail', capabilities: ['Inventory visibility', 'Customer journey insights'], technologies: ['Retail analytics'] },
    education: { adjective: 'Education', capabilities: ['Learner support', 'Progress visibility'], technologies: ['Learning tools'] },
    healthcare: { adjective: 'Healthcare', capabilities: ['Service coordination', 'Information clarity'], technologies: ['Secure workflows'] },
    finance: { adjective: 'Financial', capabilities: ['Reporting workflows', 'Trust-focused experiences'], technologies: ['Secure APIs'] },
    real_estate: { adjective: 'Property', capabilities: ['Lead management', 'Property discovery'], technologies: ['CRM integration'] },
    ecommerce: { adjective: 'Commerce', capabilities: ['Product discovery', 'Conversion insights'], technologies: ['Commerce APIs'] },
    manufacturing: { adjective: 'Manufacturing', capabilities: ['Operational visibility', 'Quality monitoring'], technologies: ['Data integrations'] },
    other: { adjective: 'Business', capabilities: ['Workflow clarity', 'Operational insight'], technologies: ['Flexible APIs'] }
  };

  const goalProfiles = {
    automate: { title: 'Automation', capability: 'Automated workflows', technology: 'Automation services' },
    sales: { title: 'Growth', capability: 'Conversion optimisation', technology: 'Analytics' },
    experience: { title: 'Experience', capability: 'Customer self-service', technology: 'Experience design' },
    data: { title: 'Analytics', capability: 'Decision dashboards', technology: 'Data pipeline' },
    product: { title: 'Digital Product', capability: 'Product prototyping', technology: 'Product architecture' },
    problem: { title: 'Problem-Solving', capability: 'Problem-specific workflows', technology: 'Technical discovery' }
  };

  const steps = [...builder.querySelectorAll('.solution-step')];
  const progressItems = [...builder.querySelectorAll('[data-progress]')];
  const unique = values => [...new Set(values)];

  const showStep = number => {
    steps.forEach(step => {
      const active = Number(step.dataset.step) === number;
      step.classList.toggle('active', active);
      step.hidden = !active;
      if (active) {
        const heading = step.querySelector('h2');
        heading.tabIndex = -1;
        requestAnimationFrame(() => heading.focus({ preventScroll: true }));
      }
    });
    progressItems.forEach(item => {
      const itemStep = Number(item.dataset.progress);
      item.classList.toggle('active', itemStep === number);
      item.classList.toggle('complete', itemStep < number);
      item.setAttribute('aria-current', itemStep === number ? 'step' : 'false');
    });
  };

  const makeList = (target, values) => {
    target.replaceChildren();
    values.forEach(value => {
      const item = document.createElement('li');
      item.textContent = value;
      target.append(item);
    });
  };

  const getRecommendation = () => {
    const specific = solutionRecommendations[state.type]?.[state.industry]?.[state.goal];
    if (specific) return specific;
    const base = solutionDefaults[state.type];
    const industry = industryProfiles[state.industry];
    const goal = goalProfiles[state.goal];
    return {
      title: `${industry.adjective} ${goal.title} ${base.direction}`,
      description: `${base.description} It is tailored around the needs of a ${industry.adjective.toLowerCase()} context and the goal of ${labels.goal[state.goal].toLowerCase()}.`,
      capabilities: unique([...base.capabilities, ...industry.capabilities, goal.capability]).slice(0, 5),
      technologies: unique([...base.technologies, ...industry.technologies, goal.technology]).slice(0, 5)
    };
  };

  const renderResult = () => {
    const recommendation = getRecommendation();
    builder.querySelector('[data-result-title]').textContent = recommendation.title;
    builder.querySelector('[data-result-description]').textContent = recommendation.description;
    builder.querySelector('[data-result-brief]').innerHTML = `<strong>Your brief:</strong> ${labels.type[state.type]} · ${labels.industry[state.industry]} · ${labels.goal[state.goal]}`;
    makeList(builder.querySelector('[data-result-capabilities]'), recommendation.capabilities);
    makeList(builder.querySelector('[data-result-technologies]'), recommendation.technologies);
    sessionStorage.setItem('veytronaSolutionBrief', JSON.stringify({
      projectType: labels.type[state.type], industry: labels.industry[state.industry], goal: labels.goal[state.goal], recommendation: recommendation.title
    }));
  };

  builder.querySelectorAll('.solution-options').forEach(group => {
    const buttons = [...group.querySelectorAll('.solution-option')];
    const stateKey = group.dataset.step === 'type' ? 'type' : group.dataset.step;
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        state[stateKey] = button.dataset.value;
        buttons.forEach(item => item.classList.toggle('selected', item === button));
        window.setTimeout(() => {
          if (stateKey === 'goal') {
            renderResult();
            showStep(4);
          } else {
            showStep(stateKey === 'type' ? 2 : 3);
          }
        }, 180);
      });
      button.addEventListener('keydown', event => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const offset = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
        const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + offset + buttons.length) % buttons.length;
        buttons[nextIndex].focus();
      });
    });
  });

  builder.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => {
    const current = Number(button.closest('.solution-step').dataset.step);
    showStep(current - 1);
  }));

  builder.querySelector('[data-restart]').addEventListener('click', () => {
    state.type = state.industry = state.goal = '';
    builder.querySelectorAll('.solution-option.selected').forEach(button => button.classList.remove('selected'));
    sessionStorage.removeItem('veytronaSolutionBrief');
    showStep(1);
  });

  builder.querySelector('[data-discuss]').addEventListener('click', () => {
    if (state.type && state.industry && state.goal) renderResult();
  });
});
