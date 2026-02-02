const applyForm = document.getElementById('applyForm');
const applyLink = document.getElementById('applyMailto');

function buildMailto(data) {
  const body = [
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

  applyForm.addEventListener('input', updateLink);
  applyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    updateLink();
    window.location.href = applyLink.href;
  });
}
