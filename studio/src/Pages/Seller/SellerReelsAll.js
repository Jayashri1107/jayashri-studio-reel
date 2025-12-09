import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../Services/ApiService';
import { toast } from 'react-toastify';

export default function SellerReelsAll() {
    const navigate = useNavigate();
    const location = useLocation();
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productNames, setProductNames] = useState({});
    const [filters, setFilters] = useState({
        product: ''
    });
    // Pagination state for product list
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        if (window.RemixIcon) {
            window.RemixIcon.init();
        }
        const params = new URLSearchParams(location.search);
        const initialProduct = params.get('product') || '';
        if (initialProduct) {
            setFilters({ product: initialProduct });
            loadSellerReelsWithFilters();
        } else {
            loadSellerReels();
        }
    }, [location.search]);

    // Reset pagination when reels change
    useEffect(() => {
        setCurrentPage(1);
    }, [reels]);

    const loadSellerReels = async () => {
        try {
            setLoading(true);
            
            // Get the vendor ID from the authenticated user
            const user = JSON.parse(localStorage.getItem('studioUser'));
            const vendorId = user?.vendor_id;
            
            if (!vendorId) {
                toast.error('Unable to load reels: User not authenticated');
                setLoading(false);
                return;
            }
            
            // Get seller reels from API
            const response = await ApiService.getSellerReels(vendorId);
            
            if (response.success) {
                // Load product names for all reels
                await loadProductNames(response.data);
                
                // Set reels directly without grouping
                setReels(response.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading seller reels:', error);
            toast.error('Failed to load reels: ' + error.message);
            setLoading(false);
        }
    };

    const loadSellerReelsWithFilters = async () => {
        try {
            setLoading(true);
            
            // Get the vendor ID from the authenticated user
            const user = JSON.parse(localStorage.getItem('studioUser'));
            const vendorId = user?.vendor_id;
            
            if (!vendorId) {
                toast.error('Unable to load reels: User not authenticated');
                setLoading(false);
                return;
            }
            
            // Prepare filters for API call
            const apiFilters = {};
            if (filters.product) apiFilters.product = filters.product;
            
            console.log('Sending filters to API:', apiFilters);
            
            // Get seller reels from API with filters
            const response = await ApiService.getSellerReels(vendorId, apiFilters);
            
            if (response.success) {
                // Load product names for all reels
                await loadProductNames(response.data);
                
                // Set reels directly without grouping
                setReels(response.data);
                console.log('Received filtered reels:', response.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading seller reels with filters:', error);
            toast.error('Failed to load reels: ' + error.message);
            setLoading(false);
        }
    };

    const handleFilter = async () => {
        console.log('Applying filters:', filters);
        await loadSellerReelsWithFilters();
    };

    const handleClearFilter = async () => {
        setFilters({
            product: ''
        });
        await loadSellerReels(); // Reload all reels
    };

    // Function to load product names from the database
    const loadProductNames = async (reelsData) => {
        console.log('Loading product names for reels:', reelsData);
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

    // Function to get product name for a reel
    const getProductNameForReel = (reel) => {
        if (reel.product_ids && Array.isArray(reel.product_ids) && reel.product_ids.length > 0) {
            const productId = parseInt(reel.product_ids[0]);
            if (!isNaN(productId) && productId > 0) {
                return productNames[productId] || `Product ${productId}`;
            }
        }
        return 'No Product Assigned';
    };

    const handleViewReelVideo = async (productId) => {
        // Navigate to the view page for this product
        if (productId) {
            navigate(`/studio/seller/reels/${productId}`);
        } else {
            toast.info('No product associated with these reels');
        }
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

    // Calculate product IDs and pagination outside of render
    const productIds = Array.from(new Set(
        reels.flatMap(reel => Array.isArray(reel.product_ids) 
            ? reel.product_ids
                .map(id => parseInt(id))
                .filter(id => !isNaN(id) && id > 0)
            : []
        )
    ));
    
    const totalPages = Math.max(1, Math.ceil(productIds.length / pageSize));
    const paginated = productIds.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
                        ) : (
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
                                        {reels.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="text-center py-5">No record found</td>
                                            </tr>
                                        ) : paginated.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="text-center py-5">No record found</td>
                                            </tr>
                                        ) : (
                                            <>
                                                {paginated.map(productId => {
                                                    const productReels = reels.filter(reel => 
                                                        Array.isArray(reel.product_ids) && 
                                                        reel.product_ids.some(id => parseInt(id) === productId)
                                                    );
                                                    return (
                                                        <tr key={productId}>
                                                            <td>{productNames[productId] || `Product ${productId}`}</td>
                                                            <td>
                                                                <span className="badge bg-primary">
                                                                    {productReels.length}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <button 
                                                                    className="btn btn-sm btn-info"
                                                                    onClick={() => handleViewReelVideo(productId)}
                                                                    title="View Reels"
                                                                >
                                                                    <i className="ri-eye-line"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {reels.filter(reel => !reel.product_ids || reel.product_ids.length === 0).map((reel) => (
                                                    <tr key={reel.id}>
                                                        <td>No Product Assigned</td>
                                                        <td>
                                                            <span className="badge bg-secondary">1</span>
                                                        </td>
                                                        <td>
                                                            <button 
                                                                className="btn btn-sm btn-secondary"
                                                                disabled
                                                                title="No product assigned"
                                                            >
                                                                <i className="ri-eye-line"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                        <tr>
                                            <td colSpan={3}>
                                                <div className="d-flex justify-content-between align-items-center mt-3">
                                                    <div className="text-muted">{(() => {
                                                        const total = productIds.length;
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
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                            <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                                                                <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                                                            </li>
                                                        ))}
                                                        <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
                                                            <button className="page-link" aria-label="Next" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
                                                                <i className="ri-arrow-right-s-line"></i>
                                                            </button>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
