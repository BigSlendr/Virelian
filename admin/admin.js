const tokenKey = 'virelian_admin_token';

const tokenGate = document.getElementById('tokenGate');
const adminApp = document.getElementById('adminApp');
const tokenInput = document.getElementById('adminTokenInput');
const saveTokenBtn = document.getElementById('saveTokenBtn');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');
const statusFilter = document.getElementById('statusFilter');
const messageEl = document.getElementById('adminMessage');
const applicationsEl = document.getElementById('applications');

function setMessage(text, type = 'info') {
  messageEl.textContent = text;
  messageEl.dataset.type = type;
}

function showGate() {
  tokenGate.hidden = false;
  adminApp.hidden = true;
  tokenInput.value = '';
}

function showApp() {
  tokenGate.hidden = true;
  adminApp.hidden = false;
}

function getToken() {
  return localStorage.getItem(tokenKey) || '';
}

function clearToken() {
  localStorage.removeItem(tokenKey);
}

async function requestJson(url, options = {}) {
  const token = getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    clearToken();
    showGate();
    setMessage('Session expired. Please re-enter the admin token.', 'error');
    throw new Error('Unauthorized');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const errorMessage = payload.error || `Request failed with status ${response.status}.`;
    throw new Error(errorMessage);
  }

  return payload;
}

function formatCell(value) {
  return value ? String(value) : '—';
}

function renderApplications(applications, status) {
  applicationsEl.innerHTML = '';

  if (!applications.length) {
    const empty = document.createElement('p');
    empty.className = 'muted';
    empty.textContent = 'No applications found for this status.';
    applicationsEl.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'admin-table';

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Created</th>
      <th>Name</th>
      <th>Email</th>
      <th>Affiliation</th>
      <th>Role</th>
      <th>Beats</th>
      <th>Portfolio</th>
      <th>Statement</th>
      <th>Credential ID</th>
      <th>Admin Notes</th>
      <th>Actions</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  applications.forEach((app) => {
    const row = document.createElement('tr');

    const statementDetails = document.createElement('details');
    statementDetails.className = 'statement';
    const summary = document.createElement('summary');
    summary.textContent = 'View';
    const statementText = document.createElement('p');
    statementText.textContent = formatCell(app.statement);
    statementDetails.append(summary, statementText);

    const portfolioLink = app.portfolio_links
      ? `<a href="${app.portfolio_links}" target="_blank" rel="noreferrer">${app.portfolio_links}</a>`
      : '—';

    row.innerHTML = `
      <td>${formatCell(app.created_at)}</td>
      <td>${formatCell(app.full_name)}</td>
      <td>${formatCell(app.email)}</td>
      <td>${formatCell(app.affiliation)}</td>
      <td>${formatCell(app.role)}</td>
      <td>${formatCell(app.beats)}</td>
      <td>${portfolioLink}</td>
      <td></td>
      <td>${formatCell(app.credential_id)}</td>
      <td></td>
      <td></td>
    `;

    row.children[7].appendChild(statementDetails);

    const notesCell = row.children[9];
    const notesArea = document.createElement('textarea');
    notesArea.value = app.admin_notes || '';
    notesArea.rows = 3;
    notesArea.placeholder = 'Add admin notes...';
    notesCell.appendChild(notesArea);

    const actionsCell = row.children[10];
    if (status === 'submitted') {
      const approveBtn = document.createElement('button');
      approveBtn.type = 'button';
      approveBtn.textContent = 'Approve';
      approveBtn.className = 'btn-primary';
      approveBtn.addEventListener('click', async () => {
        try {
          const payload = await requestJson('/api/admin/approve', {
            method: 'POST',
            body: JSON.stringify({
              id: app.id,
              admin_notes: notesArea.value
            })
          });
          row.remove();
          setMessage(`Approved application. Credential ID: ${payload.credential_id}`, 'success');
        } catch (error) {
          setMessage(error.message, 'error');
        }
      });

      const rejectBtn = document.createElement('button');
      rejectBtn.type = 'button';
      rejectBtn.textContent = 'Reject';
      rejectBtn.className = 'btn-secondary';
      rejectBtn.addEventListener('click', async () => {
        try {
          await requestJson('/api/admin/reject', {
            method: 'POST',
            body: JSON.stringify({
              id: app.id,
              admin_notes: notesArea.value
            })
          });
          row.remove();
          setMessage('Rejected application.', 'success');
        } catch (error) {
          setMessage(error.message, 'error');
        }
      });

      actionsCell.append(approveBtn, rejectBtn);
    } else {
      actionsCell.textContent = '—';
    }

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  applicationsEl.appendChild(table);
}

async function loadApplications() {
  const status = statusFilter.value;
  setMessage('Loading applications...', 'info');

  try {
    const payload = await requestJson(`/api/admin/applications?status=${encodeURIComponent(status)}`);
    renderApplications(payload.results || [], status);
    setMessage(`Loaded ${payload.results?.length || 0} applications.`, 'info');
  } catch (error) {
    if (error.message !== 'Unauthorized') {
      setMessage(error.message, 'error');
    }
  }
}

saveTokenBtn.addEventListener('click', () => {
  const token = tokenInput.value.trim();
  if (!token) {
    setMessage('Please enter a token.', 'error');
    return;
  }
  localStorage.setItem(tokenKey, token);
  showApp();
  loadApplications();
});

logoutBtn.addEventListener('click', () => {
  clearToken();
  location.reload();
});

refreshBtn.addEventListener('click', () => {
  loadApplications();
});

statusFilter.addEventListener('change', () => {
  loadApplications();
});

if (getToken()) {
  showApp();
  loadApplications();
} else {
  showGate();
}
