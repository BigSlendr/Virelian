const signInForm = document.getElementById('signInForm');
const signInEmail = document.getElementById('signInEmail');
const signInStatus = document.getElementById('signInStatus');

const profileForm = document.getElementById('profileForm');
const profileStatus = document.getElementById('profileStatus');
const profilePreview = document.getElementById('profilePreview');
const credentialStatus = document.getElementById('credentialStatus');
const credentialSummaryId = document.getElementById('credentialSummaryId');
const credentialSummaryUpdated = document.getElementById('credentialSummaryUpdated');
const credentialSummaryPublications = document.getElementById('credentialSummaryPublications');

const fields = {
  name: document.getElementById('profileName'),
  credential: document.getElementById('profileCredential'),
  outlet: document.getElementById('profileOutlet'),
  bio: document.getElementById('profileBio'),
  beats: document.getElementById('profileBeats'),
  publications: document.getElementById('profilePublications')
};

const submitReviewButton = document.getElementById('submitReview');

const SIGNIN_KEY = 'virelianProfileSignIn';
const USERS_KEY = 'virelianProfileUsers';
const CREDENTIAL_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let currentEmail = '';
let reviewRequested = false;

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

function parseList(value) {
  if (!value) return [];
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function renderSummary(data) {
  if (!credentialStatus || !credentialSummaryId || !credentialSummaryUpdated || !credentialSummaryPublications) {
    return;
  }

  const publications = parseList(data?.publications);
  const statusLabel = reviewRequested
    ? 'Review requested'
    : data?.name
      ? 'Profile updated'
      : 'Profile draft';

  credentialStatus.textContent = statusLabel;
  credentialStatus.classList.toggle('success', Boolean(data?.name));
  credentialSummaryId.textContent = data?.credential || '—';
  credentialSummaryUpdated.textContent = formatDate();

  credentialSummaryPublications.innerHTML = publications.length
    ? publications.map((publication) => `<li>${publication}</li>`).join('')
    : '<li class="muted">No publications listed.</li>';
}

function renderPreview(data) {
  if (!profilePreview) return;

  if (!data?.name) {
    profilePreview.innerHTML = '<p class="muted">Complete the form to preview your verification snapshot.</p>';
    return;
  }

  const beats = parseList(data.beats);
  const publications = parseList(data.publications);

  profilePreview.innerHTML = `
    <div class="profile-card">
      <h3>${data.name}</h3>
      <div class="profile-meta">
        <span><strong>Credential ID:</strong> ${data.credential || '—'}</span>
        <span><strong>Outlet:</strong> ${data.outlet || 'Independent'}</span>
      </div>
      <p>${data.bio || 'No bio provided.'}</p>
      <div class="section-gap">
        <h4>Reporting beats</h4>
        <div class="tag-list">
          ${beats.length ? beats.map((beat) => `<span class="tag">${beat}</span>`).join('') : '<span class="tag">Not listed</span>'}
        </div>
      </div>
      <div class="section-gap">
        <h4>Recent publications</h4>
        <ul>
          ${publications.length ? publications.map((pub) => `<li>${pub}</li>`).join('') : '<li>No publications listed.</li>'}
        </ul>
      </div>
    </div>
  `;
}

function getProfileData() {
  return {
    name: fields.name?.value.trim() || '',
    credential: fields.credential?.value.trim() || '',
    outlet: fields.outlet?.value.trim() || '',
    bio: fields.bio?.value.trim() || '',
    beats: fields.beats?.value.trim() || '',
    publications: fields.publications?.value.trim() || ''
  };
}

function loadUsers() {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (!stored) return {};
    return JSON.parse(stored) || {};
  } catch {
    return {};
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function ensureUser(users, email) {
  if (!users[email]) {
    users[email] = {
      email,
      credential: generateCredentialID(),
      name: '',
      outlet: '',
      bio: '',
      beats: '',
      publications: ''
    };
  }

  if (!users[email].credential) {
    users[email].credential = generateCredentialID();
  }

  return users[email];
}

function populateForm(data) {
  if (!data) return;
  if (fields.name) fields.name.value = data.name || '';
  if (fields.credential) fields.credential.value = data.credential || '';
  if (fields.outlet) fields.outlet.value = data.outlet || '';
  if (fields.bio) fields.bio.value = data.bio || '';
  if (fields.beats) fields.beats.value = data.beats || '';
  if (fields.publications) fields.publications.value = data.publications || '';
}

if (signInForm && signInEmail && signInStatus) {
  const existingEmail = localStorage.getItem(SIGNIN_KEY);
  if (existingEmail) {
    signInStatus.textContent = `Signed in as ${existingEmail}.`;
  }

  signInForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = signInEmail.value.trim();
    if (!email) return;
    const users = loadUsers();
    currentEmail = email;
    localStorage.setItem(SIGNIN_KEY, email);
    ensureUser(users, email);
    saveUsers(users);
    window.location.href = '/profiles/profile/';
  });
}

if (profileForm) {
  const storedEmail = localStorage.getItem(SIGNIN_KEY);
  if (!storedEmail) {
    window.location.href = '/profiles/';
  } else {
    currentEmail = storedEmail;

    const users = loadUsers();
    const activeUser = ensureUser(users, currentEmail);
    saveUsers(users);
    populateForm(activeUser);
    renderPreview(activeUser);
    renderSummary(activeUser);
  }

  profileForm.addEventListener('input', () => {
    const data = getProfileData();
    renderPreview(data);
    renderSummary(data);
  });

  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const usersUpdate = loadUsers();
    const data = getProfileData();
    const user = ensureUser(usersUpdate, currentEmail);
    const updated = {
      ...user,
      ...data,
      email: currentEmail,
      credential: data.credential || user.credential || generateCredentialID()
    };
    usersUpdate[currentEmail] = updated;
    saveUsers(usersUpdate);
    renderPreview(updated);
    renderSummary(updated);
    if (profileStatus) {
      profileStatus.textContent = 'Profile saved locally in this browser.';
    }
  });
}

if (submitReviewButton && profileStatus) {
  submitReviewButton.addEventListener('click', () => {
    reviewRequested = true;
    renderSummary(getProfileData());
    profileStatus.textContent = 'Review request submitted. Our team will reach out for verification.';
  });
}
