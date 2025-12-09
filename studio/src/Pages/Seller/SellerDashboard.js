import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function SellerDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalReels: 0,
        approvedReels: 0,
        pendingReels: 0,
        rejectedReels: 0
    });
    
    // Debug: Log stats state changes
    useEffect(() => {
        console.log('Stats state updated:', stats);
    }, [stats]);
    const [recentReels, setRecentReels] = useState([]);
    
    // Debug: Log recentReels state changes
    useEffect(() => {
        console.log('Recent reels state updated:', recentReels);
    }, [recentReels]);
    const [loading, setLoading] = useState(true);
    const [isApproved, setIsApproved] = useState(true);
    const [productNames, setProductNames] = useState({});
    
    // Debug: Log state changes
    useEffect(() => {
        console.log('Product names state updated:', productNames);
    }, [productNames]);

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Check if seller is approved
        checkSellerApproval();
        
        // Load real data
        loadDashboardData();
    }, []);

    const checkSellerApproval = async () => {
        try {
            const token = localStorage.getItem('studioToken');
            const user = JSON.parse(localStorage.getItem('studioUser'));
            
            console.log('Token:', token);
            console.log('User data:', user);
            
            if (!token || !user) {
                navigate('/studio/seller/login');
                return;
            }
        } catch (error) {
            console.error('Error checking seller approval:', error);
        }
    };

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Get vendor ID from user data or use default
            const user = JSON.parse(localStorage.getItem('studioUser'));
            const vendorId = user?.vendor_id || 1;
            
            console.log('User object:', user);
            console.log('Vendor ID extracted:', vendorId);
            console.log('Fetching dashboard data for vendor ID:', vendorId);
            
            // Fetch dashboard statistics
            const statsResponse = await ApiService.getSellerDashboardStats(vendorId);
            console.log('Stats response:', statsResponse);
            if (statsResponse.success) {
                setStats(statsResponse.data);
            } else {
                toast.error('Failed to load dashboard statistics: ' + statsResponse.message);
            }
            
            // Fetch recent reels
            const reelsResponse = await ApiService.getRecentSellerReels(vendorId, 5);
            console.log('Reels response:', reelsResponse);
            if (reelsResponse.success) {
                setRecentReels(reelsResponse.data);
                // Load product names for the recent reels
                await loadProductNames(reelsResponse.data);
            } else {
                toast.error('Failed to load recent reels: ' + reelsResponse.message);
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            toast.error('Failed to load dashboard data: ' + error.message);
            setLoading(false);
        }
    };

    // Function to load product names from the database
    const loadProductNames = async (reelsData) => {
        try {
            console.log('Loading product names for reels:', reelsData);
            // Collect all unique product IDs from all reels
            const allProductIds = new Set();
            reelsData.forEach((reel, index) => {
                console.log(`Processing reel ${index}:`, reel);
                if (reel.product_ids && Array.isArray(reel.product_ids)) {
                    console.log(`Reel ${index} has array product_ids:`, reel.product_ids);
                    reel.product_ids.forEach((id, idIndex) => {
                        // Ensure ID is a valid number before adding to set
                        const numericId = parseInt(id);
                        console.log(`Processing product ID ${idIndex} (${id}) -> ${numericId}`);
                        if (!isNaN(numericId) && numericId > 0) {
                            allProductIds.add(numericId);
                            console.log(`Added ${numericId} to product IDs set`);
                        } else {
                            console.log(`Skipped invalid product ID: ${id}`);
                        }
                    });
                } else if (reel.product_ids && typeof reel.product_ids === 'string') {
                    console.log(`Reel ${index} has string product_ids:`, reel.product_ids);
                    // Handle case where product_ids might be a comma-separated string
                    const ids = reel.product_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0);
                    console.log(`Parsed string product_ids to:`, ids);
                    ids.forEach(id => allProductIds.add(id));
                } else {
                    console.log(`Reel ${index} has no valid product_ids:`, reel.product_ids);
                }
            });

            console.log('Collected product IDs:', Array.from(allProductIds));

            if (allProductIds.size === 0) {
                console.log('No product IDs found, setting empty product names');
                setProductNames({});
                return;
            }

            // Convert Set to Array of numbers
            const productIdsArray = Array.from(allProductIds);
            
            if (productIdsArray.length === 0) {
                console.log('Product IDs array is empty, setting empty product names');
                setProductNames({});
                return;
            }

            console.log('Fetching product names for IDs:', productIdsArray);
            // Fetch real product names from the API
            const response = await ApiService.getProductNamesByIds(productIdsArray);
            console.log('Product names response:', response);
            if (response.success) {
                console.log('Setting product names:', response.data);
                setProductNames(response.data);
            } else {
                console.log('Product names API failed, using fallback');
                // Fallback to placeholder names if API fails
                const productNamesMap = {};
                productIdsArray.forEach(id => {
                    productNamesMap[id] = `Product ${id}`;
                });
                console.log('Setting fallback product names:', productNamesMap);
                setProductNames(productNamesMap);
            }
        } catch (error) {
            console.error('Error loading product names:', error);
            // Fallback to placeholder names
            const allProductIds = new Set();
            reelsData.forEach(reel => {
                if (reel.product_ids && Array.isArray(reel.product_ids)) {
                    reel.product_ids.forEach(id => {
                        const numericId = parseInt(id);
                        if (!isNaN(numericId) && numericId > 0) {
                            allProductIds.add(numericId);
                        }
                    });
                } else if (reel.product_ids && typeof reel.product_ids === 'string') {
                    const ids = reel.product_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0);
                    ids.forEach(id => allProductIds.add(id));
                }
            });
            
            const productIdsArray = Array.from(allProductIds);
            const productNamesMap = {};
            productIdsArray.forEach(id => {
                productNamesMap[id] = `Product ${id}`;
            });
            setProductNames(productNamesMap);
        }
    };

    // Function to render product information for a reel
    const renderProductInfo = (productIds) => {
        console.log('Rendering product info for:', productIds);
        if (!productIds || productIds.length === 0) {
            console.log('No product IDs provided');
            return <span className="text-muted">No products</span>;
        }
        
        // Handle different data types for productIds
        let productIdArray = [];
        if (Array.isArray(productIds)) {
            productIdArray = productIds;
            console.log('Product IDs is array:', productIdArray);
        } else if (typeof productIds === 'string') {
            // Handle comma-separated string
            productIdArray = productIds.split(',').map(id => id.trim());
            console.log('Product IDs is string, split to:', productIdArray);
        } else {
            // Handle single value
            productIdArray = [productIds];
            console.log('Product IDs is single value, converted to array:', productIdArray);
        }
        
        console.log('Processed product ID array:', productIdArray);
        
        // Display only the primary product name associated with the reel
        const primaryProductId = parseInt(productIdArray[0]);
        
        console.log('Primary product ID (before parsing):', productIdArray[0]);
        console.log('Primary product ID (after parsing):', primaryProductId);
        
        // Check if productId is valid
        if (isNaN(primaryProductId) || primaryProductId <= 0) {
            console.log('Invalid primary product ID');
            return <span className="text-muted">Unknown Product</span>;
        }
        
        console.log('Primary product ID:', primaryProductId);
        console.log('Product names map:', productNames);
        
        // Check if we have the product name in our map
        const productName = productNames[primaryProductId];
        
        console.log('Product name from map:', productName);
        
        // If we have the product name, show it; otherwise show a fallback
        if (productName) {
            console.log('Returning product name:', productName);
            return <div>{productName}</div>;
        } else {
            console.log('Returning fallback product name');
            return <div>Product {primaryProductId}</div>;
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="badge bg-success">Approved</span>;
            case 'pending':
                return <span className="badge bg-warning">Pending</span>;
            case 'rejected':
                return <span className="badge bg-danger">Rejected</span>;
            default:
                return <span className="badge bg-secondary">Unknown</span>;
        }
    };

    if (!isApproved) {
        return (
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body text-center">
                            <h3 className="text-warning">Account Not Approved</h3>
                            <p className="text-muted">your account is on review please wait for the admin approval</p>
                            <button 
                                className="btn btn-primary" 
                                onClick={() => navigate('/studio/seller/login')}
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box d-flex align-items-center justify-content-between">
                    <h4 className="page-title mb-0">Seller Dashboard</h4>
                </div>
            </div>

            <div className="col-xl-3 col-md-6">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex">
                            <div className="flex-grow-1">
                                <p className="text-muted mb-1">Total Reels</p>
                                <h4 className="mb-0">{stats.totalReels}</h4>
                            </div>
                            <div className="flex-shrink-0 avatar-md rounded-circle bg-soft-primary">
                                <div className="avatar-title fs-24 text-primary">
                                    <i className="ri-film-line"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-xl-3 col-md-6">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex">
                            <div className="flex-grow-1">
                                <p className="text-muted mb-1">Approved</p>
                                <h4 className="mb-0">{stats.approvedReels}</h4>
                            </div>
                            <div className="flex-shrink-0 avatar-md rounded-circle bg-soft-success">
                                <div className="avatar-title fs-24 text-success">
                                    <i className="ri-checkbox-circle-line"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-xl-3 col-md-6">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex">
                            <div className="flex-grow-1">
                                <p className="text-muted mb-1">Pending Review</p>
                                <h4 className="mb-0">{stats.pendingReels}</h4>
                            </div>
                            <div className="flex-shrink-0 avatar-md rounded-circle bg-soft-warning">
                                <div className="avatar-title fs-24 text-warning">
                                    <i className="ri-time-line"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-xl-3 col-md-6">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex">
                            <div className="flex-grow-1">
                                <p className="text-muted mb-1">Rejected</p>
                                <h4 className="mb-0">{stats.rejectedReels}</h4>
                            </div>
                            <div className="flex-shrink-0 avatar-md rounded-circle bg-soft-danger">
                                <div className="avatar-title fs-24 text-danger">
                                    <i className="ri-close-circle-line"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h5 className="card-title mb-0">Recent Reels</h5>
                        <Link to="/studio/seller/reels" className="btn btn-soft-primary">
                            View All
                        </Link>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : recentReels.length === 0 ? (
                            <div className="text-center py-5">
                                <h5>No reels found</h5>
                                <p className="text-muted">Upload your first reel to get started.</p>
                                <Link to="/studio/seller/upload" className="btn btn-success">
                                    <i className="ri-upload-line me-1"></i> Upload Reel
                                </Link>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Product</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentReels.map((reel) => (
                                            <tr key={reel.id}>
                                                <td>{reel.title}</td>
                                                <td>{renderProductInfo(reel.product_ids)}</td>
                                                <td>{getStatusBadge(reel.status)}</td>
                                                <td>{reel.created_at ? new Date(reel.created_at).toLocaleDateString() : 'N/A'}</td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-soft-info"
                                                        onClick={() => {
                                                            // Navigate to the product reels page when View is clicked
                                                            if (reel.product_ids && reel.product_ids.length > 0) {
                                                                const productId = parseInt(reel.product_ids[0]);
                                                                if (!isNaN(productId) && productId > 0) {
                                                                    navigate(`/studio/seller/reels/${productId}`);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <i className="ri-eye-line"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {/* Debug info */}
                                <div style={{display: 'none'}}>
                                    <pre>{JSON.stringify(recentReels, null, 2)}</pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">Quick Actions</h5>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3 col-6">
                                <Link to="/studio/seller/upload" className="btn btn-outline-success w-100">
                                    <i className="ri-upload-line me-1"></i> Upload Reel
                                </Link>
                            </div>
                            <div className="col-md-3 col-6">
                                <Link to="/studio/seller/reels" className="btn btn-outline-primary w-100">
                                    <i className="ri-film-line me-1"></i> My Reels
                                </Link>
                            </div>
                            <div className="col-md-3 col-6">
                                <Link to="/studio/seller/profile" className="btn btn-outline-secondary w-100">
                                    <i className="ri-user-line me-1"></i> My Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
