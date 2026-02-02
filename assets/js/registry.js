const registryState = {
  entries: [],
  updated: ''
};

const normalize = (value) => (value || '').toString().trim().toLowerCase();

const createRegistryCard = (entry) => {
  const card = document.createElement('a');
  card.className = 'card registry-card';
  card.href = `/registry/verify/?id=${encodeURIComponent(entry.id)}`;
  card.setAttribute('aria-label', `Verify credential for ${entry.name}`);

  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = entry.name;

  const body = document.createElement('div');
  body.className = 'card-body';

  const credential = document.createElement('div');
  credential.textContent = entry.credential;

  const status = document.createElement('span');
  status.className = 'status-pill';
  status.textContent = entry.status;

  const idLine = document.createElement('div');
  idLine.textContent = `Credential ID: ${entry.id}`;

  body.appendChild(credential);
  body.appendChild(status);
  body.appendChild(idLine);

  card.appendChild(title);
  card.appendChild(body);

  return card;
};

const renderRegistry = (entries) => {
  const list = document.getElementById('registryList');

  if (!list) {
    return;
  }

  list.innerHTML = '';

  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'callout warning';
    empty.textContent = 'No registry entries match your search.';
    list.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    list.appendChild(createRegistryCard(entry));
  });
};

const handleSearch = () => {
  const input = document.getElementById('registrySearch');
  const query = normalize(input ? input.value : '');

  const filtered = registryState.entries.filter((entry) => {
    return (
      normalize(entry.name).includes(query) ||
      normalize(entry.id).includes(query) ||
      normalize(entry.credential).includes(query)
    );
  });

  renderRegistry(filtered);
};

const loadRegistry = () => {
  fetch('/assets/data/registry.json')
    .then((response) => response.json())
    .then((data) => {
      registryState.entries = data.registry || [];
      registryState.updated = data.updated || '';

      const updatedElement = document.getElementById('registryUpdated');
      if (updatedElement && registryState.updated) {
        updatedElement.textContent = `Updated: ${registryState.updated}`;
      }

      renderRegistry(registryState.entries);

      const input = document.getElementById('registrySearch');
      if (input) {
        input.addEventListener('input', handleSearch);
      }
    })
    .catch((error) => {
      const list = document.getElementById('registryList');
      if (list) {
        list.innerHTML = '';
        const message = document.createElement('div');
        message.className = 'callout warning';
        message.textContent = 'Registry data could not be loaded. Please try again later.';
        list.appendChild(message);
      }
      console.error('Registry load error:', error);
    });
};

document.addEventListener('DOMContentLoaded', loadRegistry);
