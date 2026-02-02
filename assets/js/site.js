// Site-wide JavaScript for Virelian
// Handles interactions, smooth scrolling, and UX enhancements

document.addEventListener('DOMContentLoaded', function() {
  const header = document.querySelector('.site-header');

  const toggleHeaderState = () => {
    if (!header) {
      return;
    }

    const isScrolled = window.scrollY > 10;
    header.classList.toggle('is-solid', isScrolled);
  };

  toggleHeaderState();
  window.addEventListener('scroll', toggleHeaderState);

  // Smooth scroll to anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');

      if (targetId === '#') {
        e.preventDefault();
        return;
      }

      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        history.pushState(null, null, targetId);

        targetElement.setAttribute('tabindex', '-1');
        targetElement.focus();
      }
    });
  });

  // Enhance details/summary accessibility
  document.querySelectorAll('details summary').forEach(summary => {
    summary.addEventListener('click', function() {
      const details = this.parentElement;

      setTimeout(() => {
        const isOpen = details.hasAttribute('open');
        this.setAttribute('aria-expanded', isOpen);
      }, 10);
    });

    const details = summary.parentElement;
    summary.setAttribute('aria-expanded', details.hasAttribute('open'));
  });
});

const renderRegistrySpotlight = (entries) => {
  const container = document.getElementById('registrySpotlight');
  if (!container) {
    return;
  }

  container.innerHTML = '';

  entries.slice(0, 3).forEach((entry) => {
    const card = document.createElement('div');
    card.className = 'spotlight-card';

    const label = document.createElement('div');
    label.className = 'card-label';
    label.textContent = 'Registry Record';

    const title = document.createElement('h3');
    title.className = 'card-title';
    title.textContent = entry.name;

    const credential = document.createElement('p');
    credential.className = 'card-body';
    credential.textContent = entry.credential;

    const id = document.createElement('p');
    id.className = 'muted-caption';
    id.textContent = `Credential ID: ${entry.id}`;

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const button = document.createElement('a');
    button.className = 'btn btn-secondary';
    button.href = `/registry/verify/?id=${encodeURIComponent(entry.id)}`;
    button.textContent = 'Verify Credential';

    actions.appendChild(button);
    card.appendChild(label);
    card.appendChild(title);
    card.appendChild(credential);
    card.appendChild(id);
    card.appendChild(actions);

    container.appendChild(card);
  });
};

const loadRegistrySpotlight = () => {
  const container = document.getElementById('registrySpotlight');
  if (!container) {
    return;
  }

  fetch('/assets/data/registry.json')
    .then((response) => response.json())
    .then((data) => {
      renderRegistrySpotlight(data.registry || []);
    })
    .catch((error) => {
      console.error('Registry spotlight load error:', error);
    });
};

document.addEventListener('DOMContentLoaded', loadRegistrySpotlight);
