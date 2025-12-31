import React, { useEffect, useRef, useState } from 'react';
import api from '../../Config/axios';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../Config/constants';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const fileRef = useRef(null);
    const [imgVersion, setImgVersion] = useState(Date.now());

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

    // Reinitialize Lucide icons when component updates
    useEffect(() => {
        if (window.lucide) {
            setTimeout(() => {
                window.lucide.createIcons();
            }, 0);
        }
    }, [user, imgVersion]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Users/me');
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

    const displayName = user ? `${user.firstName || user.firstname || ''} ${user.lastName || user.lastname || ''}`.trim() || 'Admin User' : 'Admin User';
    const displayEmail = user?.email || '';
    const displayPhone = user?.phone || user?.telephone || 'Not provided';
    const displayUsername = user?.username || 'N/A';
    
    // Function to get role name from user_group_id
    const getRoleName = (userGroupId) => {
        if (!userGroupId) return 'Admin';
        switch (userGroupId) {
            case 1:
                return 'Administrator';
            case 2:
                return 'Editor';
            case 3:
                return 'Viewer';
            default:
                return 'Admin';
        }
    };
    
    const displayRole = getRoleName(user?.user_group_id || user?.userGroupId || 1);

    const triggerUpload = () => {
        fileRef.current?.click();
    };

    const onFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const fd = new FormData();
            fd.append('profileImage', file);
            const up = await api.post('/Users/profile/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (up.data?.success) {
                const resp = await api.get('/Users/me');
                if (resp.data?.success) {
                    localStorage.setItem('user', JSON.stringify(resp.data.user));
                    setUser(resp.data.user);
                    setImgVersion(Date.now());
                    window.dispatchEvent(new Event('user-updated'));
                }
                toast.success('Profile image updated');
            } else {
                toast.error(up.data?.message || 'Image upload failed');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Image upload failed');
        } finally {
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    return (
                        <div className="row">
            <div className="col-lg-12">
                {/* Profile Header Card */}
                <div className="card overflow-hidden">
                    <div className="card-body p-0">
                        <div className="bg-primary profile-bg rounded-top position-relative" style={{ height: '200px' }}>
                            <div className="position-absolute top-100 start-50 translate-middle">
                                <div className="position-relative d-inline-block">
                                    {user?.image ? (
                                        <img 
                                            src={`${BASE_URL}${user.image}?t=${imgVersion}`} 
                                            alt={displayName} 
                                            className="avatar-xl mx-auto border border-light border-3 rounded-circle shadow-sm"
                                            style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div 
                                            className="mx-auto border border-light border-3 rounded-circle shadow-sm bg-light d-flex align-items-center justify-content-center"
                                            style={{ width: '120px', height: '120px' }}
                                        >
                                            <i data-lucide="user" className="text-muted" style={{ width: '32px', height: '32px' }}></i>
                                        </div>
                                    )}
                                    <div className="position-absolute" style={{ bottom: '0px', right: '0px', zIndex: 1 }}>
                                        <button
                                            type="button"
                                            className="btn rounded-circle d-flex align-items-center justify-content-center shadow"
                                            style={{ width: '40px', height: '40px', padding: 0, backgroundColor: '#22c55e', border: '3px solid #fff' }}
                                            onClick={triggerUpload}
                                            aria-label="Change profile image"
                                            title="Change profile image"
                                        >
                                            <i data-lucide="camera" className="text-white" style={{ width: '18px', height: '18px' }}></i>
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileRef}
                                        onChange={onFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-5 px-4 pb-4">
                            <div className="text-center mb-4">
                                <h4 className="mb-2 fw-semibold">
                                    {displayName}
                                    {user?.role === 'admin' && (
                                        <i data-lucide="badge-check" className="text-success align-middle ms-2"></i>
                                    )}
                                </h4>
                                <p className="text-body mb-3">{displayEmail}</p>
                                
                                
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
                                    <label className="text-dark small text-uppercase fw-semibold d-block mb-1">Username</label>
                                    <p className="fw-medium mb-0 text-body">{displayUsername}</p>
                                </div>
                                
                                <div className="py-3 border-bottom">
                                    <label className="text-dark small text-uppercase fw-semibold d-block mb-1">Full Name</label>
                                    <p className="fw-medium mb-0 text-body">{displayName}</p>
                                </div>
                                
                                <div className="py-3 border-bottom">
                                    <label className="text-dark small text-uppercase fw-semibold d-block mb-1">Email Address</label>
                                    <p className="fw-medium mb-0 text-body">
                                        <a href={`mailto:${displayEmail}`} className="text-primary text-decoration-none">{displayEmail}</a>
                                    </p>
                                </div>
                                
                                <div className="py-3 border-bottom">
                                    <label className="text-dark small text-uppercase fw-semibold d-block mb-1">Phone Number</label>
                                    <p className="fw-medium mb-0 text-body">{displayPhone}</p>
                                </div>
                                
                                <div className="pt-3">
                                    <label className="text-dark small text-uppercase fw-semibold d-block mb-1">Role</label>
                                    <p className="fw-medium mb-0 text-body">
                                        <span className="badge bg-primary-subtle text-primary">{displayRole}</span>
                                    </p>
                                </div>
                                
                                {/* <div className="py-3 border-bottom">
                                    <h6 className="text-dark fs-12 text-uppercase fw-bold mb-2">Account Status</h6>
                                    <p className="fw-medium mb-0">
                                        <span className={`badge ${user?.isActive ? 'bg-success' : 'bg-danger'}`}>
                                            {user?.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </p>
                                </div> */}
                                
                                {/* <div className="pt-3">
                                    <h6 className="text-dark fs-12 text-uppercase fw-bold mb-2">Member Since</h6>
                                    <p className="fw-medium mb-0">
                                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                                            year: 'numeric', 
                                            month: 'long', 
                                            day: 'numeric' 
                                        }) : 'N/A'}
                                    </p>
                                </div> */}
                            </div>
                        </div>
                    </div>

                    

                    {/* Quick Actions */}
                    <div className="col-xl-8 col-lg-6">
                        <div className="card">
                            <div className="card-header bg-success-subtle">
                                <h4 className="card-title mb-0 text-success">
                                    <i data-lucide="settings" className="align-middle me-2"></i>
                                    Quick Actions
                                </h4>
                            </div>
                            <div className="card-body">
                                <div className="d-grid gap-2">
                                    <button type="button" className="btn btn-primary" onClick={() => navigate('/profile/edit')}>
                                        <i data-lucide="edit" className="align-middle me-2" style={{ width: '16px', height: '16px' }}></i>
                                        Edit Profile
                                    </button>
                                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/profile/change-password')}>
                                        <i data-lucide="key" className="align-middle me-2" style={{ width: '16px', height: '16px' }}></i>
                                        Change Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
