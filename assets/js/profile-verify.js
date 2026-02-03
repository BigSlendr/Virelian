const registryUrl = '/assets/data/registry.json';

const profileVerifyForm = document.getElementById('profileVerifyForm');
const profileVerifyInput = document.getElementById('profileVerifyId');
const profileVerifyResult = document.getElementById('profileVerifyResult');

function renderProfileSnapshot(record, query) {
  if (!profileVerifyResult) return;

  if (!record) {
    profileVerifyResult.innerHTML = `
      <div class="panel warning">
        <strong>Record not found.</strong>
        <p>No credential record matched <strong>${query}</strong>. Please confirm the ID and try again.</p>
      </div>
    `;
    return;
  }

  const profile = record.profile || {};
  const beats = profile.beats || [];
  const publications = profile.publications || [];

  profileVerifyResult.innerHTML = `
    <div class="profile-card">
      <h2>${record.name}</h2>
      <div class="profile-meta">
        <span><strong>Credential:</strong> ${record.credential}</span>
        <span><strong>Status:</strong> ${record.status}</span>
        <span><strong>ID:</strong> ${record.id}</span>
      </div>
      <p>${profile.headline || record.scope || 'Verified journalist profile.'}</p>
      <div class="section-gap">
        <h3>Reporting beats</h3>
        <div class="tag-list">
          ${beats.length ? beats.map((beat) => `<span class="tag">${beat}</span>`).join('') : '<span class="tag">Not listed</span>'}
        </div>
      </div>
      <div class="section-gap">
        <h3>Recent publications</h3>
        <ul>
          ${publications.length ? publications.map((item) => `<li>${item}</li>`).join('') : '<li>No publications listed.</li>'}
        </ul>
      </div>
      <p class="muted">Last updated: ${profile.updated || record.review}</p>
    </div>
  `;
}

function findRecord(id, data) {
  const normalized = id.trim().toLowerCase();
  return (data.registry || []).find((record) => record.id.toLowerCase() === normalized);
}

function loadAndRender(id) {
  if (!id) {
    if (profileVerifyResult) profileVerifyResult.innerHTML = '';
    return;
  }

  fetch(registryUrl)
    .then((response) => response.json())
    .then((data) => {
      const record = findRecord(id, data);
      renderProfileSnapshot(record, id);
    })
    .catch(() => {
      renderProfileSnapshot(null, id);
    });
}

function updateQueryString(id) {
  const url = new URL(window.location.href);
  if (id) {
    url.searchParams.set('id', id);
  } else {
    url.searchParams.delete('id');
  }
  window.history.replaceState({}, '', url);
}

if (profileVerifyForm && profileVerifyInput) {
  profileVerifyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = profileVerifyInput.value.trim();
    updateQueryString(id);
    loadAndRender(id);
  });
}

const params = new URLSearchParams(window.location.search);
const idParam = params.get('id');
if (idParam && profileVerifyInput) {
  profileVerifyInput.value = idParam;
}
if (idParam) {
  loadAndRender(idParam);
}
