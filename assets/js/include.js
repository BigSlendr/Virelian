// Simple HTML Include Loader for Partials
// GitHub Pages compatible - no build step required

document.addEventListener('DOMContentLoaded', function() {
  const includeElements = document.querySelectorAll('[data-include]');
  
  includeElements.forEach(function(element) {
    const file = element.getAttribute('data-include');
    
    fetch(file)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load ' + file);
        }
        return response.text();
      })
      .then(data => {
        element.innerHTML = data;
        
        // After header is loaded, initialize nav
        if (file.includes('header.html')) {
          initializeNav();
        }
      })
      .catch(error => {
        console.error('Include error:', error);
      });
  });
});

function initializeNav() {
  // Set active nav state based on current path
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-links a');
  
  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    
    // Check if current page matches this nav item
    if (currentPath === linkPath || 
        currentPath === linkPath + 'index.html' ||
        (linkPath !== '/' && currentPath.startsWith(linkPath))) {
      link.classList.add('active');
    }
  });
  
  // Mobile menu toggle
  const menuToggle = document.querySelector('.menu-toggle');
  const headerNav = document.querySelector('.header-nav');
  
  if (menuToggle && headerNav) {
    menuToggle.addEventListener('click', function() {
      headerNav.classList.toggle('active');
      this.classList.toggle('active');
    });
  }
}
