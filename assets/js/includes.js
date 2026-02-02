// HTML Include Loader for Partials
// GitHub Pages compatible - no build step required

const loadPartials = () => {
  const includeElements = document.querySelectorAll('[data-include]');

  includeElements.forEach((element) => {
    const file = element.getAttribute('data-include');

    fetch(file)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load ' + file);
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
};

const initializeNav = () => {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute('href');

    if (
      currentPath === linkPath ||
      currentPath === linkPath + 'index.html' ||
      (linkPath !== '/' && currentPath.startsWith(linkPath))
    ) {
      link.classList.add('active');
    }
  });

  const menuToggle = document.querySelector('.menu-toggle');
  const headerNav = document.querySelector('.header-nav');

  if (menuToggle && headerNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = headerNav.classList.toggle('active');
      menuToggle.classList.toggle('active', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }
};

document.addEventListener('DOMContentLoaded', loadPartials);
