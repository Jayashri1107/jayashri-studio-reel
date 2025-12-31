import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ApiService from '../Services/ApiService';
import { BASE_URL } from '../Config/constants';

export default function Header() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [imgVersion, setImgVersion] = useState(Date.now());
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [categoriesCache, setCategoriesCache] = useState([]);
    const [brandReelsCache, setBrandReelsCache] = useState([]);
    const [influencerReelsCache, setInfluencerReelsCache] = useState([]);
    const [productsCache, setProductsCache] = useState([]);
    const [applicationsCache, setApplicationsCache] = useState([]);
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        // Load user from localStorage
        const loadUser = () => {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error('Error parsing stored user:', e);
                }
            }
        };
        loadUser();
        const handler = () => { loadUser(); setImgVersion(Date.now()); };
        window.addEventListener('user-updated', handler);
        return () => window.removeEventListener('user-updated', handler);
    }, []);

    useEffect(() => {
        // Refresh icons when user data loads or changes
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    useEffect(() => {
        // Refresh icons when user changes
        if (window.lucide && user) {
            window.lucide.createIcons();
        }
    }, [user]);

    useEffect(() => {
        if (!query || query.trim().length < 2) {
            setSuggestions([]);
            return;
        }
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                setLoadingSearch(true);
                const q = query.toLowerCase();

                if (categoriesCache.length === 0) {
                    try {
                        const resp = await ApiService.getAllCategories();
                        if (resp.success) {
                            setCategoriesCache(resp.data || []);
                        }
                    } catch {}
                }

                if (brandReelsCache.length === 0) {
                    try {
                        const resp = await ApiService.getBrandReels();
                        if (resp.success) {
                            setBrandReelsCache(Array.isArray(resp.data) ? resp.data : []);
                        }
                    } catch {}
                }

                if (influencerReelsCache.length === 0) {
                    try {
                        const resp = await ApiService.getInfluencerReelsAdmin();
                        if (resp.success) {
                            setInfluencerReelsCache(Array.isArray(resp.data) ? resp.data : []);
                        }
                    } catch {}
                }

                if (productsCache.length === 0) {
                    try {
                        const resp = await ApiService.getAllProducts();
                        if (resp.success) {
                            setProductsCache(Array.isArray(resp.data) ? resp.data : []);
                        }
                    } catch {}
                }

                if (applicationsCache.length === 0) {
                    try {
                        const resp = await ApiService.getReelApplications();
                        // Handle multiple response formats
                        if (resp.success && Array.isArray(resp.data)) {
                            setApplicationsCache(resp.data);
                        } else if (Array.isArray(resp)) {
                            setApplicationsCache(resp);
                        } else if (resp.data && Array.isArray(resp.data)) {
                            setApplicationsCache(resp.data);
                        }
                    } catch {}
                }

                const catMatches = categoriesCache
                    .filter(c => (c.name || '').toLowerCase().includes(q))
                    .slice(0, 5)
                    .map(c => ({ label: c.name, type: 'category', meta: 'Category', to: '/categories' }));

                const brandReelMatches = brandReelsCache
                    .filter(r => ((r.title || '').toLowerCase().includes(q)) || ((r.brand_name || '').toLowerCase().includes(q)) || ((r.category_name || '').toLowerCase().includes(q)))
                    .slice(0, 5)
                    .map(r => ({ label: r.title || 'Untitled', type: 'reel', meta: r.brand_name || 'Brand Reel', to: `/brands/reels/view/${r.id}` }));

                const inflReelMatches = influencerReelsCache
                    .filter(r => ((r.title || '').toLowerCase().includes(q)) || ((r.influencer || '').toLowerCase().includes(q)) || ((r.category_name || '').toLowerCase().includes(q)))
                    .slice(0, 5)
                    .map(r => ({ label: r.title || (r.influencer || 'Influencer Reel'), type: 'reel', meta: r.category_name || 'Influencer Reel', to: r.influencerId ? `/influencers/reels/view/${r.influencerId}` : '/influencers/reels' }));

                const productMatches = productsCache
                    .filter(p => (p.name || '').toLowerCase().includes(q))
                    .slice(0, 8)
                    .map(p => ({ label: p.name, type: 'product', meta: `ID ${p.id}`, to: '/brands/reels' }));

                const applicationMatches = applicationsCache
                    .filter(a => 
                        (a.firstname || '').toLowerCase().includes(q) || 
                        (a.lastname || '').toLowerCase().includes(q) || 
                        ((a.firstname + ' ' + a.lastname) || '').toLowerCase().includes(q) ||
                        (a.email || '').toLowerCase().includes(q) ||
                        (a.mobile || '').toLowerCase().includes(q) ||
                        String(a.application_id || '').includes(q)
                    )
                    .slice(0, 5)
                    .map(a => ({ 
                        label: `${a.firstname} ${a.lastname}`, 
                        type: 'applicant', 
                        meta: `App ID: ${a.application_id}`, 
                        to: `/sellers?search=${encodeURIComponent(`${a.firstname} ${a.lastname}`)}`
                    }));

                const all = [...brandReelMatches, ...inflReelMatches, ...catMatches, ...productMatches, ...applicationMatches].slice(0, 15);
                setSuggestions(all);
            } finally {
                setLoadingSearch(false);
            }
        }, 200);

        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };
    }, [query, categoriesCache, brandReelsCache, influencerReelsCache, productsCache, applicationsCache]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/Login');
    };

    const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin User' : 'Admin User';
    const userImage = user?.image ? `${BASE_URL}${user.image}?t=${imgVersion}` : null;

    return (
        <header className="topbar d-flex">
            <div className="container-fluid">
                <div className="navbar-header">
                    <div className="d-flex align-items-center gap-2">
                        <form className="app-search d-none d-md-block me-auto" onSubmit={(e) => e.preventDefault()}>
                            <div className="position-relative">
                                <input
                                    type="search"
                                    className="form-control"
                                    placeholder="Start typing..."
                                    autoComplete="off"
                                    value={query}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setQuery(v);
                                        setShowSuggestions(!!v);
                                    }}
                                    onFocus={() => setShowSuggestions(!!query)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                                />
                                <i data-lucide="search" className="search-widget-icon"></i>
                                {showSuggestions && (
                                    <div className="position-absolute w-100 mt-2" style={{ zIndex: 1000 }}>
                                        <ul className="list-group">
                                            {loadingSearch && (
                                                <li className="list-group-item d-flex align-items-center">
                                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                                    <span>Searching…</span>
                                                </li>
                                            )}
                                            {!loadingSearch && suggestions.length === 0 && (
                                                <li className="list-group-item">No matches</li>
                                            )}
                                            {!loadingSearch && suggestions.map((s, idx) => (
                                                <li
                                                    key={idx}
                                                    className="list-group-item list-group-item-action"
                                                    onMouseDown={() => {
                                                        setShowSuggestions(false);
                                                        navigate(s.to);
                                                    }}
                                                >
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <span>{s.label}</span>
                                                            {s.meta && <small className="text-muted ms-2">{s.meta}</small>}
                                                        </div>
                                                        <span className="badge bg-secondary text-uppercase">{s.type}</span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
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
                                <span className="topbar-badge text-bg-danger rounded-pill">25<span className="visually-hidden">unread messages</span></span>
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
                                        <p className="mb-0"><span className="fw-medium">New Video</span> uploaded for approval</p>
                                    </a>
                                    <a href="#!" className="dropdown-item py-3 border-bottom">
                                        <p className="mb-0 fw-semibold">Video Approved</p>
                                        <p className="mb-0 text-wrap">Your video has been approved and published</p>
                                    </a>
                                    <a href="#!" className="dropdown-item py-3 border-bottom">
                                        <p className="mb-0 fw-semibold">New Seller Registered</p>
                                        <p className="mb-0 text-wrap">A new seller has joined the platform</p>
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
                                    {userImage ? (
                                        <img className="rounded-circle" width="32" height="32" src={userImage} alt={displayName} style={{ objectFit: 'cover' }} />
                                    ) : (
                                        <span className="rounded-circle bg-light d-flex align-items-center justify-content-center" style={{ width: 32, height: 32 }}>
                                            <i data-lucide="user" className="text-muted" style={{ width: '18px', height: '18px' }}></i>
                                        </span>
                                    )}
                                    <span className="d-lg-flex flex-column gap-1 d-none">
                                        <h5 className="my-0 text-reset fs-14">{displayName}</h5>
                                    </span>
                                </span>
                            </button>
                            <div className="dropdown-menu dropdown-menu-end">   
                                <Link className="dropdown-item" to="/profile">
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
