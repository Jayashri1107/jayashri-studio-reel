import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function SellerPosts() {
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReels();
    }, []);

    const loadReels = async () => {
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
            
            const response = await ApiService.getSellerReels(vendorId);
            if (response.success) {
                setReels(response.data);
            } else {
                toast.error('Failed to load reels: ' + response.message);
            }
        } catch (error) {
            console.error('Error loading reels:', error);
            toast.error('Failed to load reels: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/studio/seller/profile');
    };

    const handleDeleteReel = async (reelId) => {
        if (window.confirm('Are you sure you want to delete this reel?')) {
            try {
                const response = await ApiService.deleteReel(reelId);
                if (response.success) {
                    toast.success('Reel deleted successfully');
                    loadReels();
                } else {
                    toast.error('Failed to delete reel: ' + response.message);
                }
            } catch (error) {
                console.error('Error deleting reel:', error);
                toast.error('Failed to delete reel: ' + error.message);
            }
        }
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box d-flex align-items-center justify-content-between py-3">
                            <h4 className="mb-0">My Posts</h4>
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
                                <p className="mt-2">Loading your posts...</p>
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
                        <h4 className="mb-0">My Posts</h4>
                        <button className="btn btn-secondary" onClick={handleBack}>
                            <i className="mdi mdi-arrow-left me-1"></i>Back to Profile
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Uploaded Videos ({reels.length} posts)</h5>
                        </div>
                        <div className="card-body">
                            {reels.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="ri-video-line ri-3x text-muted mb-3"></i>
                                    <h5>No posts yet</h5>
                                    <p className="text-muted">Upload your first reel to get started</p>
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => navigate('/studio/seller/upload')}
                                    >
                                        Upload Reel
                                    </button>
                                </div>
                            ) : (
                                <div className="row">
                                    {reels.map((reel) => (
                                        <div key={reel.id} className="col-md-6 col-lg-4 mb-4">
                                            <div className="card h-100">
                                                <div className="ratio ratio-16x9 bg-dark rounded-top">
                                                    {reel.video_url && reel.video_url !== 'null' && reel.video_url !== 'undefined' ? (
                                                        <video 
                                                            src={reel.video_url} 
                                                            className="rounded-top"
                                                            poster={reel.thumbnail || ''}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            playsInline
                                                            preload="metadata"
                                                            controls
                                                        />
                                                    ) : (
                                                        <div className="d-flex align-items-center justify-content-center h-100">
                                                            <i className="ri-video-line ri-2x text-white"></i>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="card-body">
                                                    <h6 className="card-title text-truncate">{reel.title}</h6>
                                                    <p className="card-text text-muted small text-truncate">
                                                        {reel.description || 'No description'}
                                                    </p>
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <span className="badge bg-primary">{reel.category_name || 'Uncategorized'}</span>
                                                        <span className={`badge ${reel.status === 'approved' ? 'bg-success' : reel.status === 'pending' ? 'bg-warning' : 'bg-danger'}`}>
                                                            {reel.status}
                                                        </span>
                                                    </div>
                                                    <div className="d-flex justify-content-between text-muted small">
                                                        <span>
                                                            <i className="ri-eye-line me-1"></i>
                                                            {reel.views?.toLocaleString() || '0'}
                                                        </span>
                                                        <span>
                                                            <i className="ri-thumb-up-line me-1"></i>
                                                            {reel.likes?.toLocaleString() || '0'}
                                                        </span>
                                                        <span>
                                                            <i className="ri-chat-1-line me-1"></i>
                                                            {reel.comments?.toLocaleString() || '0'}
                                                        </span>
                                                    </div>
                                                    <div className="text-muted small mt-2">
                                                        <i className="ri-calendar-line me-1"></i>
                                                        {reel.created_at ? new Date(reel.created_at).toLocaleDateString() : 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="card-footer">
                                                    <div className="d-flex justify-content-between">
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => navigate(`/studio/seller/upload/${reel.id}`)}
                                                        >
                                                            <i className="ri-edit-line me-1"></i>Edit
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDeleteReel(reel.id)}
                                                        >
                                                            <i className="ri-delete-bin-line me-1"></i>Delete
                                                        </button>
                                                    </div>
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
        </div>
    );
}