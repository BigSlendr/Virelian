const signInForm = document.getElementById('signInForm');
const signInEmail = document.getElementById('signInEmail');
const signInStatus = document.getElementById('signInStatus');

const profileForm = document.getElementById('profileForm');
const profileStatus = document.getElementById('profileStatus');
const profilePreview = document.getElementById('profilePreview');

const fields = {
  name: document.getElementById('profileName'),
  credential: document.getElementById('profileCredential'),
  outlet: document.getElementById('profileOutlet'),
  bio: document.getElementById('profileBio'),
  beats: document.getElementById('profileBeats'),
  publications: document.getElementById('profilePublications')
};

const submitReviewButton = document.getElementById('submitReview');

const STORAGE_KEY = 'virelianProfile';
const SIGNIN_KEY = 'virelianProfileSignIn';

function parseList(value) {
  if (!value) return [];
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function loadStoredProfile() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
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
    localStorage.setItem(SIGNIN_KEY, email);
    signInStatus.textContent = `Signed in as ${email}.`;
  });
}

if (profileForm) {
  const storedProfile = loadStoredProfile();
  if (storedProfile) {
    populateForm(storedProfile);
    renderPreview(storedProfile);
  }

  profileForm.addEventListener('input', () => {
    renderPreview(getProfileData());
  });

  profileForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = getProfileData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    renderPreview(data);
    if (profileStatus) {
      profileStatus.textContent = 'Profile saved locally in this browser.';
    }
  });
}

if (submitReviewButton && profileStatus) {
  submitReviewButton.addEventListener('click', () => {
    profileStatus.textContent = 'Review request submitted. Our team will reach out for verification.';
  });
}
