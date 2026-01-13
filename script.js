        // Background Color Switcher based on Scroll
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.3 // Trigger when 30% of the section is visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Apply reveal animation
                    entry.target.classList.add('active');
                    
                    // Apply section-specific background color to body
                    const newBg = entry.target.getAttribute('data-bg');
                    if (newBg) {
                        document.body.style.backgroundColor = newBg;
                    }
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

        // Reset to black if scrolled to very top
        window.addEventListener('scroll', () => {
            if (window.scrollY < 100) {
                document.body.style.backgroundColor = "#000000";
            }
        });