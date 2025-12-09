import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function ReelDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [reel, setReel] = useState(null);
    const [loading, setLoading] = useState(true);
    const [productNames, setProductNames] = useState({});
    const [brands, setBrands] = useState([]);

    useEffect(() => {
        if (id) {
            loadReelDetails();
        }
    }, [id]);

    const loadReelDetails = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getReelById(id);
            
            if (response.success) {
                // No need to construct full URLs anymore since server now returns correct paths
                setReel(response.data);
                console.log('Reel data loaded:', response.data);
                console.log('Video URL:', response.data.video_url);
                
                // Load product names if there are product IDs
                if (response.data.product_ids && response.data.product_ids.length > 0) {
                    await loadProductNames(response.data.product_ids);
                }
            } else {
                toast.error('Failed to load reel details: ' + response.message);
            }
        } catch (error) {
            console.error('Error loading reel details:', error);
            toast.error('Failed to load reel details: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const loadBrands = async () => {
        try {
            const response = await ApiService.getBrands();
            if (response.success) {
                setBrands(response.data);
            }
        } catch {}
    };

    useEffect(() => {
        loadBrands();
    }, []);

    const loadProductNames = async (productIds) => {
        try {
            const response = await ApiService.getProductNamesByIds(productIds);
            
            if (response.success) {
                setProductNames(response.data);
            } else {
                toast.error('Failed to load product names: ' + response.message);
            }
        } catch (error) {
            console.error('Error loading product names:', error);
            toast.error('Failed to load product names: ' + error.message);
        }
    };

    const handleBack = () => {
        navigate('/studio/influencer/upload');
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box d-flex align-items-center justify-content-between py-3">
                            <h4 className="mb-0">Reel Details</h4>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body text-center">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading reel details...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!reel) {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box d-flex align-items-center justify-content-between py-3">
                            <h4 className="mb-0">Reel Details</h4>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body text-center">
                                <p className="text-danger">Reel not found</p>
                                <button className="btn btn-primary" onClick={handleBack}>
                                    Back to Uploads
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-flex align-items-center justify-content-between py-3">
                        <h4 className="mb-0">Reel Details</h4>
                        <button className="btn btn-secondary" onClick={handleBack}>
                            <i className="mdi mdi-arrow-left me-1"></i>Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">{reel.title}</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {/* Reel Information Section */}
                                <div className="col-lg-6 mb-4">
                                    <div className="card h-100">
                                        <div className="card-header">
                                            <h6 className="mb-0">Reel Information</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="table-responsive">
                                                <table className="table table-bordered">
                                                    <tbody>
                                                        <tr>
                                                            <td className="fw-bold">Title</td>
                                                            <td>{reel.title}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-bold">Description</td>
                                                            <td>{reel.description || 'No description provided'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-bold">Category</td>
                                                            <td>{reel.category_name || 'Not categorized'}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-bold">Status</td>
                                                            <td>
                                                                <span className={`badge ${reel.status === 'approved' ? 'bg-success' : reel.status === 'pending' ? 'bg-warning' : 'bg-danger'}`}>
                                                                    {reel.status?.charAt(0).toUpperCase() + reel.status?.slice(1) || 'Unknown'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-bold">Uploaded On</td>
                                                            <td>{formatDate(reel.created_at)}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="fw-bold">Brand Association</td>
                                                            <td>{reel.brand_id ? `Brand: ${brands.find(b => String(b.id) === String(reel.brand_id))?.name || reel.brand_id}` : 'None'}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Video Preview Section - Moved to Right Side */}
                                <div className="col-lg-6 mb-4">
                                    <div className="card h-100">
                                        <div className="card-header">
                                            <h6 className="mb-0">Video Preview</h6>
                                        </div>
                                        <div className="card-body">
                                            <div className="ratio ratio-16x9 bg-dark rounded">
                                                {reel.video_url && reel.video_url !== 'null' && reel.video_url !== 'undefined' ? (
                                                    <div>
                                                        <video 
                                                            src={reel.video_url} 
                                                            controls 
                                                            className="rounded"
                                                            poster={reel.thumbnail || ''}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            playsInline
                                                            preload="metadata"
                                                            onError={(e) => {
                                                                console.error('Video error:', e);
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
                                                ) : (
                                                    <div className="d-flex align-items-center justify-content-center h-100">
                                                        <p className="m-0 text-white">No video available</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Associated Products Section */}
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <h6 className="mb-0">Associated Products ({reel.product_ids?.length || 0})</h6>
                                        </div>
                                        <div className="card-body">
                                            {reel.product_ids && reel.product_ids.length > 0 ? (
                                                <div className="table-responsive">
                                                    <table className="table table-striped table-bordered">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th scope="col">#</th>
                                                                <th scope="col">Product ID</th>
                                                                <th scope="col">Product Name</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {reel.product_ids.map((productId, index) => (
                                                                <tr key={index}>
                                                                    <th scope="row">{index + 1}</th>
                                                                    <td>{productId}</td>
                                                                    <td>{productNames[productId] || `Product #${productId}`}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="alert alert-info">
                                                    <i className="mdi mdi-information-outline me-1"></i>
                                                    No products associated with this reel
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
