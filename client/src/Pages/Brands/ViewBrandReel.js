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

    useEffect(() => {
        if (id) {
            loadReelDetails();
        }
    }, [id]);

    const loadReelDetails = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await ApiService.getReelById(id);
            
            if (response.success) {
                setReel(response.data);
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
                    <button className="btn btn-primary" onClick={() => navigate('/brands/reels')}>
                        Back to Brand Reels
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
                    <button className="btn btn-primary" onClick={() => navigate('/brands/reels')}>
                        Back to Brand Reels
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h4 className="card-title mb-0">Brand Reel Details</h4>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/brands/reels')}>
                            <i data-lucide="arrow-left"></i>&nbsp;Back
                        </button>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <h5>Basic Information</h5>
                                <table className="table table-borderless">
                                    <tbody>
                                        <tr>
                                            <td><strong>Title:</strong></td>
                                            <td>{reel.title || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Description:</strong></td>
                                            <td>{reel.description || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Category:</strong></td>
                                            <td>{reel.category_name || 'N/A'}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Status:</strong></td>
                                            <td>
                                                <span className={`badge ${reel.status === 'approved' ? 'bg-success' : reel.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>
                                                    {reel.status || 'pending'}
                                                </span>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Created At:</strong></td>
                                            <td>{new Date(reel.created_at).toLocaleString() || 'N/A'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="col-md-6">
                                <h5>Media</h5>
                                {reel.video_url ? (
                                    <div className="mb-3">
                                        <label className="form-label"><strong>Video:</strong></label>
                                        <div>
                                            <video 
                                                src={reel.video_url} 
                                                controls 
                                                className="img-fluid rounded"
                                                style={{ maxHeight: '200px' }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p>No video available</p>
                                )}
                                
                                {reel.thumbnail ? (
                                    <div>
                                        <label className="form-label"><strong>Thumbnail:</strong></label>
                                        <div>
                                            <img 
                                                src={reel.thumbnail} 
                                                alt="Thumbnail" 
                                                className="img-fluid rounded"
                                                style={{ maxHeight: '200px' }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p>No thumbnail available</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="row mt-4">
                            <div className="col-12">
                                <h5>Associated Products</h5>
                                {reel.product_ids && reel.product_ids.length > 0 ? (
                                    <div>
                                        <p>Product IDs: {reel.product_ids.join(', ')}</p>
                                        {/* In a full implementation, you would fetch and display product names */}
                                    </div>
                                ) : (
                                    <p>No products associated with this reel</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}