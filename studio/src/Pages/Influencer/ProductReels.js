import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ApiService from '../../Services/ApiService';

export default function ProductReels() {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productName, setProductName] = useState('');
    const { productId } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        loadProductReels();
    }, [productId]);

    const loadProductReels = async () => {
        try {
            setLoading(true);
            
            // First, get the product name
            const productNamesResponse = await ApiService.getProductNamesByIds([parseInt(productId)]);
            if (productNamesResponse.success && productNamesResponse.data[productId]) {
                setProductName(productNamesResponse.data[productId]);
            } else {
                setProductName(`Product ${productId}`);
            }
            
            // Get all influencer reels (we'll filter on the frontend)
            const response = await ApiService.getInfluencerReels();
            if (response.success) {
                // Filter reels that contain this product ID
                const filteredReels = response.data.filter(reel => 
                    reel.product_ids && reel.product_ids.includes(parseInt(productId))
                );

                // Fetch detailed info per reel to ensure accurate category
                const detailedReels = await Promise.all(filteredReels.map(async (reel) => {
                    try {
                        const detail = await ApiService.getReelById(reel.id);
                        if (detail.success && detail.data) {
                            return {
                                ...reel,
                                category_name: detail.data.category_name || reel.category_name,
                            };
                        }
                        return reel;
                    } catch (e) {
                        return reel;
                    }
                }));

                setReels(detailedReels);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading product reels:', error);
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
        // Check if video URL exists and is valid
        if (!reel.video_url || reel.video_url === 'null' || reel.video_url === 'undefined') {
            return (
                <div className="ratio ratio-16x9 bg-dark rounded d-flex align-items-center justify-content-center">
                    <div className="text-white">No video available</div>
                </div>
            );
        }
        
        // Additional check for URL validity
        try {
            new URL(reel.video_url);
        } catch (e) {
            console.error('Invalid video URL:', reel.video_url);
            return (
                <div className="ratio ratio-16x9 bg-dark rounded d-flex align-items-center justify-content-center">
                    <div className="text-white">Invalid video URL</div>
                </div>
            );
        }
        
        return (
            <div className="video-player-container mb-2">
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
                            console.log('Video URL that failed:', reel.video_url);
                        }}
                        onLoadedData={(e) => {
                            console.log('Video loaded successfully');
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
                        {/* Edit button inline with status and date */}
                        <span>
                            <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => navigate(`/studio/influencer/upload/${reel.id}`)}
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
                    {/* View and Like counts */}
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
                            <div className="row">
                                {/* Display videos in a grid with 4 per line */}
                                {reels.map((reel) => (
                                    <div key={reel.id} className="col-xl-3 col-lg-4 col-md-6 col-sm-12 mb-4">
                                        <div className="card h-100 shadow-sm border-0 rounded">
                                            <div className="card-body p-3">
                                                {renderVideoPlayer(reel)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
