// Site-wide JavaScript for Virelian
// Handles interactions, smooth scrolling, and UX enhancements

document.addEventListener('DOMContentLoaded', function() {
  
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
  
  // Handle verification form (demo only)
  const verificationForm = document.querySelector('.verification-form form');
  
  if (verificationForm) {
    verificationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const noteElement = this.querySelector('.form-note');
      
      if (noteElement) {
        noteElement.style.display = 'block';
        noteElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
  
  // Handle contact form (demo only)
  const contactForm = document.querySelector('.contact-form form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const name = formData.get('name');
      
      alert('Thank you for your inquiry. This is a demonstration form. In production, submissions would be processed through a contact management system.');
      
      this.reset();
    });
  }
  
  // Enhance details/summary accessibility
  document.querySelectorAll('details summary').forEach(summary => {
    summary.addEventListener('click', function() {
      const details = this.parentElement;
      
      // Announce state change to screen readers
      setTimeout(() => {
        const isOpen = details.hasAttribute('open');
        this.setAttribute('aria-expanded', isOpen);
      }, 10);
    });
    
    // Set initial aria-expanded
    const details = summary.parentElement;
    summary.setAttribute('aria-expanded', details.hasAttribute('open'));
  });
  
});
