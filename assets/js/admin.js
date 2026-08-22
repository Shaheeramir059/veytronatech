document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.adminPage;
  const request = async (path, options = {}) => {
    const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed.');
    return data;
  };

  const logout = document.querySelector('[data-logout]');
  logout?.addEventListener('click', async () => { await request('/api/admin/logout', { method: 'POST' }); location.href = '/admin/login'; });

  if (page === 'login') {
    const form = document.querySelector('#admin-login-form');
    const notice = document.querySelector('#admin-notice');
    form?.addEventListener('submit', async event => {
      event.preventDefault();
      notice.hidden = true;
      try {
        await request('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: new FormData(form).get('password') }) });
        location.href = '/admin/dashboard';
      } catch (error) { notice.textContent = error.message; notice.hidden = false; }
    });
    return;
  }

  if (!['dashboard', 'messages'].includes(page)) return;
  const renderMessages = messages => {
    const target = document.querySelector('[data-message-list]');
    if (!target) return;
    target.replaceChildren();
    messages.forEach(message => {
      const row = document.createElement('tr');
      row.innerHTML = `<td><strong>${escapeHtml(message.name)}</strong><br><span class="muted">${escapeHtml(message.email)}</span></td><td>${escapeHtml(message.project_type)}</td><td>${escapeHtml(message.message)}</td><td><button data-action="${message.status === 'read' ? 'unread' : 'read'}" data-id="${escapeHtml(message.id)}">${message.status === 'read' ? 'Mark unread' : 'Mark read'}</button> <button data-action="delete" data-id="${escapeHtml(message.id)}">Delete</button></td>`;
      target.append(row);
    });
    target.querySelectorAll('button[data-action]').forEach(button => button.addEventListener('click', async () => {
      if (button.dataset.action === 'delete' && !confirm('Delete this message permanently?')) return;
      await request('/api/admin/message-status', { method: 'POST', body: JSON.stringify({ id: button.dataset.id, action: button.dataset.action }) });
      loadMessages();
    }));
  };
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
  const loadMessages = async () => {
    try {
      const data = await request('/api/admin/messages');
      document.querySelector('[data-total]')?.replaceChildren(document.createTextNode(String(data.total)));
      document.querySelector('[data-unread]')?.replaceChildren(document.createTextNode(String(data.unread)));
      renderMessages(page === 'dashboard' ? data.messages.slice(0, 6) : data.messages);
    } catch (error) {
      if (error.message === 'Authentication required.') location.href = '/admin/login';
    }
  };
  loadMessages();
});
