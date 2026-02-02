const registryUrl = '/assets/data/registry.json';

const verifyForm = document.getElementById('verifyForm');
const verifyInput = document.getElementById('verifyId');
const verificationResult = document.getElementById('verificationResult');

function renderResult(record, query) {
  if (!verificationResult) {
    return;
  }

  if (!record) {
    verificationResult.innerHTML = `
      <div class="panel warning">
        <strong>Record not found.</strong>
        <p>No credential record matched <strong>${query}</strong>. Please confirm the ID and try again.</p>
      </div>
    `;
    return;
  }

  verificationResult.innerHTML = `
    <div class="panel">
      <h2>Official Verification Record</h2>
      <p><strong>Name:</strong> ${record.name}</p>
      <p><strong>Credential:</strong> ${record.credential}</p>
      <p><strong>ID:</strong> ${record.id}</p>
      <p><strong>Status:</strong> ${record.status}</p>
      <p><strong>Issued:</strong> ${record.issued}</p>
      <p><strong>Review:</strong> ${record.review}</p>
      <p><strong>Scope:</strong> ${record.scope}</p>
      <p><strong>Notes:</strong> ${record.notes}</p>
    </div>
  `;
}

function findRecord(id, data) {
  const normalized = id.trim().toLowerCase();
  return (data.registry || []).find((record) => record.id.toLowerCase() === normalized);
}

function loadAndRender(id) {
  if (!id) {
    if (verificationResult) {
      verificationResult.innerHTML = '';
    }
    return;
  }

  fetch(registryUrl)
    .then((response) => response.json())
    .then((data) => {
      const record = findRecord(id, data);
      renderResult(record, id);
    })
    .catch(() => {
      renderResult(null, id);
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

if (verifyForm && verifyInput) {
  verifyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const id = verifyInput.value.trim();
    updateQueryString(id);
    loadAndRender(id);
  });
}

const params = new URLSearchParams(window.location.search);
const idParam = params.get('id');
if (idParam && verifyInput) {
  verifyInput.value = idParam;
}
if (idParam) {
  loadAndRender(idParam);
}
