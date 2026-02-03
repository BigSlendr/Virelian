const applyForm = document.getElementById('applyForm');
const applyLink = document.getElementById('applyMailto');
const credentialField = document.getElementById('credentialId');

const CREDENTIAL_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCredentialID() {
  const values = new Uint32Array(7);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(values);
  } else {
    for (let i = 0; i < values.length; i += 1) {
      values[i] = Math.floor(Math.random() * CREDENTIAL_CHARS.length);
    }
  }

  return Array.from(values, (value) => CREDENTIAL_CHARS[value % CREDENTIAL_CHARS.length]).join('');
}

function buildMailto(data) {
  const body = [
    `Credential ID: ${data.get('credentialId') || ''}`,
    `Full Name: ${data.get('fullName') || ''}`,
    `Location: ${data.get('location') || ''}`,
    `Role: ${data.get('role') || ''}`,
    `Portfolio Links: ${data.get('portfolio') || ''}`,
    `Outlet/Clients: ${data.get('outlets') || ''}`,
    `Statement: ${data.get('statement') || ''}`
  ].join('\n');

  const subject = 'Virelian Verification Application';
  return `mailto:registry@virelian.org?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

if (applyForm && applyLink) {
  const updateLink = () => {
    const data = new FormData(applyForm);
    applyLink.href = buildMailto(data);
  };

  if (credentialField) {
    credentialField.value = generateCredentialID();
  }

  updateLink();

  applyForm.addEventListener('input', updateLink);
  applyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    updateLink();
    window.location.href = applyLink.href;
  });
}
