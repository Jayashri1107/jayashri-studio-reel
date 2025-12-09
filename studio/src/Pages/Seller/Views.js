import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function SellerViews() {
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('7days');

    useEffect(() => {
        loadViewsData();
    }, [timeRange]);

    const loadViewsData = async () => {
        try {
            setLoading(true);
            
            // Get the vendor ID from the authenticated user
            const user = JSON.parse(localStorage.getItem('studioUser'));
            const vendorId = user?.vendor_id;
            
            if (!vendorId) {
                toast.error('Unable to load views data: User not authenticated');
                setLoading(false);
                return;
            }
            
            // Fetch actual seller reels
            const response = await ApiService.getSellerReels(vendorId);
            if (response.success) {
                setReels(response.data);
            } else {
                toast.error('Failed to load views data: ' + response.message);
            }
        } catch (error) {
            console.error('Error loading views data:', error);
            toast.error('Failed to load views data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/studio/seller/profile');
    };

    const handleTimeRangeChange = (range) => {
        setTimeRange(range);
    };

    const getTotalViews = () => {
        return reels.reduce((sum, reel) => sum + (reel.views || 0), 0);
    };

    const getTotalLikes = () => {
        return reels.reduce((sum, reel) => sum + (reel.likes || 0), 0);
    };

    const getTotalComments = () => {
        return reels.reduce((sum, reel) => sum + (reel.comments || 0), 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box d-flex align-items-center justify-content-between py-3">
                            <h4 className="mb-0">Views Analytics</h4>
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
                                <p className="mt-2">Loading analytics data...</p>
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
                        <h4 className="mb-0">Views Analytics</h4>
                        <button className="btn btn-secondary" onClick={handleBack}>
                            <i className="mdi mdi-arrow-left me-1"></i>Back to Profile
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row">
                <div className="col-md-4">
                    <div className="card bg-primary bg-opacity-10 border-primary border-opacity-25">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0 bg-primary bg-opacity-25 rounded p-2">
                                    <i className="ri-eye-line ri-lg text-primary"></i>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h5 className="mb-1">{getTotalViews().toLocaleString()}</h5>
                                    <p className="mb-0 text-muted">Total Views</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-success bg-opacity-10 border-success border-opacity-25">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0 bg-success bg-opacity-25 rounded p-2">
                                    <i className="ri-thumb-up-line ri-lg text-success"></i>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h5 className="mb-1">{getTotalLikes().toLocaleString()}</h5>
                                    <p className="mb-0 text-muted">Total Likes</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-info bg-opacity-10 border-info border-opacity-25">
                        <div className="card-body">
                            <div className="d-flex align-items-center">
                                <div className="flex-shrink-0 bg-info bg-opacity-25 rounded p-2">
                                    <i className="ri-chat-1-line ri-lg text-info"></i>
                                </div>
                                <div className="flex-grow-1 ms-3">
                                    <h5 className="mb-1">{getTotalComments().toLocaleString()}</h5>
                                    <p className="mb-0 text-muted">Total Comments</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reels Data Table */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Reels Performance ({reels.length} posts)</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-centered table-nowrap mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Title</th>
                                            <th>Views</th>
                                            <th>Likes</th>
                                            <th>Comments</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reels.map((reel) => (
                                            <tr key={reel.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="flex-shrink-0 me-3">
                                                            {reel.thumbnail ? (
                                                                <img 
                                                                    src={reel.thumbnail} 
                                                                    alt={reel.title} 
                                                                    className="rounded avatar-sm"
                                                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                <div className="avatar-sm d-flex align-items-center justify-content-center bg-light rounded">
                                                                    <i className="ri-video-line text-muted"></i>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-0 text-truncate" style={{ maxWidth: '200px' }}>{reel.title}</h6>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="text-primary">{(reel.views || 0).toLocaleString()}</span>
                                                </td>
                                                <td>
                                                    <span className="text-success">{(reel.likes || 0).toLocaleString()}</span>
                                                </td>
                                                <td>
                                                    <span className="text-info">{(reel.comments || 0).toLocaleString()}</span>
                                                </td>
                                                <td>{formatDate(reel.created_at)}</td>
                                                <td>
                                                    <span className={`badge ${reel.status === 'approved' ? 'bg-success' : reel.status === 'pending' ? 'bg-warning' : 'bg-danger'}`}>
                                                        {reel.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}