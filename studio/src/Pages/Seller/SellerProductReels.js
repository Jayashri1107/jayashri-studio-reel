import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ApiService from '../../Services/ApiService';
import { toast } from 'react-toastify';

export default function SellerProductReels() {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productName, setProductName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const { productId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        loadProductReels();
    }, [productId]);

    useEffect(() => {
        setCurrentPage(1);
    }, [reels]);

    const loadProductReels = async () => {
        try {
            setLoading(true);
            
            // Parse the product ID as integer
            const parsedProductId = parseInt(productId);
            
            if (isNaN(parsedProductId) || parsedProductId <= 0) {
                toast.error('Invalid product ID');
                setLoading(false);
                return;
            }
            
            // Get product name
            const productNamesResponse = await ApiService.getProductNamesByIds([parsedProductId]);
            if (productNamesResponse.success && productNamesResponse.data[parsedProductId]) {
                setProductName(productNamesResponse.data[parsedProductId]);
            } else {
                setProductName(`Product ${parsedProductId}`);
            }
            
            // Get seller reels from API
            const user = JSON.parse(localStorage.getItem('studioUser'));
            const vendorId = user?.vendor_id;
            
            if (!vendorId) {
                toast.error('Unable to load reels: User not authenticated');
                setLoading(false);
                return;
            }
            
            const response = await ApiService.getSellerReels(vendorId);
            
            if (response.success) {
                // Filter reels that contain this product ID
                const filteredReels = response.data.filter(reel => {
                    if (reel.product_ids && Array.isArray(reel.product_ids)) {
                        return reel.product_ids.some(id => {
                            const reelProductId = parseInt(id);
                            return !isNaN(reelProductId) && reelProductId > 0 && reelProductId === parsedProductId;
                        });
                    }
                    return false;
                });
                
                setReels(filteredReels);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading product reels:', error);
            toast.error('Failed to load reels: ' + error.message);
            setLoading(false);
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

    // Function to render video player for a reel
    const renderVideoPlayer = (reel) => {
        if (!reel.video_url || reel.video_url === 'null' || reel.video_url === 'undefined') {
            return (
                <div className="ratio ratio-16x9 bg-dark rounded d-flex align-items-center justify-content-center">
                    <div className="text-white">No video available</div>
                </div>
            );
        }
        try {
            new URL(reel.video_url);
        } catch {
            return (
                <div className="ratio ratio-16x9 bg-dark rounded d-flex align-items-center justify-content-center">
                    <div className="text-white">Invalid video URL</div>
                </div>
            );
        }
        return (
            <div className="video-player-container">
                <div className="ratio ratio-16x9 bg-dark rounded">
                    <video 
                        width="100%" 
                        height="100%" 
                        controls
                        poster={reel.thumbnail || ''}
                        style={{ objectFit: 'cover' }}
                        className="rounded w-100 h-100"
                        onError={(e) => {
                            console.error('Video loading error:', e);
                        }}
                    >
                        <source src={reel.video_url} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>
                <div className="mt-2">
                    <h6 className="mb-1 text-truncate" title={reel.title}>{reel.title}</h6>
                    <p className="text-muted small mb-0 d-flex justify-content-between align-items-center">
                        <span>
                            <span className="me-2">{getStatusBadge(reel.status)}</span>
                            {/* <span>{new Date(reel.created_at).toLocaleDateString()}</span> */}
                        </span>
                        <span>
                            <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate(`/studio/seller/upload/${reel.id}`)}
                            >
                                <i className="ri-edit-line me-1"></i> Edit
                            </button>
                        </span>
                    </p>
                    <div className="mt-1">
                        <span className="text-muted">category: {reel.category_name || 'Uncategorized'}</span>
                    </div>
                    <div className="mt-1">
                        <span className="text-muted">date: {new Date(reel.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="d-flex gap-3 mt-1">
                        <span className="text-muted">
                            <i className="ri-eye-line me-1"></i>
                            {reel.views || 0} Views
                        </span>
                        <span className="text-muted">
                            <i className="ri-heart-line me-1"></i>
                            {reel.likes || 0} Likes
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box d-flex align-items-center justify-content-between">
                    <h4 className="page-title mb-0">Reels for {productName}</h4>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h5 className="card-title mb-0">Product Reels</h5>
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => navigate(-1)}
                        >
                            <i className="ri-arrow-left-line me-1"></i> Back
                        </button>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : reels.length === 0 ? (
                            <div className="text-center py-5">
                                <h5>No reels found for this product</h5>
                                <p className="text-muted">There are no reels associated with {productName}.</p>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => navigate(-1)}
                                >
                                    <i className="ri-arrow-left-line me-1"></i> Back to All Reels
                                </button>
                            </div>
                        ) : (
                            <>
                            <div className="row">
                                {reels.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((reel) => (
                                    <div key={reel.id} className="col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-4">
                                        <div className="card h-100 shadow-sm border-0 rounded">
                                            <div className="card-body p-3">
                                                {renderVideoPlayer(reel)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-3">
                                <div className="text-muted">{(() => {
                                    const total = reels.length;
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
                                    {Array.from({ length: Math.ceil(reels.length / pageSize) || 1 }, (_, i) => i + 1).map(page => (
                                        <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${currentPage >= Math.ceil(reels.length / pageSize) ? 'disabled' : ''}`}>
                                        <button className="page-link" aria-label="Next" onClick={() => setCurrentPage(p => Math.min(Math.ceil(reels.length / pageSize) || 1, p + 1))}>
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
