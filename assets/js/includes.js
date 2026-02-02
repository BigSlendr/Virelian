// HTML include loader for partials

document.addEventListener('DOMContentLoaded', () => {
  const includeElements = document.querySelectorAll('[data-include]');

  includeElements.forEach((element) => {
    const file = element.getAttribute('data-include');

    fetch(file)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${file}`);
        }
        return response.text();
      })
      .then((data) => {
        element.innerHTML = data;

        if (file.includes('header.html')) {
          initializeNav();
        }
      })
      .catch((error) => {
        console.error('Include error:', error);
      });
  });
});

function initializeNav() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.site-nav a');

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute('href');
    if (currentPath === linkPath || (linkPath !== '/' && currentPath.startsWith(linkPath))) {
      link.classList.add('is-active');
    }
  });

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }
}
