const applyForm = document.getElementById('applyForm');
const applyStatus = document.getElementById('applyStatus');

function clearStatus() {
  if (!applyStatus) {
    return;
  }
  applyStatus.innerHTML = '';
  applyStatus.hidden = true;
}

function showStatus(title, bodyLines) {
  if (!applyStatus) {
    return;
  }
  applyStatus.innerHTML = '';
  const heading = document.createElement('h3');
  heading.textContent = title;
  applyStatus.appendChild(heading);

  bodyLines.forEach((line) => {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    applyStatus.appendChild(paragraph);
  });

  applyStatus.hidden = false;
}

async function submitApplication(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  delete payload.company;

  const response = await fetch('/api/apply', {
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
    clearStatus();

    try {
      const result = await submitApplication(applyForm);
      showStatus('Application Received', [
        'Your submission has been successfully delivered to the Virelian Registry.',
        `Application ID: ${result.application_id}`,
        'Our review committee will evaluate your credentials and contact you if additional information is required.'
      ]);
      applyForm.reset();
    } catch (error) {
      showStatus('Submission Error', [
        'We were unable to submit your application. Please try again shortly.'
      ]);
    }
  });
}
