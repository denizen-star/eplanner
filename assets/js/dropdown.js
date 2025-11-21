// Dropdown menu toggle for mobile devices and hamburger menu
function initMenu() {
  const hamburgerMenu = document.getElementById('hamburgerMenu');
  const mobileNavMenu = document.getElementById('mobileNavMenu');
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  
  // Hamburger menu toggle
  if (hamburgerMenu && mobileNavMenu) {
    // Use both click and touchstart for better mobile support
    const toggleMenu = function(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      const isActive = hamburgerMenu.classList.contains('active');
      
      if (isActive) {
        hamburgerMenu.classList.remove('active');
        mobileNavMenu.classList.remove('active');
        if (mobileMenuOverlay) {
          mobileMenuOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
      } else {
        hamburgerMenu.classList.add('active');
        mobileNavMenu.classList.add('active');
        if (mobileMenuOverlay) {
          mobileMenuOverlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
      }
    };
    
    hamburgerMenu.addEventListener('click', toggleMenu);
    hamburgerMenu.addEventListener('touchstart', toggleMenu, { passive: false });

    // Close menu when clicking overlay
    if (mobileMenuOverlay) {
      mobileMenuOverlay.addEventListener('click', function() {
        hamburgerMenu.classList.remove('active');
        mobileNavMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    // Close menu when clicking a link
    const mobileMenuLinks = mobileNavMenu.querySelectorAll('a');
    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', function() {
        hamburgerMenu.classList.remove('active');
        mobileNavMenu.classList.remove('active');
        if (mobileMenuOverlay) {
          mobileMenuOverlay.classList.remove('active');
        }
        document.body.style.overflow = '';
      });
    });
  }
  
  // Dropdown toggle for mobile menu
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.nav-dropdown-toggle');
    
    if (toggle) {
      toggle.addEventListener('click', function(e) {
        // Toggle on mobile (both regular and mobile menu)
        if (window.innerWidth <= 768) {
          e.preventDefault();
          e.stopPropagation();
          
          // Close other dropdowns in the same menu
          const parentMenu = dropdown.closest('.nav-menu, .mobile-nav-menu');
          if (parentMenu) {
            const siblingDropdowns = parentMenu.querySelectorAll('.nav-dropdown');
            siblingDropdowns.forEach(other => {
              if (other !== dropdown) {
                other.classList.remove('active');
              }
            });
          }
          
          // Toggle current dropdown
          dropdown.classList.toggle('active');
        }
      });
    }
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768) {
      if (!e.target.closest('.nav-dropdown')) {
        dropdowns.forEach(dropdown => {
          dropdown.classList.remove('active');
        });
      }
    }
  });

  // Close mobile menu on window resize if it becomes desktop
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      if (hamburgerMenu) hamburgerMenu.classList.remove('active');
      if (mobileNavMenu) mobileNavMenu.classList.remove('active');
      if (mobileMenuOverlay) mobileMenuOverlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

// Initialize on DOM ready or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMenu);
} else {
  initMenu();
}

