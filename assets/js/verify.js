const normalizeId = (value) => (value || '').toString().trim().toLowerCase();

const renderVerificationResult = (entry) => {
  const container = document.getElementById('verificationResult');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  if (!entry) {
    const warning = document.createElement('div');
    warning.className = 'callout warning';
    warning.innerHTML = '<strong>Credential Not Found.</strong> The provided ID does not match any active registry entry.';
    container.appendChild(warning);
    return;
  }

  const card = document.createElement('div');
  card.className = 'card';

  const title = document.createElement('h3');
  title.className = 'card-title';
  title.textContent = 'Official Verification Record';

  const body = document.createElement('div');
  body.className = 'card-body';

  const fields = [
    ['Name', entry.name],
    ['Credential', entry.credential],
    ['Credential ID', entry.id],
    ['Status', entry.status],
    ['Issued', entry.issued],
    ['Review', entry.review],
    ['Scope', entry.scope],
    ['Notes', entry.notes]
  ];

  fields.forEach(([label, value]) => {
    const row = document.createElement('p');
    row.innerHTML = `<strong>${label}:</strong> ${value}`;
    body.appendChild(row);
  });

  card.appendChild(title);
  card.appendChild(body);
  container.appendChild(card);
};

const findEntry = (data, id) => {
  return (data.registry || []).find((entry) => normalizeId(entry.id) === normalizeId(id));
};

const handleVerify = () => {
  const input = document.getElementById('verificationId');
  if (!input) {
    return;
  }

  const value = input.value.trim();
  if (!value) {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set('id', value);
  window.location.href = url.toString();
};

const loadVerification = () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const input = document.getElementById('verificationId');

  if (input && id) {
    input.value = id;
  }

  if (!id) {
    return;
  }

  fetch('/assets/data/registry.json')
    .then((response) => response.json())
    .then((data) => {
      const entry = findEntry(data, id);
      renderVerificationResult(entry);
    })
    .catch((error) => {
      console.error('Verification load error:', error);
      renderVerificationResult(null);
    });
};

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('verificationButton');
  if (button) {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      handleVerify();
    });
  }

  const input = document.getElementById('verificationId');
  if (input) {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleVerify();
      }
    });
  }

  loadVerification();
});
