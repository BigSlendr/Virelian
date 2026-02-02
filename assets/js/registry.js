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
    const verifyLink = `/registry/verify/?id=${encodeURIComponent(record.id)}`;

    if (registryTableBody) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${record.name}</td>
        <td>${record.credential}</td>
        <td><span class="badge success">${record.status}</span></td>
        <td>${record.id}</td>
        <td><a href="${verifyLink}">Verify</a></td>
      `;
      registryTableBody.appendChild(row);
    }

    if (registryCards) {
      const card = document.createElement('div');
      card.className = 'registry-card';
      card.innerHTML = `
        <h3>${record.name}</h3>
        <p><strong>Credential:</strong> ${record.credential}</p>
        <p><strong>Status:</strong> ${record.status}</p>
        <p><strong>Credential ID:</strong> ${record.id}</p>
        <a href="${verifyLink}">Verify</a>
      `;
      registryCards.appendChild(card);
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
    return (
      record.name.toLowerCase().includes(query) ||
      record.id.toLowerCase().includes(query) ||
      record.credential.toLowerCase().includes(query)
    );
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
