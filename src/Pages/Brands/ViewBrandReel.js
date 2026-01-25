import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function ViewBrandReel() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [reel, setReel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        if (id) {
            loadReelDetails();
        }
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [id]);
    
    useEffect(() => {
        if (window.lucide) {
            setTimeout(() => {
                window.lucide.createIcons();
            }, 100);
        }
    }, [products]);

    const loadReelDetails = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await ApiService.getReelById(id);
            
            if (response.success) {
                setReel(response.data);
                
                // Load product details if product IDs are available
                let productIds = [];
                if (response.data.product_ids && Array.isArray(response.data.product_ids)) {
                    // Filter out duplicates and null/undefined values
                    productIds = [...new Set(response.data.product_ids)].filter(id => id);
                } else if (response.data.product_id) {
                    // Handle single product_id (backward compatibility)
                    const pid = parseInt(response.data.product_id);
                    if (!isNaN(pid)) {
                        productIds = [pid];
                    }
                }
                
                if (productIds.length > 0) {
                    await loadProductDetails(productIds);
                }
            } else {
                setError(response.message || 'Failed to load reel details');
                toast.error(response.message || 'Failed to load reel details');
            }
        } catch (error) {
            console.error('Error loading reel details:', error);
            setError('Failed to load reel details');
            toast.error('Failed to load reel details: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const loadProductDetails = async (productIds) => {
        try {
            setLoadingProducts(true);
            const response = await ApiService.getProductNamesByIds(productIds);
            
            if (response.success && response.data) {
                // response.data is now an array, map product IDs to products
                const productsList = productIds.map(pid => {
                    const productData = response.data.find(p => p.id == pid || p.product_id == pid);
                    return {
                        id: pid,
                        name: productData ? (productData.name || productData.product_name || 'Unknown Product') : 'Unknown Product'
                    };
                });
                setProducts(productsList);
            } else {
                // Fallback: create products list with just IDs if names can't be fetched
                setProducts(productIds.map(pid => ({ id: pid, name: 'N/A' })));
            }
        } catch (error) {
            console.error('Error loading product details:', error);
            // Fallback: show products with just IDs, but try to extract names if available
            if (error.response && error.response.data && error.response.data.data && Array.isArray(error.response.data.data)) {
                const productsList = productIds.map(pid => {
                    const productData = error.response.data.data.find(p => p.id == pid || p.product_id == pid);
                    return {
                        id: pid,
                        name: productData ? (productData.name || 'Unknown Product') : 'N/A'
                    };
                });
                setProducts(productsList);
            } else {
                setProducts(productIds.map(pid => ({ id: pid, name: 'N/A' })));
            }
        } finally {
            setLoadingProducts(false);
        }
    };

    if (loading) {
        return (
            <div className="container py-5">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger">
                    <h4>Error</h4>
                    <p>{error}</p>
                    <button className="btn btn-outline-secondary" onClick={() => navigate('/brands/reels')}>
                        <i className="ri-arrow-left-line align-bottom me-1"></i> Back
                    </button>
                </div>
            </div>
        );
    }

    if (!reel) {
        return (
            <div className="container py-5">
                <div className="alert alert-warning">
                    <h4>Reel Not Found</h4>
                    <p>No reel data available.</p>
                    <button className="btn btn-outline-secondary" onClick={() => navigate('/brands/reels')}>
                        <i className="ri-arrow-left-line align-bottom me-1"></i> Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Page Header */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="fw-bold mb-0">Reel Details</h4>
                <button className="btn btn-outline-secondary" onClick={() => navigate('/brands/reels')}>
                    <i className="ri-arrow-left-line align-bottom me-1"></i> Back
                </button>
            </div>

            <div className="card">
                <div className="card-body">
                    <h4 className="card-title mb-4 fw-bold">{reel.title || 'N/A'}</h4>
                    
                    <div className="row">
                        <div className="col-md-7">
                            <div className="card border shadow-none mb-4">
                                <div className="card-header bg-transparent border-bottom">
                                    <h5 className="card-title mb-0 fw-bold fs-15">Reel Information</h5>
                                </div>
                                <div className="card-body p-0">
                                    <table className="table table-borderless mb-0">
                                        <tbody>
                                            <tr className="border-bottom">
                                                <th className="ps-3 py-3" style={{ width: '150px' }}>Title</th>
                                                <td className="py-3">{reel.title || 'N/A'}</td>
                                            </tr>
                                            <tr className="border-bottom">
                                                <th className="ps-3 py-3">Description</th>
                                                <td className="py-3">{reel.description || 'N/A'}</td>
                                            </tr>
                                            <tr className="border-bottom">
                                                <th className="ps-3 py-3">Category</th>
                                                <td className="py-3">{reel.category_name || 'N/A'}</td>
                                            </tr>
                                            <tr className="border-bottom">
                                                <th className="ps-3 py-3">Status</th>
                                                <td className="py-3">
                                                    <span className={`badge ${reel.status === 'approved' ? 'bg-success' : reel.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>
                                                        {typeof reel.status === 'number' ? (reel.status === 1 ? 'approved' : reel.status === 2 ? 'rejected' : 'pending') : (reel.status || 'pending')}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr className="border-bottom">
                                                <th className="ps-3 py-3">Uploaded On</th>
                                                <td className="py-3">
                                                    {reel.created_at ? new Date(reel.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <th className="ps-3 py-3">Association</th>
                                                <td className="py-3">
                                                    {products.length > 0 ? 'Product' : 'Brand'}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            {products.length > 0 && (
                                <div className="card border shadow-none">
                                    <div className="card-header bg-transparent border-bottom">
                                        <h5 className="card-title mb-0 fw-bold fs-15">Associated Products</h5>
                                    </div>
                                    <div className="card-body p-0">
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="ps-3">ID</th>
                                                        <th>Product Name</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {products.map((product, index) => (
                                                        <tr key={product.id || index}>
                                                            <td className="ps-3">{product.id}</td>
                                                            <td>{product.name}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="col-md-5">
                            <div className="card border shadow-none mb-4">
                                <div className="card-header bg-transparent border-bottom">
                                    <h5 className="card-title mb-0 fw-bold fs-15">Video Preview</h5>
                                </div>
                                <div className="card-body">
                                    {reel.video_url ? (
                                        <video 
                                            src={reel.video_url} 
                                            controls 
                                            autoPlay 
                                            className="rounded" 
                                            poster={reel.thumbnail || reel.thumbnail_url} 
                                            playsInline 
                                            preload="metadata" 
                                            crossOrigin="anonymous" 
                                            style={{ width: '100%', objectFit: 'cover' }}
                                        >
                                            <source src={reel.video_url} type="video/mp4" />
                                            <source src={reel.video_url} type="video/webm" />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <div className="p-4 text-center bg-light rounded">
                                            <p className="text-muted mb-0">No video available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card border shadow-none">
                                <div className="card-header bg-transparent border-bottom">
                                    <h5 className="card-title mb-0 fw-bold fs-15">Thumbnail</h5>
                                </div>
                                <div className="card-body">
                                    {(reel.thumbnail || reel.thumbnail_url) ? (
                                        <img 
                                            src={reel.thumbnail || reel.thumbnail_url} 
                                            alt="Thumbnail" 
                                            className="img-fluid rounded"
                                            style={{ width: '100%', objectFit: 'contain' }}
                                        />
                                    ) : (
                                        <div className="p-4 text-center bg-light rounded">
                                            <p className="text-muted mb-0">No thumbnail available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}