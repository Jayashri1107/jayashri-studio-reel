import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function StudioSidebar() {
    const location = useLocation();
    const [userRole, setUserRole] = useState('influencer'); // Default to influencer

    useEffect(() => {
        // Get user role from localStorage
        const storedUser = localStorage.getItem('studioUser');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setUserRole(user.role || 'influencer');
            } catch (e) {
                console.error('Error parsing stored user:', e);
            }
        }
    }, []);

    const getBasePath = () => {
        return userRole === 'seller' ? '/studio/seller' : '/studio/influencer';
    };

    const basePath = getBasePath();

    return (
        <div className="sidebar">
            <div className="logo-box">
                <Link to={basePath} className="logo logo-light">
                    <span className="logo-sm">
                        <img src="/assets/images/logo-sm.png" alt="" height="22" />
                    </span>
                    <span className="logo-lg">
                        <img src="/assets/images/logo-light.png" alt="" height="50" />
                    </span>
                </Link>

                <Link to={basePath} className="logo logo-dark">
                    <span className="logo-sm">
                        <img src="/assets/images/logo-sm.png" alt="" height="22" />
                    </span>
                    <span className="logo-lg">
                        <img src="/assets/images/logo-dark.png" alt="" height="50" />
                    </span>
                </Link>
            </div>

            <div className="scrollbar" data-simplebar>
                <ul className="side-nav">
                    <li className="side-nav-title">Studio</li>

                    <li className="menu-item">
                        <Link 
                            to={basePath} 
                            className={`menu-link ${location.pathname === basePath ? 'active' : ''}`}
                        >
                            <span className="nav-icon">
                                <i data-lucide="home"></i>
                            </span>
                            <span className="nav-text">Dashboard</span>
                        </Link>
                    </li>

                    <li className="menu-item">
                        <Link 
                            to={`${basePath}/reels`} 
                            className={`menu-link ${location.pathname === `${basePath}/reels` ? 'active' : ''}`}
                        >
                            <span className="nav-icon">
                                <i data-lucide="film"></i>
                            </span>
                            <span className="nav-text">My Reels</span>
                        </Link>
                    </li>

                    <li className="menu-item">
                        <Link 
                            to={`${basePath}/upload`} 
                            className={`menu-link ${location.pathname === `${basePath}/upload` ? 'active' : ''}`}
                        >
                            <span className="nav-icon">
                                <i data-lucide="upload"></i>
                            </span>
                            <span className="nav-text">Upload Reel</span>
                        </Link>
                    </li>

                    {userRole === 'seller' ? (
                        <li className="menu-item">
                            <Link 
                                to={`${basePath}/products`} 
                                className={`menu-link ${location.pathname === `${basePath}/products` ? 'active' : ''}`}
                            >
                                <span className="nav-icon">
                                    <i data-lucide="shopping-bag"></i>
                                </span>
                                <span className="nav-text">My Products</span>
                            </Link>
                        </li>
                    ) : (
                        <li className="menu-item">
                            <Link 
                                to={`${basePath}/campaigns`} 
                                className={`menu-link ${location.pathname === `${basePath}/campaigns` ? 'active' : ''}`}
                            >
                                <span className="nav-icon">
                                    <i data-lucide="megaphone"></i>
                                </span>
                                <span className="nav-text">My Campaigns</span>
                            </Link>
                        </li>
                    )}

                    <li className="menu-item">
                        <Link 
                            to="/studio/profile" 
                            className={`menu-link ${location.pathname === '/studio/profile' ? 'active' : ''}`}
                        >
                            <span className="nav-icon">
                                <i data-lucide="user"></i>
                            </span>
                            <span className="nav-text">My Profile</span>
                        </Link>
                    </li>

                    <li className="menu-item">
                        <Link 
                            to="/studio/settings" 
                            className={`menu-link ${location.pathname === '/studio/settings' ? 'active' : ''}`}
                        >
                            <span className="nav-icon">
                                <i data-lucide="settings"></i>
                            </span>
                            <span className="nav-text">Settings</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </div>
    );
}