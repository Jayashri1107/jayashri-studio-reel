import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApiService from '../../Services/ApiService';
import { toast } from 'react-toastify';

export default function SellerReels() {
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productNames, setProductNames] = useState({}); // Store product names by ID
    const [filters, setFilters] = useState({
        product: ''
    });
    const [appliedFilters, setAppliedFilters] = useState({
        product: ''
    });

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Initialize Remix Icons if available
        if (window.RemixIcon) {
            window.RemixIcon.init();
        }
        
        loadReels();
    }, []);


    const loadReels = async () => {
        try {
            setLoading(true);
            
            // Get seller reels from API
            // Note: In a real app, you would get the vendor ID from auth context or props
            const user = JSON.parse(localStorage.getItem('studioUser'));
            const vendorId = user?.vendor_id || 1; // Get from user data or fallback to 1
            const response = await ApiService.getSellerReels(vendorId);
            
            if (response.success) {
                setReels(response.data);
                // Load product names for all reels
                await loadProductNames(response.data);
            } else {
                toast.error('Failed to load reels: ' + response.message);
                setReels([]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading reels:', error);
            toast.error('Failed to load reels: ' + error.message);
            setLoading(false);
            setReels([]);
        }
    };

    const loadReelsWithFilters = async () => {
        try {
            setLoading(true);
            
            // Get seller reels from API with filters
            const user = JSON.parse(localStorage.getItem('studioUser'));
            const vendorId = user?.vendor_id || 1;
            
            // Prepare filters for API call
            const apiFilters = {};
            if (appliedFilters.product) apiFilters.product = appliedFilters.product;
            
            const response = await ApiService.getSellerReels(vendorId, apiFilters);
            
            if (response.success) {
                setReels(response.data);
                await loadProductNames(response.data);
            } else {
                toast.error('Failed to load reels: ' + response.message);
                setReels([]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading reels with filters:', error);
            toast.error('Failed to load reels: ' + error.message);
            setLoading(false);
            setReels([]);
        }
    };

    const handleFilter = async () => {
        setAppliedFilters({ ...filters });
        await loadReelsWithFilters();
    };

    const handleClearFilter = async () => {
        const cleared = { product: '' };
        setFilters(cleared);
        setAppliedFilters(cleared);
        await loadReels();
    };

    // Function to load product names from the database
    const loadProductNames = async (reelsData) => {
        try {
            // Collect all unique product IDs from all reels
            const allProductIds = new Set();
            reelsData.forEach(reel => {
                if (reel.product_ids && Array.isArray(reel.product_ids)) {
                    reel.product_ids.forEach(id => {
                        // Ensure ID is a valid number before adding to set
                        const numericId = parseInt(id);
                        if (!isNaN(numericId) && numericId > 0) {
                            allProductIds.add(numericId);
                        }
                    });
                }
            });

            if (allProductIds.size === 0) {
                setProductNames({});
                return;
            }

            // Convert Set to Array of numbers
            const productIdsArray = Array.from(allProductIds);
            
            // Fetch real product names from the API
            const response = await ApiService.getProductNamesByIds(productIdsArray);
            if (response.success) {
                setProductNames(response.data);
            } else {
                // Fallback to placeholder names if API fails
                const productNamesMap = {};
                productIdsArray.forEach(id => {
                    productNamesMap[id] = `Product ${id}`;
                });
                setProductNames(productNamesMap);
            }
        } catch (error) {
            console.error('Error loading product names:', error);
            // Fallback to placeholder names if API fails
            const allProductIds = new Set();
            reelsData.forEach(reel => {
                if (reel.product_ids && Array.isArray(reel.product_ids)) {
                    reel.product_ids.forEach(id => {
                        const numericId = parseInt(id);
                        if (!isNaN(numericId) && numericId > 0) {
                            allProductIds.add(numericId);
                        }
                    });
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

    const getUniqueProductIds = () => {
        const ids = new Set();
        reels.forEach(reel => {
            if (reel.product_ids && Array.isArray(reel.product_ids)) {
                reel.product_ids.forEach(id => {
                    const numericId = parseInt(id);
                    if (!isNaN(numericId) && numericId > 0) ids.add(numericId);
                });
            }
        });
        return Array.from(ids);
    };

    const getFilteredProductIds = () => {
        const ids = getUniqueProductIds();
        const term = (appliedFilters.product || '').trim().toLowerCase();
        if (!term) return ids;
        return ids.filter(id => {
            const name = (productNames[id] || `Product ${id}`).toLowerCase();
            return name.includes(term);
        });
    };

    // Function to render all product names for a reel
    const renderProductInfo = (productIds) => {
        if (!productIds || productIds.length === 0) {
            return <span className="text-muted">No products</span>;
        }
        const ids = productIds
            .map(id => parseInt(id))
            .filter(id => !isNaN(id) && id > 0);
        if (ids.length === 0) {
            return <span className="text-muted">No products</span>;
        }
        return (
            <div className="d-flex flex-wrap gap-1">
                {ids.map(pid => (
                    <span key={pid} className="badge bg-secondary">
                        {productNames[pid] || `Product ${pid}`}
                    </span>
                ))}
            </div>
        );
    };

    // Function to calculate reel count per product
    const getReelCountPerProduct = (productId) => {
        // Count how many reels have this product ID
        let count = 0;
        reels.forEach(reel => {
            if (reel.product_ids && Array.isArray(reel.product_ids)) {
                // Check if any of the reel's product IDs match the given productId
                const hasProduct = reel.product_ids.some(id => {
                    const reelProductId = parseInt(id);
                    return !isNaN(reelProductId) && reelProductId > 0 && reelProductId === productId;
                });
                if (hasProduct) {
                    count++;
                }
            }
        });
        return count;
    };

    // Function to handle viewing reels for a specific product
    const handleViewReelsForProduct = (productId) => {
        // Navigate to the product reels page
        navigate(`/studio/seller/reels/${productId}`);
    };
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box d-flex align-items-center justify-content-between">
                    <h4 className="page-title mb-0">My Reels</h4>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h5 className="card-title mb-0">Reels Management</h5>
                    </div>
                    <div className="card-body">
                        {/* Filter Section */}
                        <div className="row mb-3">
                            <div className="col-md-3">
                                <label className="form-label">Product Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Filter by product name"
                                    value={filters.product || ''}
                                    onChange={(e) => setFilters({...filters, product: e.target.value})}
                                />
                            </div>
                            
                            
                            <div className="col-md-3">
                                <label className="form-label">&nbsp;</label>
                                <div>
                                    <button 
                                        className="btn btn-primary me-2" 
                                        onClick={handleFilter}
                                    >
                                        Filter
                                    </button>
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={handleClearFilter}
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : reels.length === 0 ? (
                            <div className="text-center py-5">
                                <h5>No reels found</h5>
                                <p className="text-muted">Upload your first reel to get started.</p>
                                <Link to="/studio/seller/upload" className="btn btn-success">
                                    <i className="ri-upload-line me-1"></i> Upload Reel
                                </Link>
                            </div>
                        ) : (
                            <>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Product Name</th>
                                            <th>Reel Count</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getFilteredProductIds().slice((currentPage - 1) * pageSize, currentPage * pageSize).map((productId) => (
                                            <tr key={productId}>
                                                <td>
                                                    {productNames[productId] || `Product ${productId}`}
                                                </td>
                                                <td>
                                                    <span className="badge bg-primary">
                                                        {getReelCountPerProduct(productId)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-info"
                                                        onClick={() => handleViewReelsForProduct(productId)}
                                                        title={`View reels for ${productNames[productId] || `Product ${productId}`}`}
                                                    >
                                                        <i className="ri-eye-line"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <div className="text-muted">{(() => {
                                    const total = getFilteredProductIds().length;
                                    const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
                                    const end = Math.min(currentPage * pageSize, total);
                                    return `Showing ${start} to ${end} of ${total} entries`;
                                })()}</div>
                                <ul className="pagination mb-0">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" aria-label="Previous" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                                            <i className="ri-arrow-left-s-line"></i>
                                        </button>
                                    </li>
                                    {Array.from({ length: Math.ceil(getFilteredProductIds().length / pageSize) || 1 }, (_, i) => i + 1).map(page => (
                                        <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${currentPage >= Math.ceil(getFilteredProductIds().length / pageSize) ? 'disabled' : ''}`}>
                                        <button className="page-link" aria-label="Next" onClick={() => setCurrentPage(p => Math.min(Math.ceil(getFilteredProductIds().length / pageSize) || 1, p + 1))}>
                                            <i className="ri-arrow-right-s-line"></i>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
