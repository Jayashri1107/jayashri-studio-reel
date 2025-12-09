import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function InfluencerReelsAll() {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Simulate loading reels
        setTimeout(() => {
            setReels([
                {
                    id: 1,
                    title: 'Summer Fashion Trends',
                    category: 'Fashion',
                    status: 'approved',
                    views: 1250,
                    likes: 342,
                    date: '2023-06-15'
                },
                {
                    id: 2,
                    title: 'Cooking Pasta Recipe',
                    category: 'Food',
                    status: 'pending',
                    views: 0,
                    likes: 0,
                    date: '2023-06-18'
                },
                {
                    id: 3,
                    title: 'Home Workout Routine',
                    category: 'Fitness',
                    status: 'approved',
                    views: 2100,
                    likes: 567,
                    date: '2023-06-10'
                },
                {
                    id: 4,
                    title: 'Travel Vlog: Paris',
                    category: 'Travel',
                    status: 'rejected',
                    views: 0,
                    likes: 0,
                    date: '2023-06-05'
                }
            ]);
            setLoading(false);
        }, 500);
    }, []);

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
                        <Link to="/studio/influencer/upload" className="btn btn-success">
                            <i className="ri-add-line me-1"></i> Upload Reel
                        </Link>
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
                                <h5>No reels found</h5>
                                <p className="text-muted">Upload your first reel to get started.</p>
                                <Link to="/studio/influencer/upload" className="btn btn-success">
                                    <i className="ri-upload-line me-1"></i> Upload Reel
                                </Link>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Status</th>
                                            <th>Views</th>
                                            <th>Likes</th>
                                            <th>Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reels.map((reel) => (
                                            <tr key={reel.id}>
                                                <td>{reel.title}</td>
                                                <td>{reel.category}</td>
                                                <td>{getStatusBadge(reel.status)}</td>
                                                <td>{reel.views}</td>
                                                <td>{reel.likes}</td>
                                                <td>{reel.date}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-soft-info me-1">
                                                        <i className="ri-eye-line"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-soft-warning me-1">
                                                        <i className="ri-edit-line"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-soft-danger">
                                                        <i className="ri-delete-bin-line"></i>
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
        </div>
    );
}