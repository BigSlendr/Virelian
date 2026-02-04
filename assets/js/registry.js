const registryUrl = '/assets/data/registry.json';

const registryTableBody = document.getElementById('registryTableBody');
const registryCards = document.getElementById('registryCards');
const registryUpdated = document.getElementById('registryUpdated');
const registrySearch = document.getElementById('registrySearch');
const registryEmpty = document.getElementById('registryEmpty');

let registryRecords = [];

function renderRegistry(records) {
  if (registryTableBody) {
    registryTableBody.innerHTML = '';
  }

  if (registryCards) {
    registryCards.innerHTML = '';
  }

  if (!records.length) {
    if (registryEmpty) {
      registryEmpty.hidden = false;
    }
    return;
  }

  if (registryEmpty) {
    registryEmpty.hidden = true;
  }

  records.forEach((record) => {
    if (registryTableBody) {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${record.id}</td>`;
      registryTableBody.appendChild(row);
    }
  });
}

function applySearch() {
  const query = (registrySearch?.value || '').toLowerCase().trim();

  if (!query) {
    renderRegistry(registryRecords);
    return;
  }

  const filtered = registryRecords.filter((record) => {
    return record.id.toLowerCase().includes(query);
  });

  renderRegistry(filtered);
}

fetch(registryUrl)
  .then((response) => response.json())
  .then((data) => {
    registryRecords = data.registry || [];
    if (registryUpdated) {
      registryUpdated.textContent = `Updated: ${data.updated}`;
    }
    renderRegistry(registryRecords);
  })
  .catch(() => {
    if (registryUpdated) {
      registryUpdated.textContent = 'Updated: unavailable';
    }
  });

if (registrySearch) {
  registrySearch.addEventListener('input', applySearch);
}
