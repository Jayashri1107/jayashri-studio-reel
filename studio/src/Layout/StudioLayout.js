import { Outlet } from "react-router-dom";
import StudioHeader from "./StudioHeader";
import StudioFooter from "./StudioFooter";
import StudioSidebar from "./StudioSidebar";
import { Suspense, useEffect, useRef } from "react";
import ProtectedRoute from "../Routes/ProtectedRoute";

export default function StudioLayout() {
    const cleanupRef = useRef([]);

    useEffect(() => {
        // Initialize Lucide icons
        const initIcons = () => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        };

        initIcons();

        // Apply persisted layout preferences (theme and sidebar size)
        try {
            const html = document.documentElement;
            const config = JSON.parse(sessionStorage.getItem('__THEME_CONFIG__') || '{}');
            if (config.theme) {
                html.setAttribute('data-bs-theme', config.theme);
                if (config.theme === 'dark') {
                    html.classList.remove('topbar-light', 'sidebar-light');
                    html.classList.add('topbar-dark', 'sidebar-dark');
                } else {
                    html.classList.remove('topbar-dark', 'sidebar-dark');
                    html.classList.add('topbar-light', 'sidebar-light');
                }
            }
            const size = config.menu?.size || 'default';
            if (size === 'small-hover') {
                html.classList.add('sidebar-hover');
            } else {
                html.classList.remove('sidebar-hover');
            }
        } catch (_) {}

        // Sidebar toggle functionality - using React-safe approach
        const handleSidebarToggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const html = document.documentElement;
            
            if (window.innerWidth > 1040) {
                // Desktop: toggle sidebar hover
                html.classList.toggle("sidebar-hover");
                try {
                    const cfg = JSON.parse(sessionStorage.getItem('__THEME_CONFIG__') || '{}');
                    const hasHover = html.classList.contains('sidebar-hover');
                    cfg.menu = {
                        ...(cfg.menu || {}),
                        size: hasHover ? 'small-hover' : 'default'
                    };
                    sessionStorage.setItem('__THEME_CONFIG__', JSON.stringify(cfg));
                } catch (_) {}
            } else {
                // Mobile: toggle sidebar enable with backdrop
                html.classList.toggle('sidebar-enable');
                
                // Show/hide backdrop
                let backdrop = document.querySelector('.offcanvas-backdrop');
                if (html.classList.contains('sidebar-enable')) {
                    if (!backdrop) {
                        backdrop = document.createElement('div');
                        backdrop.className = 'offcanvas-backdrop fade show';
                        document.body.appendChild(backdrop);
                        document.body.style.overflow = "hidden";
                        
                        const backdropClickHandler = () => {
                            html.classList.remove('sidebar-enable');
                            if (backdrop && backdrop.parentNode) {
                                backdrop.removeEventListener('click', backdropClickHandler);
                                backdrop.parentNode.removeChild(backdrop);
                            }
                            document.body.style.overflow = null;
                        };
                        
                        backdrop.addEventListener('click', backdropClickHandler);
                        cleanupRef.current.push(() => {
                            if (backdrop) {
                                backdrop.removeEventListener('click', backdropClickHandler);
                            }
                        });
                    }
                } else {
                    if (backdrop && backdrop.parentNode) {
                        backdrop.parentNode.removeChild(backdrop);
                    }
                    document.body.style.overflow = null;
                }
            }
        };

        // Dark mode toggle functionality - using React-safe approach
        const handleThemeToggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-bs-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            html.setAttribute('data-bs-theme', newTheme);
            
            // Also update classes for consistent styling
            if (newTheme === 'dark') {
                html.classList.remove('topbar-light', 'sidebar-light');
                html.classList.add('topbar-dark', 'sidebar-dark');
            } else {
                html.classList.remove('topbar-dark', 'sidebar-dark');
                html.classList.add('topbar-light', 'sidebar-light');
            }
            
            // Save to sessionStorage
            try {
                const config = JSON.parse(sessionStorage.getItem('__THEME_CONFIG__') || '{}');
                config.theme = newTheme;
                // Also save the updated classes
                config.topbar = { color: newTheme === 'dark' ? 'topbar-dark' : 'topbar-light' };
                config.menu = { color: newTheme === 'dark' ? 'sidebar-dark' : 'sidebar-light', size: config.menu?.size || 'default' };
                sessionStorage.setItem('__THEME_CONFIG__', JSON.stringify(config));
            } catch (e) {
                sessionStorage.setItem('__THEME_CONFIG__', JSON.stringify({ 
                    theme: newTheme,
                    topbar: { color: newTheme === 'dark' ? 'topbar-dark' : 'topbar-light' },
                    menu: { color: newTheme === 'dark' ? 'sidebar-dark' : 'sidebar-light', size: 'default' }
                }));
            }
            
            // Dispatch custom event for theme change
            const themeChangeEvent = new CustomEvent('themeChange', { detail: { theme: newTheme } });
            document.dispatchEvent(themeChangeEvent);
            
            // Re-initialize icons after theme change
            setTimeout(initIcons, 100);
            
            // Force a re-render of all components by triggering a resize event
            // This helps ensure all elements update their styling
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 150);
        };

        // Attach event listeners using event delegation to avoid DOM manipulation
        const handleClick = (e) => {
            if (e.target.closest('.button-toggle-menu')) {
                handleSidebarToggle(e);
            } else if (e.target.closest('#light-dark-mode')) {
                handleThemeToggle(e);
            }
        };

        // Use event delegation on document to avoid React DOM conflicts
        document.addEventListener('click', handleClick);
        cleanupRef.current.push(() => {
            document.removeEventListener('click', handleClick);
        });

        // Re-initialize icons when route changes (using a more selective MutationObserver)
        // Only observe the page-content area to avoid infinite loops
        const pageContent = document.querySelector('.page-content');
        if (pageContent) {
            const observer = new MutationObserver((mutations) => {
                // Only re-initialize if actual content changes, not on every mutation
                let shouldUpdate = false;
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                        // Check if it's a meaningful change (not just React re-renders)
                        const hasNewElements = Array.from(mutation.addedNodes).some(
                            node => node.nodeType === 1 && (node.tagName === 'DIV' || node.tagName === 'SECTION' || node.tagName === 'MAIN')
                        );
                        if (hasNewElements) {
                            shouldUpdate = true;
                        }
                    }
                });
                
                if (shouldUpdate) {
                    // Debounce icon initialization
                    clearTimeout(observer.timeout);
                    observer.timeout = setTimeout(() => {
                        initIcons();
                    }, 100);
                }
            });

            observer.observe(pageContent, {
                childList: true,
                subtree: false // Only watch direct children, not entire subtree
            });

            cleanupRef.current.push(() => {
                if (observer.timeout) {
                    clearTimeout(observer.timeout);
                }
                observer.disconnect();
            });
        }

        // Cleanup function
        return () => {
            cleanupRef.current.forEach(cleanup => {
                if (typeof cleanup === 'function') {
                    cleanup();
                }
            });
            cleanupRef.current = [];
        };
    }, []);

    return (
        <ProtectedRoute>
            <div className="wrapper">
                <StudioSidebar />
                <StudioHeader />
                <div className="page-container">
                    <div className="page-content">
                        <Suspense fallback={<div>Loading...</div>}>
                            <Outlet />
                        </Suspense>
                    </div>
                    <StudioFooter />
                </div>
            </div>
        </ProtectedRoute>
    )
}
