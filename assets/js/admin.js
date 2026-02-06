const TOKEN_KEY = 'virelian_admin_token';

const tokenGate = document.getElementById('adminTokenGate');
const adminApp = document.getElementById('adminApp');
const tokenInput = document.getElementById('adminTokenInput');
const saveTokenBtn = document.getElementById('saveTokenBtn');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusFilter = document.getElementById('statusFilter');
const message = document.getElementById('adminMessage');
const applicationsBody = document.getElementById('applicationsBody');

let token = localStorage.getItem(TOKEN_KEY) || '';

function setMessage(text) {
  message.textContent = text || '';
}

function showTokenGate() {
  tokenGate.hidden = false;
  adminApp.hidden = true;
  setMessage('');
  applicationsBody.innerHTML = '';
}

function showAdminApp() {
  tokenGate.hidden = true;
  adminApp.hidden = false;
}

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

async function fetchApplications() {
  if (!token) {
    showTokenGate();
    return;
  }

  const status = statusFilter.value;
  setMessage('Loading applications...');

  try {
    const response = await fetch(`/api/admin/applications?status=${encodeURIComponent(status)}`, {
      headers: getAuthHeaders()
    });

    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      token = '';
      showTokenGate();
      setMessage('Token invalid or expired. Please enter it again.');
      return;
    }

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || 'Failed to load applications');
    }

    renderRows(payload.results || [], status);
    setMessage(`Loaded ${payload.results.length} ${status} application(s).`);
  } catch (error) {
    setMessage(error.message || 'Unable to load applications.');
  }
}

function renderRows(rows, status) {
  if (!rows.length) {
    applicationsBody.innerHTML = '<tr><td colspan="8">No applications found for this status.</td></tr>';
    return;
  }

  applicationsBody.innerHTML = rows
    .map((row) => {
      const statementId = `statement-${row.id}`;
      const notesId = `notes-${row.id}`;
      const credential = row.credential_id ? `<div class="admin-credential"><strong>ID:</strong> ${escapeHtml(row.credential_id)}</div>` : '';
      const actionButtons =
        status === 'submitted'
          ? `
            <button class="btn btn-primary" data-action="approve" data-id="${escapeHtml(row.id)}" data-notes="#${notesId}" type="button">Approve</button>
            <button class="btn" data-action="reject" data-id="${escapeHtml(row.id)}" data-notes="#${notesId}" type="button">Reject</button>
          `
          : '<span class="muted">No actions</span>';

      return `
      <tr id="row-${escapeHtml(row.id)}">
        <td>${formatDate(row.created_at)}</td>
        <td>${escapeHtml(row.full_name)}</td>
        <td>${escapeHtml(row.email)}</td>
        <td>${escapeHtml(row.affiliation)}</td>
        <td>${escapeHtml(row.role)}</td>
        <td>${escapeHtml(row.beats)}</td>
        <td class="admin-details">
          <details id="${statementId}">
            <summary>View statement</summary>
            <p>${escapeHtml(row.statement)}</p>
            <p><strong>Portfolio:</strong> ${escapeHtml(row.portfolio_links || '—')}</p>
            ${credential}
          </details>
          <input id="${notesId}" class="input admin-notes" type="text" placeholder="Admin notes (optional)" value="${escapeHtml(row.admin_notes || '')}">
        </td>
        <td>
          <div class="admin-actions">
            ${actionButtons}
          </div>
        </td>
      </tr>`;
    })
    .join('');
}

async function submitDecision(action, id, notesSelector) {
  const notesInput = document.querySelector(notesSelector);
  const admin_notes = notesInput ? notesInput.value : '';

  setMessage(`${action === 'approve' ? 'Approving' : 'Rejecting'} application...`);

  const endpoint = action === 'approve' ? '/api/admin/approve' : '/api/admin/reject';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, admin_notes })
  });

  if (response.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    token = '';
    showTokenGate();
    setMessage('Token invalid or expired. Please enter it again.');
    return;
  }

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || 'Action failed');
  }

  const row = document.getElementById(`row-${id}`);
  if (row) {
    row.remove();
  }

  if (action === 'approve') {
    setMessage(`Approved ${id} — credential issued: ${payload.credential_id}`);
  } else {
    setMessage(`Rejected ${id}.`);
  }
}

saveTokenBtn.addEventListener('click', () => {
  const entered = tokenInput.value.trim();
  if (!entered) {
    setMessage('Please enter a token.');
    return;
  }

  token = entered;
  localStorage.setItem(TOKEN_KEY, token);
  tokenInput.value = '';
  showAdminApp();
  fetchApplications();
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY);
  token = '';
  showTokenGate();
});

refreshBtn.addEventListener('click', fetchApplications);
statusFilter.addEventListener('change', fetchApplications);

applicationsBody.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.getAttribute('data-action');
  const id = button.getAttribute('data-id');
  const notesSelector = button.getAttribute('data-notes');

  if (!action || !id || !notesSelector) return;

  try {
    await submitDecision(action, id, notesSelector);
  } catch (error) {
    setMessage(error.message || 'Unable to complete action.');
  }
});

if (token) {
  showAdminApp();
  fetchApplications();
} else {
  showTokenGate();
}
