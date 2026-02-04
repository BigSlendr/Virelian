const applyForm = document.getElementById('applyForm');
const applyStatus = document.getElementById('applyStatus');

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

async function submitApplication(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  payload.credentialId = generateCredentialID();

  const response = await fetch('/api/sendApplicationEmail', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const { error } = await response.json().catch(() => ({ error: 'Unable to submit the application.' }));
    throw new Error(error || 'Unable to submit the application.');
  }

  return response.json();
}

if (applyForm) {
  applyForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (applyStatus) {
      applyStatus.textContent = 'Submitting your application...';
    }

    try {
      await submitApplication(applyForm);
      if (applyStatus) {
        applyStatus.textContent = 'Application submitted. A confirmation email has been sent.';
      }
      applyForm.reset();
    } catch (error) {
      if (applyStatus) {
        applyStatus.textContent = error.message || 'Unable to submit the application.';
      }
    }
  });
}
