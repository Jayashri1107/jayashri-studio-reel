import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
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

    const toggleMenu = (menuId) => {
        setExpandedMenus(prev => ({
            ...prev,
            [menuId]: !prev[menuId]
        }));
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
            permission: 'seller_mod',
            items: [
                { id: 'manage-sellers', path: '/sellers', text: 'Manage Sellers', permission: 'manage_seller_mod' },
                { id: 'seller-reels', path: '/sellers/reels', text: 'Seller Reels', permission: 'seller_reels_mod' },
                { id: 'approval-list', path: '/sellers/approvals', text: 'Approval List', permission: 'seller_approval_list_mod' }
            ]
        },
        {
            id: 'influencers',
            type: 'menu',
            icon: 'users',
            text: 'Influencers',
            permission: 'influencer_mod',
            items: [
                { id: 'manage-influencers', path: '/influencers', text: 'Manage Influencers', permission: 'manage_influencer_mod' },
                { id: 'influencer-reels', path: '/influencers/reels', text: 'Influencer Reels', permission: 'influencer_reels_mod' },
                { id: 'influencer-approvals', path: '/influencers/approvals', text: 'Approval List', permission: 'influencer_approval_list_mod' }
            ]
        },
        {
            id: 'brands',
            type: 'menu',
            icon: 'briefcase',
            text: 'Brands',
            permission: 'brand_mod',
            items: [
                { id: 'brand-reels', path: '/brands/reels', text: 'Brand Reels', permission: 'brand_reels_mod' }
            ]
        },
        {
            id: 'categories',
            type: 'item',
            path: '/categories',
            icon: 'folder',
            text: 'Categories',
            permission: 'categories_mod'
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
            permission: 'dashboard'
        },
        // {
        //     id: 'users',
        //     type: 'menu',
        //     icon: 'users',
        //     text: 'User Management',
        //     permission: 'user_management_mod',
        //     items: [
        //         { id: 'manage-users', path: '/users', text: 'Users', permission: 'users_mod' },
        //         { id: 'user-groups', path: '/users/groups', text: 'User Groups', permission: 'user_groups_mod' }
        //     ]
        // },
        {
            id: 'settings',
            type: 'item',
            path: '/settings',
            icon: 'settings',
            text: 'Settings',
            permission: 'dashboard_mod'
        }
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
                                    <Link 
                                        to={item.path} 
                                        className={`menu-link ${location.pathname === item.path ? 'active' : ''}`}
                                    >
                                        <span className="nav-icon">
                                            <i data-lucide={item.icon}></i>
                                        </span>
                                        <span className="nav-text">{item.text}</span>
                                    </Link>
                                </li>
                            );
                        } else if (item.type === 'menu') {
                            return (
                                <li key={item.id} className="menu-item">
                                    <a 
                                        className="menu-link" 
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
                                                        <Link 
                                                            to={subItem.path} 
                                                            className={`sub-menu-link ${location.pathname === subItem.path ? 'active' : ''}`}
                                                        >
                                                            {subItem.text}
                                                        </Link>
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