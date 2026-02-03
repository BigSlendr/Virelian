// Site-wide JavaScript for Virelian
// Handles interactions, smooth scrolling, and UX enhancements

document.addEventListener('DOMContentLoaded', function() {
  // Highlight current navigation item
  const currentPath = window.location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('.site-nav a').forEach(link => {
    const linkPath = new URL(link.href, window.location.origin).pathname.replace(/index\.html$/, '');
    const normalizedLink = linkPath.endsWith('/') ? linkPath : `${linkPath}/`;
    const normalizedCurrent = currentPath.endsWith('/') ? currentPath : `${currentPath}/`;

    if (normalizedLink === normalizedCurrent) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });
  
  // Smooth scroll to anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      
      // Skip if it's just "#"
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
        
        // Update URL without jumping
        history.pushState(null, null, targetId);
        
        // Focus target for accessibility
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
