import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../../Services/ApiService';
import { toast } from 'react-toastify';

export default function InfluencerDashboard() {
    const [stats, setStats] = useState({
        totalReels: 0,
        approvedReels: 0,
        pendingReels: 0,
        rejectedReels: 0
    });
    const [recentReels, setRecentReels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        loadDashboardData();
        
        // Listen for theme changes
        const handleThemeChange = () => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        };
        
        document.addEventListener('themeChange', handleThemeChange);
        
        // Cleanup
        return () => {
            document.removeEventListener('themeChange', handleThemeChange);
        };
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // Fetch influencer reels
            const response = await ApiService.getInfluencerReels();
            
            if (response.success) {
                const reels = response.data;
                
                // Calculate stats
                const totalReels = reels.length;
                const approvedReels = reels.filter(reel => reel.status === 'approved').length;
                const pendingReels = reels.filter(reel => reel.status === 'pending').length;
                const rejectedReels = reels.filter(reel => reel.status === 'rejected').length;
                
                setStats({
                    totalReels,
                    approvedReels,
                    pendingReels,
                    rejectedReels
                });
                
                // Get recent reels (last 3)
                const recent = reels.slice(0, 3);
                setRecentReels(recent);
            } else {
                toast.error('Failed to load dashboard data: ' + response.message);
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            toast.error('Failed to load dashboard data: ' + error.message);
            
            // Fallback to sample data in case of error
            setTimeout(() => {
                setStats({
                    totalReels: 24,
                    approvedReels: 18,
                    pendingReels: 4,
                    rejectedReels: 2
                });
                
                setRecentReels([
                    {
                        id: 1,
                        title: 'Summer Fashion Trends',
                        category_name: 'Fashion',
                        status: 'approved',
                        created_at: '2023-06-15T10:30:00Z'
                    },
                    {
                        id: 2,
                        title: 'Cooking Pasta Recipe',
                        category_name: 'Food',
                        status: 'pending',
                        created_at: '2023-06-18T14:15:00Z'
                    },
                    {
                        id: 3,
                        title: 'Home Workout Routine',
                        category_name: 'Fitness',
                        status: 'approved',
                        created_at: '2023-06-10T09:45:00Z'
                    }
                ]);
            }, 500);
        } finally {
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

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box d-flex align-items-center justify-content-between">
                    <h4 className="page-title mb-0">Influencer Dashboard</h4>
                </div>
            </div>

            <div className="col-xl-3 col-md-6">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex">
                            <div className="flex-grow-1">
                                <p className="text-muted mb-1">Total Reels</p>
                                <h4 className="mb-0">{stats.totalReels}</h4>
                            </div>
                            <div className="flex-shrink-0 avatar-md rounded-circle bg-soft-primary">
                                <div className="avatar-title fs-24 text-primary">
                                    <i className="ri-film-line"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-xl-3 col-md-6">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex">
                            <div className="flex-grow-1">
                                <p className="text-muted mb-1">Approved</p>
                                <h4 className="mb-0">{stats.approvedReels}</h4>
                            </div>
                            <div className="flex-shrink-0 avatar-md rounded-circle bg-soft-success">
                                <div className="avatar-title fs-24 text-success">
                                    <i className="ri-checkbox-circle-line"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-xl-3 col-md-6">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex">
                            <div className="flex-grow-1">
                                <p className="text-muted mb-1">Pending Review</p>
                                <h4 className="mb-0">{stats.pendingReels}</h4>
                            </div>
                            <div className="flex-shrink-0 avatar-md rounded-circle bg-soft-warning">
                                <div className="avatar-title fs-24 text-warning">
                                    <i className="ri-time-line"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-xl-3 col-md-6">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex">
                            <div className="flex-grow-1">
                                <p className="text-muted mb-1">Rejected</p>
                                <h4 className="mb-0">{stats.rejectedReels}</h4>
                            </div>
                            <div className="flex-shrink-0 avatar-md rounded-circle bg-soft-danger">
                                <div className="avatar-title fs-24 text-danger">
                                    <i className="ri-close-circle-line"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h5 className="card-title mb-0">Recent Reels</h5>
                        <Link to="/studio/influencer/reels" className="btn btn-soft-primary">
                            View All
                        </Link>
                    </div>
                    <div className="card-body">
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
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Status</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentReels.map((reel) => (
                                            <tr key={reel.id}>
                                                <td>{reel.title}</td>
                                                <td>{reel.category_name || 'N/A'}</td>
                                                <td>
                                                    {getStatusBadge(reel.status)}
                                                </td>
                                                <td>{formatDate(reel.created_at)}</td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm btn-soft-info"
                                                        onClick={() => window.open(`/studio/influencer/upload/${reel.id}/details`, '_blank')}
                                                    >
                                                        <i className="ri-eye-line"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">Quick Actions</h5>
                    </div>
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-3 col-6">
                                <Link to="/studio/influencer/upload" className="btn btn-outline-success w-100">
                                    <i className="ri-upload-line me-1"></i> Upload Reel
                                </Link>
                            </div>
                            <div className="col-md-3 col-6">
                                <Link to="/studio/influencer/reels" className="btn btn-outline-primary w-100">
                                    <i className="ri-film-line me-1"></i> My Reels
                                </Link>
                            </div>
                            <div className="col-md-3 col-6">
                                <Link to="/studio/influencer/profile" className="btn btn-outline-secondary w-100">
                                    <i className="ri-user-line me-1"></i> My Profile
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}