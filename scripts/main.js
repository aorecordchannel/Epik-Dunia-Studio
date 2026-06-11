document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle (Simplified)
    const hamburger = document.querySelector('.hamburger');
    
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        // Add functionality to show/hide mobile menu here
        // For a full implementation, we'd toggle a .active class on the nav-menu and nav-actions
        alert('Menu Toggle - Bisa dihubungkan dengan menu dropdown mobile.');
    });

    // Scroll Reveal Animation
    const revealElements = document.querySelectorAll('.card, .section-title, .section-desc');
    
    // Initial add class reveal
    revealElements.forEach(el => {
        el.classList.add('reveal');
    });

    function reveal() {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                el.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', reveal);
    
    // Trigger once on load
    reveal();

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for fixed navbar
                    behavior: 'smooth'
                });
            }
        });
    });

    // Language Selector Toggle (Demo)
    const langBtn = document.querySelector('.lang-btn');
    langBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const currentText = langBtn.textContent.trim();
        if (currentText.includes('ID')) {
            langBtn.innerHTML = 'EN <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        } else {
            langBtn.innerHTML = 'ID <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
        }
    });
});
