import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function StudioHeader() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Load user from localStorage
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

        // Check initial theme
        const checkTheme = () => {
            const html = document.documentElement;
            const theme = html.getAttribute('data-bs-theme') || 'light';
            setIsDarkTheme(theme === 'dark');
        };

        loadUser();
        checkTheme();

        // Refresh icons when user data loads or changes
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Listen for theme changes to update icons
        const handleThemeChange = () => {
            const html = document.documentElement;
            const theme = html.getAttribute('data-bs-theme') || 'light';
            setIsDarkTheme(theme === 'dark');
            
            if (window.lucide) {
                window.lucide.createIcons();
            }
            
            // Force update of theme icons
            setTimeout(() => {
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            }, 50);
        };
        
        // Add event listener for theme changes
        document.addEventListener('themeChange', handleThemeChange);
        
        // Listen for storage changes (like login/logout)
        const handleStorageChange = (e) => {
            if (e.key === 'studioUser') {
                if (e.newValue) {
                    try {
                        setUser(JSON.parse(e.newValue));
                    } catch (err) {
                        console.error('Error parsing studioUser:', err);
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            }
        };
        
        // Listen for custom user update events
        const handleUserUpdate = () => {
            const storedUser = localStorage.getItem('studioUser');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (err) {
                    console.error('Error parsing studioUser:', err);
                    setUser(null);
                }
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('userUpdated', handleUserUpdate);
        
        // Cleanup
        return () => {
            document.removeEventListener('themeChange', handleThemeChange);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userUpdated', handleUserUpdate);
        };
    }, []);

    useEffect(() => {
        // Refresh icons when user changes
        if (window.lucide && user) {
            window.lucide.createIcons();
        }
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('studioToken');
        localStorage.removeItem('studioUser');
        setUser(null);
        navigate('/studio');
    };

    // Get user role from localStorage
    const getUserRole = () => {
        const storedUser = localStorage.getItem('studioUser');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                return user.role;
            } catch (e) {
                console.error('Error parsing stored user:', e);
                return null;
            }
        }
        return null;
    };

    const displayName = user ? `${user.firstname || ''} ${user.lastname || ''}`.trim() || 'Studio User' : 'Studio User';
    // Use user's profile image if available, otherwise fallback to default avatar
    const userImage = user && user.image ? user.image : "/assets/images/users/avatar-1.jpg";
    const userRole = getUserRole();

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const term = (searchTerm || '').trim();
        if (!term) return;
        const role = userRole || 'seller';
        if (role === 'influencer') {
            navigate(`/studio/influencer/reels?product=${encodeURIComponent(term)}`);
        } else {
            navigate(`/studio/seller/reels?product=${encodeURIComponent(term)}`);
        }
    };

    return (
        <header className="topbar d-flex">
            <div className="container-fluid">
                <div className="navbar-header">
                    <div className="d-flex align-items-center gap-2">
                        {/* Logo */}
                        <div className="logo-box me-3">
                            <Link 
                                to="/studio" 
                                className="logo-link"
                            >
                                <img 
                                    src={isDarkTheme ? "/assets/images/ipshopy_logo1.png" : "/assets/images/ipshopy_logo.png"} 
                                    className="logo-sm" 
                                    alt="Ipshopy Studio" 
                                    style={{ height: '30px' }}
                                />
                            </Link>
                        </div>
                        
                        <form className="app-search d-none d-md-block me-auto" onSubmit={handleSearchSubmit}>
                            <div className="position-relative">
                                <input type="search" className="form-control" placeholder="Start typing..." autoComplete="off" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                <i data-lucide="search" className="search-widget-icon"></i>
                            </div>
                        </form>
                    </div>

                    <div className="d-flex align-items-center gap-2 ms-auto">
                        {/* Theme Color (Light/Dark) */}
                        <div className="topbar-item">
                            <button type="button" className="topbar-button fs-24" id="light-dark-mode">
                                <i data-lucide="moon" className="light-mode"></i>
                                <i data-lucide="sun" className="dark-mode"></i>
                            </button>
                        </div>

                        {/* Notification */}
                        <div className="dropdown topbar-item">
                            <button 
                                type="button" 
                                className="topbar-button" 
                                id="page-header-notifications-dropdown" 
                                data-bs-toggle="dropdown" 
                                aria-haspopup="true" 
                                aria-expanded="false"
                            >
                                <i data-lucide="bell" className="fs-20"></i>
                                <span className="topbar-badge text-bg-danger rounded-pill">3<span className="visually-hidden">unread messages</span></span>
                            </button>
                            <div className="dropdown-menu pt-0 dropdown-lg dropdown-menu-end" aria-labelledby="page-header-notifications-dropdown">
                                <div className="p-3 border-top-0 border-start-0 border-end-0 border-dashed border">
                                    <div className="row align-items-center">
                                        <div className="col">
                                            <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
                                        </div>
                                    </div>
                                </div>
                                <div data-simplebar style={{ maxHeight: '280px' }}>
                                    <a href="#!" className="dropdown-item py-3 border-bottom text-wrap">
                                        <p className="mb-0"><span className="fw-medium">New Reel</span> uploaded for approval</p>
                                    </a>
                                    <a href="#!" className="dropdown-item py-3 border-bottom">
                                        <p className="mb-0 fw-semibold">Reel Approved</p>
                                        <p className="mb-0 text-wrap">Your reel has been approved and published</p>
                                    </a>
                                    <a href="#!" className="dropdown-item py-3 border-bottom">
                                        <p className="mb-0 fw-semibold">Review Needed</p>
                                        <p className="mb-0 text-wrap">Your reel needs review</p>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* User Dropdown */}
                        <div className="dropdown topbar-item">
                            <button
                                type="button"
                                className="topbar-button"
                                id="page-header-user-dropdown"
                                data-bs-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                            >
                                <span className="d-flex align-items-center gap-2">                                                                              
                                    <img className="rounded-circle" width="32" height="32" src={userImage} alt={displayName} style={{ objectFit: 'cover' }} onError={(e) => {e.target.src = "/assets/images/users/avatar-1.jpg"}} />                      
                                    <span className="d-lg-flex flex-column gap-1 d-none">                                                                       
                                        <h5 className="my-0 text-reset fs-14">{displayName}</h5>                                                                   
                                    </span>
                                </span>
                            </button>
                            <div className="dropdown-menu dropdown-menu-end">   
                                {/* Updated to use role-based routing */}
                                <Link 
                                    className="dropdown-item" 
                                    to={userRole === 'seller' ? "/studio/seller/profile" : userRole === 'influencer' ? "/studio/influencer/profile" : "/studio/profile"}
                                >
                                    <i data-lucide="circle-user" className="fs-16 text-muted align-middle me-2"></i>                                            
                                    <span className="align-middle">My Account</span>                                                                            
                                </Link>
                                <div className="dropdown-divider my-1"></div>
                                <a className="dropdown-item" href="#" onClick={handleLogout}>
                                    <i data-lucide="log-out" className="fs-16 text-muted align-middle me-2"></i>
                                    <span className="align-middle">Logout</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
