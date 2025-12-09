import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function InfluencerReels() {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productNames, setProductNames] = useState({});
    const [filters, setFilters] = useState({
        product: ''
    });
    const [appliedFilters, setAppliedFilters] = useState({
        product: ''
    });
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        const params = new URLSearchParams(location.search);
        const initialProduct = params.get('product') || '';
        if (initialProduct) {
            setFilters({ product: initialProduct });
            setAppliedFilters({ product: initialProduct });
            loadReelsWithFilters();
        } else {
            loadReels();
        }
        const handleThemeChange = () => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        };
        document.addEventListener('themeChange', handleThemeChange);
        return () => {
            document.removeEventListener('themeChange', handleThemeChange);
        };
    }, [location.search]);

    const loadReels = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getInfluencerReels({});
            if (response.success) {
                setReels(response.data);
                // Load product names for all reels
                loadProductNames(response.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading reels:', error);
            setLoading(false);
        }
    };

    const loadReelsWithFilters = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getInfluencerReels(appliedFilters);
            if (response.success) {
                setReels(response.data);
                // Load product names for all reels
                loadProductNames(response.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading reels:', error);
            setLoading(false);
        }
    };

    

    // Function to load product names from the database
    const loadProductNames = async (reelsData) => {
        try {
            // Collect all unique product IDs from all reels
            const allProductIds = new Set();
            reelsData.forEach(reel => {
                if (reel.product_ids && Array.isArray(reel.product_ids)) {
                    reel.product_ids.forEach(id => allProductIds.add(id));
                }
            });

            if (allProductIds.size === 0) return;

            // Fetch real product names from the API
            const response = await ApiService.getProductNamesByIds(Array.from(allProductIds));
            if (response.success) {
                setProductNames(response.data);
            } else {
                // Fallback to placeholder names if API fails
                const productNamesMap = {};
                allProductIds.forEach(id => {
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
                    reel.product_ids.forEach(id => allProductIds.add(id));
                }
            });
            
            const productNamesMap = {};
            allProductIds.forEach(id => {
                productNamesMap[id] = `Product ${id}`;
            });
            setProductNames(productNamesMap);
        }
    };

    

    // Function to render product information for a reel
    const renderProductInfo = (productIds) => {
        if (!productIds || productIds.length === 0) {
            return <span className="text-muted">No products</span>;
        }
        
        // Display all selected products for the reel
        return (
            <div>
                {productIds.map((productId, index) => (
                    <div key={productId}>
                        {productNames[productId] || `Product ${productId}`}
                    </div>
                ))}
            </div>
        );
    };
    // Function to calculate reel count per product
    const getReelCountPerProduct = (productId) => {
        // Count how many reels have this product ID
        let count = 0;
        reels.forEach(reel => {
            if (reel.product_ids && reel.product_ids.includes(productId)) {
                count++;
            }
        });
        return count;
    };

    const getUniqueProductIds = () => {
        const ids = new Set();
        reels.forEach(reel => {
            if (reel.product_ids && Array.isArray(reel.product_ids)) {
                reel.product_ids.forEach(id => ids.add(id));
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

    // Function to handle viewing reels for a specific product
    const handleViewReelsForProduct = (productId) => {
        // Navigate to the product reels page
        navigate(`/studio/influencer/product/${productId}/reels`);
    };
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    const handleFilter = () => {
        setAppliedFilters({...filters});
        loadReelsWithFilters();
    };

    const handleClearFilter = () => {
        const clearedFilters = {
            product: ''
        };
        setFilters(clearedFilters);
        setAppliedFilters(clearedFilters);
        loadReelsWithFilters();
    };

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
                        {/* Removed the Upload Reel button as requested */}
                    </div>
                    <div className="card-body">
                        {/* Filter Section */}
                        <div className="row mb-3">
                            <div className="col-md-2">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Filter by product name"
                                    value={filters.product || ''}
                                    onChange={(e) => setFilters({...filters, product: e.target.value})}
                                />
                            </div>
                            
                            
                            <div className="col-md-4">
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
                        
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
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
                                            {reels.length === 0 || getFilteredProductIds().length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="text-center py-5">No record found</td>
                                                </tr>
                                            ) : (
                                                getFilteredProductIds().slice((currentPage - 1) * pageSize, currentPage * pageSize).map((productId) => (
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
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mt-3">
                                    <div className="text-muted">
                                        {(() => {
                                            const filtered = getFilteredProductIds();
                                            const total = filtered.length;
                                            const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
                                            const end = Math.min(currentPage * pageSize, total);
                                            return `Showing ${start} to ${end} of ${total} entries`;
                                        })()}
                                    </div>
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
