document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#contact-form');
  const notice = document.querySelector('#form-notice');
  if (!form || !notice) return;

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Sending…';
    notice.hidden = true;
    const values = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'We could not send your message right now.');
      notice.className = 'notice success';
      notice.textContent = data.message;
      notice.hidden = false;
      form.reset();
    } catch (error) {
      notice.className = 'notice error';
      notice.textContent = error.message;
      notice.hidden = false;
    } finally {
      button.disabled = false;
      button.innerHTML = 'Send project details <span>↗</span>';
    }
  });
});
