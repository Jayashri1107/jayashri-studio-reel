import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import Sidebar from "./Sidebar"
import { Suspense, useEffect, useRef } from "react"
import ProtectedRoute from "../Routes/ProtectedRoute"

export default function AppLayout() {
    const cleanupRef = useRef([]);

    useEffect(() => {
        // Initialize Lucide icons
        const initIcons = () => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        };

        initIcons();

        // Sidebar toggle functionality - using React-safe approach
        const handleSidebarToggle = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const html = document.documentElement;
            
            if (window.innerWidth > 1040) {
                // Desktop: toggle sidebar hover
                html.classList.toggle("sidebar-hover");
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
            
            // Save to sessionStorage
            try {
                const config = JSON.parse(sessionStorage.getItem('__THEME_CONFIG__') || '{}');
                config.theme = newTheme;
                sessionStorage.setItem('__THEME_CONFIG__', JSON.stringify(config));
            } catch (e) {
                sessionStorage.setItem('__THEME_CONFIG__', JSON.stringify({ theme: newTheme }));
            }
            
            // Re-initialize icons after theme change
            setTimeout(initIcons, 100);
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
                <Sidebar />
                <Header />
                <div className="page-container">
                    <div className="page-content">
                        <Suspense fallback={<div>Loading...</div>}>
                            <Outlet />
                        </Suspense>
                    </div>
                    <Footer />
                </div>
            </div>
        </ProtectedRoute>
    )
}
