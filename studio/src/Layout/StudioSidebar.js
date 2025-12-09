import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUserRole, logout, redirectToDashboard } from '../Utils/AuthUtils';

export default function StudioSidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [expandedMenus, setExpandedMenus] = useState({});
    const [userRole, setUserRole] = useState(null);
    const [user, setUser] = useState(null);
    const [isDarkTheme, setIsDarkTheme] = useState(false);

    useEffect(() => {
        // Get user role from localStorage
        const role = getUserRole();
        setUserRole(role);
        
        // Load user data from localStorage
        const loadUser = () => {
            const storedUser = localStorage.getItem('studioUser');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error('Error parsing stored user:', e);
                }
            }
        };
        
        loadUser();
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Check initial theme
        const checkTheme = () => {
            const html = document.documentElement;
            const theme = html.getAttribute('data-bs-theme') || 'light';
            setIsDarkTheme(theme === 'dark');
        };
        
        checkTheme();
        
        // Listen for theme changes
        const handleThemeChange = () => {
            const html = document.documentElement;
            const theme = html.getAttribute('data-bs-theme') || 'light';
            setIsDarkTheme(theme === 'dark');
        };
        
        document.addEventListener('themeChange', handleThemeChange);
        
        // Cleanup
        return () => {
            document.removeEventListener('themeChange', handleThemeChange);
        };
    }, [location]);

    const toggleMenu = (menuId) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId]
        }));
    };

    const handleLogout = () => {
        logout();
        navigate('/studio');
    };

    const displayName = user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Studio User' : 'Studio User';

    const toggleSidebarDirect = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.nativeEvent && typeof e.nativeEvent.stopImmediatePropagation === 'function') {
            e.nativeEvent.stopImmediatePropagation();
        }
        const html = document.documentElement;
        if (window.innerWidth > 1040) {
            html.classList.toggle('sidebar-hover');
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
            html.classList.toggle('sidebar-enable');
            let backdrop = document.querySelector('.offcanvas-backdrop');
            if (html.classList.contains('sidebar-enable')) {
                if (!backdrop) {
                    backdrop = document.createElement('div');
                    backdrop.className = 'offcanvas-backdrop fade show';
                    document.body.appendChild(backdrop);
                    document.body.style.overflow = 'hidden';
                    const backdropClickHandler = () => {
                        html.classList.remove('sidebar-enable');
                        if (backdrop && backdrop.parentNode) {
                            backdrop.removeEventListener('click', backdropClickHandler);
                            backdrop.parentNode.removeChild(backdrop);
                        }
                        document.body.style.overflow = null;
                    };
                    backdrop.addEventListener('click', backdropClickHandler);
                }
            } else {
                if (backdrop && backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
                document.body.style.overflow = null;
            }
        }
    };

    return (
        <div className="main-nav">
            <div className="d-flex justify-content-between main-logo-box">
                <div className="logo-box">
                    <Link 
                        to={redirectToDashboard()} 
                        className="logo-link"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(redirectToDashboard());
                        }}
                    >
                        <img 
                            src={isDarkTheme ? "/assets/images/ipshopy_logo1.png" : "/assets/images/ipshopy_logo.png"} 
                            className="logo-sm" 
                            alt="studio logo sm" 
                        />
                        <img 
                            src={isDarkTheme ? "/assets/images/ipshopy_logo1.png" : "/assets/images/ipshopy_logo.png"} 
                            className="logo-lg" 
                            alt="studio logo" 
                        />
                    </Link>
                </div>
                <button 
                    type="button" 
                    className="btn btn-link d-flex button-toggle-menu" 
                    onClick={toggleSidebarDirect}
                    aria-label="Toggle Sidebar"
                >
                    <i data-lucide="menu" className="button-sm-hover-icon"></i>
                </button>
            </div>

            <div className="h-100" data-simplebar>
                <ul className="navbar-nav" id="navbar-nav">
                    <li className="menu-item">
                        <Link 
                            to={userRole === 'seller' ? "/studio/seller" : userRole === 'influencer' ? "/studio/influencer" : "/studio/dashboard"}
                            className={`menu-link ${location.pathname === '/studio/dashboard' || 
                                (userRole === 'seller' && location.pathname === '/studio/seller') || 
                                (userRole === 'influencer' && location.pathname === '/studio/influencer') ? 'active' : ''}`}
                        >
                            <span className="nav-icon">
                                <i data-lucide="layout-dashboard"></i>
                            </span>
                            <span className="nav-text">Dashboard</span>
                        </Link>
                    </li>

                    {/* Reels Management - Specific to user role */}
                    <li className="menu-item">
                        <Link 
                            to={userRole === 'seller' ? "/studio/seller/upload" : userRole === 'influencer' ? "/studio/influencer/upload" : "/studio/upload"}
                            className={`menu-link ${location.pathname === '/studio/upload' || 
                                (userRole === 'seller' && location.pathname === '/studio/seller/upload') || 
                                (userRole === 'influencer' && location.pathname === '/studio/influencer/upload') ? 'active' : ''}`}
                        >
                            <span className="nav-icon">
                                <i data-lucide="upload"></i>
                            </span>
                            <span className="nav-text">Reel Upload</span>
                        </Link>
                    </li>

                    <li className="menu-item">
                        <Link 
                            to={userRole === 'seller' ? "/studio/seller/reels" : userRole === 'influencer' ? "/studio/influencer/reels" : "/studio/reels"}
                            className={`menu-link ${location.pathname === '/studio/reels' || 
                                (userRole === 'seller' && location.pathname === '/studio/seller/reels') || 
                                (userRole === 'influencer' && location.pathname === '/studio/influencer/reels') ? 'active' : ''}`}
                        >
                            <span className="nav-icon">
                                <i data-lucide="film"></i>
                            </span>
                            <span className="nav-text">Reel Manage</span>
                        </Link>
                    </li>

                    <li className="menu-title">Pages</li>

                    <li className="menu-item">
                        <Link 
                            to={userRole === 'seller' ? "/studio/seller/profile" : userRole === 'influencer' ? "/studio/influencer/profile" : "/studio/profile"}
                            className={`menu-link ${location.pathname === '/studio/profile' || 
                                (userRole === 'seller' && location.pathname === '/studio/seller/profile') || 
                                (userRole === 'influencer' && location.pathname === '/studio/influencer/profile') ? 'active' : ''}`}
                        >
                            <span className="nav-icon">
                                <i data-lucide="circle-user"></i>
                            </span>
                            <span className="nav-text">Profile</span>
                        </Link>
                    </li>

                    <li className="menu-item">
                        <a 
                            className="menu-link" 
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                handleLogout();
                            }}
                        >
                            <span className="nav-icon">
                                <i data-lucide="log-out"></i>
                            </span>
                            <span className="nav-text">Logout</span>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    );
}
