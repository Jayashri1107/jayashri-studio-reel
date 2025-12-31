import React, { useEffect, useState } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { useUser } from '../Context/UserContext';

export default function Sidebar() {
    const location = useLocation();
    const [expandedMenus, setExpandedMenus] = useState({});
    const { user, userGroup, hasPermission } = useUser();

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [location]);

    // Restore persisted expanded menus on initial mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('expandedMenus');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object') {
                    setExpandedMenus(parsed);
                }
            }
        } catch (_) {}
    }, []);

    // Ensure the parent menu for current route stays expanded and highlighted
    useEffect(() => {
        const currentPath = location.pathname;
        const activeParent = menuItems.find(item =>
            item.type === 'menu' &&
            item.items?.some(sub =>
                currentPath === sub.path || currentPath.startsWith(sub.path + '/')
            )
        );
        if (activeParent) {
            setExpandedMenus(prev => {
                const next = { ...prev, [activeParent.id]: true };
                try {
                    localStorage.setItem('expandedMenus', JSON.stringify(next));
                } catch (_) {}
                return next;
            });
        }
    }, [location]);

    const toggleMenu = (menuId) => {
        setExpandedMenus(prev => {
            const next = {
                ...prev,
                [menuId]: !prev[menuId]
            };
            try {
                localStorage.setItem('expandedMenus', JSON.stringify(next));
            } catch (_) {}
            return next;
        });
    };

    // Define menu items with their required permissions
    const menuItems = [
        {
            id: 'dashboard',
            type: 'item',
            path: '/',
            icon: 'layout-dashboard',
            text: 'Dashboard',
            permission: 'dashboard'
        },
        {
            id: 'sellers',
            type: 'menu',
            icon: 'shopping-cart',
            text: 'Sellers',
            permission: 'seller_manage_seller', // Updated permission
            items: [
                { id: 'manage-sellers', path: '/sellers', text: 'Manage Sellers', permission: 'seller_manage_seller' },
                { id: 'seller-reels', path: '/studio/seller/reels', text: 'Seller Reels', permission: 'seller_seller_reels' },
                { id: 'approval-list', path: '/sellers/approvals', text: 'Approval List', permission: 'seller_approval_list' }
            ]
        },
        {
            id: 'influencers',
            type: 'menu',
            icon: 'users',
            text: 'Influencers',
            permission: 'influencer_manage_influencer', // Updated permission
            items: [
                { id: 'manage-influencers', path: '/influencers', text: 'Manage Influencers', permission: 'influencer_manage_influencer' },
                { id: 'influencer-reels', path: '/studio/influencer/reels', text: 'Influencer Reels', permission: 'influencer_influencer_reels' },
                { id: 'influencer-approvals', path: '/influencers/approvals', text: 'Approval List', permission: 'influencer_approval_list' }
            ]
        },
        {
            id: 'brands',
            type: 'menu',
            icon: 'briefcase',
            text: 'Brands',
            permission: 'brand_brand_reels', // Updated permission
            items: [
                { id: 'brand-reels', path: '/brands/reels', text: 'Brand Reels', permission: 'brand_brand_reels' }
            ]
        },
        {
            id: 'categories',
            type: 'item',
            path: '/categories',
            icon: 'folder',
            text: 'Categories',
            permission: 'category' // Updated permission
        },
        // {
        //     id: 'pages-title',
        //     type: 'title',
        //     text: 'Pages'
        // },
        {
            id: 'profile',
            type: 'item',
            path: '/profile',
            icon: 'circle-user',
            text: 'Profile',
            permission: 'dashboard' // Keep this permission
        },
        {
            id: 'users',
            type: 'menu',
            icon: 'users',
            text: 'User Management',
            permission: 'user_management_users', // Updated permission
            items: [
                { id: 'manage-users', path: '/users', text: 'Users', permission: 'user_management_users' },
                { id: 'user-groups', path: '/users/groups', text: 'User Groups', permission: 'user_management_user_groups' }
            ]
        },
        // {
        //     id: 'settings',
        //     type: 'item',
        //     path: '/settings',
        //     icon: 'settings',
        //     text: 'Settings',
        //     permission: 'dashboard' // Updated permission
        // }
    ];

    // Filter menu items based on user permissions
    const filteredMenuItems = userGroup ? menuItems.filter(item => {
        // If no permission is required, show the item
        if (!item.permission) return true;
        
        // Check if user has the required permission
        return hasPermission(item.permission);
    }) : menuItems; // If no user group, show all items (fallback)

    return (
        <div className="main-nav">
            <div className="d-flex justify-content-between main-logo-box">
                <div className="logo-box">
                    <Link to="/" className="logo-dark">
                        <img src="/assets/images/ipshopy-logo-black.png" className="logo-sm" alt="ipshopy logo sm" />
                        <img src="/assets/images/ipshopy-logo-black.png" className="logo-lg" alt="ipshopy logo" />
                    </Link>
                    <Link to="/" className="logo-light">
                        <img src="/assets/images/ipshopy-logo-white.png" className="logo-sm" alt="ipshopy logo sm" />
                        <img src="/assets/images/ipshopy-logo-white.png" className="logo-lg" alt="ipshopy logo" />
                    </Link>
                </div>
                <button 
                    type="button" 
                    className="btn btn-link d-flex button-sm-hover button-toggle-menu" 
                    aria-label="Show Full Sidebar"
                >
                    <i data-lucide="menu" className="button-sm-hover-icon"></i>
                </button>
            </div>

            <div className="h-100" data-simplebar>
                <ul className="navbar-nav" id="navbar-nav">
                    {filteredMenuItems.map(item => {
                        if (item.type === 'title') {
                            return (
                                <li key={item.id} className="menu-title">{item.text}</li>
                            );
                        } else if (item.type === 'item') {
                            return (
                                <li key={item.id} className="menu-item">
                                    <NavLink 
                                        to={item.path} 
                                        className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                                        end={item.path === '/'}
                                    >
                                        <span className="nav-icon">
                                            <i data-lucide={item.icon}></i>
                                        </span>
                                        <span className="nav-text">{item.text}</span>
                                    </NavLink>
                                </li>
                            );
                        } else if (item.type === 'menu') {
                            const isMenuActive = item.items.some(subItem => 
                                location.pathname === subItem.path || 
                                location.pathname.startsWith(subItem.path + '/')
                            );
                            return (
                                <li key={item.id} className="menu-item">
                                    <a 
                                        className={`menu-link ${isMenuActive ? 'active' : ''}`} 
                                        href={`#sidebar${item.id.charAt(0).toUpperCase() + item.id.slice(1)}`} 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            toggleMenu(item.id);
                                        }}
                                        data-bs-toggle="collapse"
                                        role="button"
                                        aria-expanded={expandedMenus[item.id]}
                                    >
                                        <span className="nav-icon">
                                            <i data-lucide={item.icon}></i>
                                        </span>
                                        <span className="nav-text">{item.text}</span>
                                        <span className="menu-arrow">
                                            <i data-lucide={expandedMenus[item.id] ? "chevron-up" : "chevron-down"}></i>
                                        </span>
                                    </a>
                                    <div className={`collapse ${expandedMenus[item.id] ? 'show' : ''}`} id={`sidebar${item.id.charAt(0).toUpperCase() + item.id.slice(1)}`}>
                                        <ul className="sub-menu-nav">
                                            {item.items
                                                .filter(subItem => !userGroup || !subItem.permission || hasPermission(subItem.permission))
                                                .map(subItem => (
                                                    <li key={subItem.id} className="sub-menu-item">
                                                        <NavLink 
                                                            to={subItem.path} 
                                                            className={({ isActive }) => `sub-menu-link ${isActive ? 'active' : ''}`}
                                                        >
                                                            {subItem.text}
                                                        </NavLink>
                                                    </li>
                                                ))
                                            }
                                        </ul>
                                    </div>
                                </li>
                            );
                        }
                        return null;
                    })}
                </ul>
            </div>
        </div>
    );
}
