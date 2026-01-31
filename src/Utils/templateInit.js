/**
 * Initialize template JavaScript functionality
 * This ensures the template's sidebar toggle and dark mode work properly in React
 */
export const initTemplateJS = () => {
    // Wait for DOM to be ready
    if (typeof window === 'undefined') return;

    // Re-initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // The template's app.js should handle sidebar toggle and dark mode
    // But we need to ensure event listeners are attached after React renders
    setTimeout(() => {
        // Re-attach sidebar toggle event
        const menuToggleBtn = document.querySelector('.button-toggle-menu');
        if (menuToggleBtn) {
            // Remove existing listeners and re-attach
            const newBtn = menuToggleBtn.cloneNode(true);
            menuToggleBtn.parentNode.replaceChild(newBtn, menuToggleBtn);
            
            // The template's ThemeLayout class should handle this
            // But we ensure it's initialized
            if (window.VelzonLayout || window.ThemeLayout) {
                // Template JS is loaded, it will handle the click
            } else {
                // Fallback: manual toggle
                newBtn.addEventListener('click', function() {
                    const html = document.documentElement;
                    if (window.innerWidth > 1040) {
                        html.classList.toggle("sidebar-hover");
                    } else {
                        html.classList.toggle('sidebar-enable');
                        // Show backdrop
                        const backdrop = document.createElement('div');
                        backdrop.classList = 'offcanvas-backdrop fade show';
                        document.body.appendChild(backdrop);
                        document.body.style.overflow = "hidden";
                        backdrop.addEventListener('click', function() {
                            html.classList.remove('sidebar-enable');
                            document.body.removeChild(backdrop);
                            document.body.style.overflow = null;
                        });
                    }
                });
            }
        }

        // Re-attach dark mode toggle event
        const themeToggleBtn = document.getElementById('light-dark-mode');
        if (themeToggleBtn) {
            const newThemeBtn = themeToggleBtn.cloneNode(true);
            themeToggleBtn.parentNode.replaceChild(newThemeBtn, themeToggleBtn);
            
            if (window.VelzonLayout || window.ThemeLayout) {
                // Template JS is loaded, it will handle the click
            } else {
                // Fallback: manual toggle
                newThemeBtn.addEventListener('click', function() {
                    const html = document.documentElement;
                    const currentTheme = html.getAttribute('data-bs-theme') || 'light';
                    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                    html.setAttribute('data-bs-theme', newTheme);
                    // Save to localStorage
                    try {
                        const config = JSON.parse(localStorage.getItem('__THEME_CONFIG__') || '{}');
                        config.theme = newTheme;
                        localStorage.setItem('__THEME_CONFIG__', JSON.stringify(config));
                    } catch (e) {
                        localStorage.setItem('__THEME_CONFIG__', JSON.stringify({ theme: newTheme }));
                    }
                });
            }
        }
    }, 100);
};

