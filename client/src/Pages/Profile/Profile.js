import React, { useEffect, useState } from 'react';
import api from '../../Config/axios';
import { toast } from 'react-toastify';

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Load user from localStorage first for immediate display
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Error parsing stored user:', e);
            }
        }
        
        // Then fetch fresh data from API
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/User/me');
            if (response.data.success) {
                setUser(response.data.user);
                // Store user data in localStorage for easy access
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // If API fails and no user in state, try localStorage
            if (!user) {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        setUser(JSON.parse(storedUser));
                    } catch (e) {
                        console.error('Error parsing stored user:', e);
                    }
                }
            }
            if (error.response?.status !== 401) {
                toast.error('Failed to load latest profile data');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                        <div className="card-body text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-3 text-muted">Loading profile...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin User' : 'Admin User';
    const displayEmail = user?.email || '';
    const displayPhone = user?.phone || 'Not provided';
    const stats = {
        posts: user?.profile?.postCount || 0,
        followers: user?.profile?.followerCount || 0,
        following: user?.profile?.followingCount || 0,
        views: 0
    };

    return (
                        <div className="row">
            <div className="col-lg-12">
                {/* Profile Header Card */}
                <div className="card overflow-hidden">
                    <div className="card-body p-0">
                        <div className="bg-primary profile-bg rounded-top position-relative" style={{ height: '200px' }}>
                            <img 
                                src={user?.profile?.profileImageUrl || "/assets/images/users/avatar-1.jpg"} 
                                alt={displayName} 
                                className="avatar-xl mx-auto border border-light border-3 rounded-circle position-absolute top-100 start-50 translate-middle"
                                style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                            />
                        </div>
                        <div className="mt-5 px-4 pb-4">
                            <div className="text-center mb-4">
                                <h4 className="mb-2 fw-semibold">
                                    {displayName}
                                    {user?.role === 'admin' && (
                                        <i data-lucide="badge-check" className="text-success align-middle ms-2"></i>
                                    )}
                                </h4>
                                <p className="text-muted mb-3">{displayEmail}</p>
                                
                                {/* Stats */}
                                <div className="row g-3 mt-4">
                                    <div className="col-lg-3 col-6">
                                        <div className="border rounded p-3">
                                            <h5 className="mb-1 fw-bold text-primary">{stats.posts}</h5>
                                            <p className="text-muted mb-0 small">Posts</p>
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-6">
                                        <div className="border rounded p-3">
                                            <h5 className="mb-1 fw-bold text-primary">
                                                {stats.followers > 1000 ? (stats.followers / 1000).toFixed(1) + 'k' : stats.followers}
                                            </h5>
                                            <p className="text-muted mb-0 small">Followers</p>
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-6">
                                        <div className="border rounded p-3">
                                            <h5 className="mb-1 fw-bold text-primary">
                                                {stats.following > 1000 ? (stats.following / 1000).toFixed(1) + 'k' : stats.following}
                                            </h5>
                                            <p className="text-muted mb-0 small">Following</p>
                                        </div>
                                    </div>
                                    <div className="col-lg-3 col-6">
                                        <div className="border rounded p-3">
                                            <h5 className="mb-1 fw-bold text-primary">
                                                {stats.views > 1000 ? (stats.views / 1000).toFixed(1) + 'k' : stats.views}
                                            </h5>
                                            <p className="text-muted mb-0 small">Views</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <div className="row mt-4">
                    {/* Personal Information */}
                    <div className="col-xl-4 col-lg-6">
                        <div className="card">
                            <div className="card-header bg-primary-subtle">
                                <h4 className="card-title mb-0 text-primary">
                                    <i data-lucide="user" className="align-middle me-2"></i>
                                    Personal Information
                                </h4>
                            </div>
                            <div className="card-body">
                                <div className="pb-3 border-bottom">
                                    <h6 className="text-dark fs-12 text-uppercase fw-bold mb-2">Full Name</h6>
                                    <p className="fw-medium mb-0">{displayName}</p>
                                </div>
                                
                                <div className="py-3 border-bottom">
                                    <h6 className="text-dark fs-12 text-uppercase fw-bold mb-2">Email Address</h6>
                                    <p className="fw-medium mb-0">
                                        <a href={`mailto:${displayEmail}`} className="text-primary">{displayEmail}</a>
                                    </p>
                                </div>
                                
                                <div className="py-3 border-bottom">
                                    <h6 className="text-dark fs-12 text-uppercase fw-bold mb-2">Phone Number</h6>
                                    <p className="fw-medium mb-0">{displayPhone}</p>
                                </div>
                                
                                <div className="py-3 border-bottom">
                                    <h6 className="text-dark fs-12 text-uppercase fw-bold mb-2">Role</h6>
                                    <p className="fw-medium mb-0">
                                        <span className="badge bg-primary">{user?.role ? String(user.role).charAt(0).toUpperCase() + String(user.role).slice(1) : 'Admin'}</span>
                                    </p>
                                </div>
                                
                                <div className="py-3 border-bottom">
                                    <h6 className="text-dark fs-12 text-uppercase fw-bold mb-2">Account Status</h6>
                                    <p className="fw-medium mb-0">
                                        <span className={`badge ${user?.isActive ? 'bg-success' : 'bg-danger'}`}>
                                            {user?.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </p>
                                </div>
                                
                                <div className="pt-3">
                                    <h6 className="text-dark fs-12 text-uppercase fw-bold mb-2">Member Since</h6>
                                    <p className="fw-medium mb-0">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        }) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="col-xl-4 col-lg-6">
                        <div className="card">
                            <div className="card-header bg-info-subtle">
                                <h4 className="card-title mb-0 text-info">
                                    <i data-lucide="info" className="align-middle me-2"></i>
                                    Additional Information
                                </h4>
                            </div>
                            <div className="card-body">
                                {user?.profile?.bio ? (
                                    <div className="pb-3">
                                        <h6 className="text-dark fs-12 text-uppercase fw-bold mb-2">About Me</h6>
                                        <p className="fw-medium mb-0 text-muted">{user.profile.bio}</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <i data-lucide="file-text" className="text-muted mb-3" style={{ width: '48px', height: '48px' }}></i>
                                        <p className="text-muted mb-0">No additional information available</p>
                                    </div>
                                )}

                                {user?.profile?.username && (
                                    <div className="pt-3 border-top">
                                        <h6 className="text-dark fs-12 text-uppercase fw-bold mb-2">Username</h6>
                                        <p className="fw-medium mb-0">@{user.profile.username}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="col-xl-4 col-lg-12">
                        <div className="card">
                            <div className="card-header bg-success-subtle">
                                <h4 className="card-title mb-0 text-success">
                                    <i data-lucide="settings" className="align-middle me-2"></i>
                                    Quick Actions
                                </h4>
                            </div>
                            <div className="card-body">
                                <div className="d-grid gap-2">
                                    <a href="/settings" className="btn btn-primary">
                                        <i data-lucide="edit" className="align-middle me-2" style={{ width: '16px', height: '16px' }}></i>
                                        Edit Profile
                                    </a>
                                    <a href="/settings" className="btn btn-outline-secondary">
                                        <i data-lucide="key" className="align-middle me-2" style={{ width: '16px', height: '16px' }}></i>
                                        Change Password
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Account Summary */}
                        <div className="card mt-3">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Account Summary</h5>
                            </div>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-muted">Total Posts</span>
                                    <span className="fw-bold">{stats.posts}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="text-muted">Followers</span>
                                    <span className="fw-bold">{stats.followers}</span>
                                </div>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted">Following</span>
                                    <span className="fw-bold">{stats.following}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
