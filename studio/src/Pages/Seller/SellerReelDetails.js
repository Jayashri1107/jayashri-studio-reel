import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiService from '../../Services/ApiService';
import { toast } from 'react-toastify';

export default function SellerReelDetails() {
    const [reel, setReel] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        loadReelDetails();
    }, [id]);

    const loadReelDetails = async () => {
        try {
            setLoading(true);
            
            // Parse the reel ID as integer
            const parsedId = parseInt(id);
            
            if (isNaN(parsedId) || parsedId <= 0) {
                toast.error('Invalid reel ID');
                setLoading(false);
                return;
            }
            
            // Get reel details from API
            const response = await ApiService.getReelById(parsedId);
            
            if (response.success) {
                setReel(response.data);
            } else {
                toast.error(response.message || 'Failed to load reel details');
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading reel details:', error);
            toast.error('Failed to load reel details: ' + error.message);
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
        // Construct full URLs for video and thumbnail
        const baseUrl = window.location.origin;
        let fullVideoUrl = reel.video_url;
        let fullThumbnailUrl = reel.thumbnail;
        
        // Handle relative URLs
        if (reel.video_url && !reel.video_url.startsWith('http')) {
            fullVideoUrl = `${baseUrl}${reel.video_url}`;
        }
        
        if (reel.thumbnail && !reel.thumbnail.startsWith('http')) {
            fullThumbnailUrl = `${baseUrl}${reel.thumbnail}`;
        }
        
        if (!fullVideoUrl) {
            return <div className="alert alert-warning">No video available for this reel</div>;
        }
        
        return (
            <div className="video-player-container mb-4">
                <video 
                    width="100%" 
                    height="300" 
                    controls
                    poster={fullThumbnailUrl || ''}
                    className="rounded"
                >
                    <source src={fullVideoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            </div>
        );
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box d-flex align-items-center justify-content-between">
                    <h4 className="page-title mb-0">Reel Details</h4>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h5 className="card-title mb-0">Reel Information</h5>
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
                        ) : !reel ? (
                            <div className="text-center py-5">
                                <h5>Reel not found</h5>
                                <p className="text-muted">The requested reel could not be found.</p>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => navigate(-1)}
                                >
                                    <i className="ri-arrow-left-line me-1"></i> Back
                                </button>
                            </div>
                        ) : (
                            <div className="row">
                                <div className="col-md-6">
                                    {renderVideoPlayer(reel)}
                                </div>
                                <div className="col-md-6">
                                    <div className="table-responsive">
                                        <table className="table table-bordered">
                                            <tbody>
                                                <tr>
                                                    <th scope="row" style={{width: '30%'}}>Title</th>
                                                    <td>{reel.title}</td>
                                                </tr>
                                                <tr>
                                                    <th scope="row">Category</th>
                                                    <td>{reel.category_name || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <th scope="row">Status</th>
                                                    <td>{getStatusBadge(reel.status)}</td>
                                                </tr>
                                                <tr>
                                                    <th scope="row">Views</th>
                                                    <td>{reel.views || 0}</td>
                                                </tr>
                                                <tr>
                                                    <th scope="row">Likes</th>
                                                    <td>{reel.likes || 0}</td>
                                                </tr>
                                                <tr>
                                                    <th scope="row">Date</th>
                                                    <td>{reel.created_at ? new Date(reel.created_at).toLocaleDateString() : 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <th scope="row">Video Path</th>
                                                    <td>
                                                        <small className="text-muted">
                                                            {reel.video_url || 'N/A'}
                                                        </small>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div className="mt-3">
                                        <button 
                                            className="btn btn-primary"
                                            onClick={() => navigate(`/studio/seller/upload/${reel.id}`)}
                                        >
                                            <i className="ri-edit-line me-1"></i> Edit Reel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}