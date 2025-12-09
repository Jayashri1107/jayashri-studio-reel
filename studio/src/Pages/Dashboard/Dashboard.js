import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function StudioDashboard() {
    const [stats, setStats] = useState({
        totalReels: 0,
        approvedReels: 0,
        pendingReels: 0,
        rejectedReels: 0
    });

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Simulate loading stats
        setTimeout(() => {
            setStats({
                totalReels: 24,
                approvedReels: 18,
                pendingReels: 4,
                rejectedReels: 2
            });
        }, 500);
    }, []);

    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box d-flex align-items-center justify-content-between">
                    <h4 className="page-title mb-0">Studio Dashboard</h4>
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
                        <Link to="/studio/reels" className="btn btn-soft-primary">
                            View All
                        </Link>
                    </div>
                    <div className="card-body">
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
                                    <tr>
                                        <td>Summer Fashion Trends</td>
                                        <td>Fashion</td>
                                        <td>
                                            <span className="badge bg-success">Approved</span>
                                        </td>
                                        <td>2023-06-15</td>
                                        <td>
                                            <button className="btn btn-sm btn-soft-info">
                                                <i className="ri-eye-line"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Cooking Pasta Recipe</td>
                                        <td>Food</td>
                                        <td>
                                            <span className="badge bg-warning">Pending</span>
                                        </td>
                                        <td>2023-06-18</td>
                                        <td>
                                            <button className="btn btn-sm btn-soft-info">
                                                <i className="ri-eye-line"></i>
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Home Workout Routine</td>
                                        <td>Fitness</td>
                                        <td>
                                            <span className="badge bg-success">Approved</span>
                                        </td>
                                        <td>2023-06-10</td>
                                        <td>
                                            <button className="btn btn-sm btn-soft-info">
                                                <i className="ri-eye-line"></i>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
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
                                <Link to="/studio/upload" className="btn btn-outline-success w-100">
                                    <i className="ri-upload-line me-1"></i> Upload Reel
                                </Link>
                            </div>
                            <div className="col-md-3 col-6">
                                <Link to="/studio/reels" className="btn btn-outline-primary w-100">
                                    <i className="ri-film-line me-1"></i> My Reels
                                </Link>
                            </div>
                            <div className="col-md-3 col-6">
                                <Link to="/studio/profile" className="btn btn-outline-info w-100">
                                    <i className="ri-user-line me-1"></i> My Profile
                                </Link>
                            </div>
                            <div className="col-md-3 col-6">
                                <Link to="/studio/settings" className="btn btn-outline-secondary w-100">
                                    <i className="ri-settings-line me-1"></i> Settings
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}