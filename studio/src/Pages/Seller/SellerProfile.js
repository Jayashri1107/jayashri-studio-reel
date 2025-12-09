import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function SellerProfile() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        bio: '',
        profileImage: null
    });
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        posts: 0,
        followers: 0,
        views: 0
    });

    const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'followers', or 'views'
    const [reels, setReels] = useState([]);
    const [followers, setFollowers] = useState([]); // For followers list
    const [reelViews, setReelViews] = useState([]); // For views list

    const [editing, setEditing] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Load actual user profile data from localStorage
        const loadUserProfile = () => {
            try {
                const storedUser = localStorage.getItem('studioUser');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    setProfileData({
                        firstName: user.firstname || '',
                        lastName: user.lastname || '',
                        email: user.email || '',
                        phone: user.telephone || '',
                        bio: '', // Bio is not stored in the current user data
                        profileImage: user.image || null
                    });
                    setPreviewImage(user.image || null);
                    // Mark image as loaded once we have the data
                    if (user.image) {
                        setImageLoaded(true);
                    }
                }
            } catch (error) {
                console.error('Error loading user profile:', error);
                toast.error('Failed to load profile data');
            }
        };
        
        loadUserProfile();
        loadSellerData(); // Load both reels and stats
    }, []);

    useEffect(() => {
        // Load stats when reels data changes
        if (reels.length > 0) {
            loadSellerStats();
        }
    }, [reels]);

    const loadSellerStats = async () => {
        try {
            // Get vendor ID from localStorage
            const storedUser = localStorage.getItem('studioUser');
            if (!storedUser) {
                return;
            }
            
            const user = JSON.parse(storedUser);
            const vendorId = user.vendor_id;
            
            if (!vendorId) {
                return;
            }
            
            // Load seller stats from API
            const response = await ApiService.getSellerDashboardStats(vendorId);
            if (response.success) {
                // The API returns reel counts, not engagement metrics
                setStats({
                    posts: response.data.totalReels || 0,
                    followers: 0, // Not provided by current API
                    views: 0 // Not provided by current API
                });
            }
        } catch (error) {
            console.error('Error loading seller stats:', error);
        }
    };

    const loadSellerData = async () => {
        try {
            // Get vendor ID from localStorage
            const storedUser = localStorage.getItem('studioUser');
            if (!storedUser) {
                toast.error('User not found');
                return;
            }
            
            const user = JSON.parse(storedUser);
            const vendorId = user.vendor_id;
            
            if (!vendorId) {
                toast.error('Vendor ID not found');
                return;
            }
            
            // Load seller reels
            const reelsResponse = await ApiService.getSellerReels(vendorId);
            if (reelsResponse.success) {
                setReels(reelsResponse.data);
            }
            
            // Load seller stats
            const statsResponse = await ApiService.getSellerDashboardStats(vendorId);
            if (statsResponse.success) {
                setStats({
                    posts: statsResponse.data.totalReels || 0,
                    followers: 0, // Not provided by current API
                    views: 0 // Not provided by current API
                });
            }
        } catch (error) {
            console.error('Error loading seller data:', error);
            toast.error('Failed to load seller data');
        }
    };

    const loadSellerReels = async () => {
        try {
            // Get vendor ID from localStorage
            const storedUser = localStorage.getItem('studioUser');
            if (!storedUser) {
                toast.error('User not found');
                return;
            }
            
            const user = JSON.parse(storedUser);
            const vendorId = user.vendor_id;
            
            if (!vendorId) {
                toast.error('Vendor ID not found');
                return;
            }
            
            const response = await ApiService.getSellerReels(vendorId);
            if (response.success) {
                setReels(response.data);
            } else {
                // Fallback to empty array if API call fails
                setReels([]);
            }
        } catch (error) {
            console.error('Error loading seller reels:', error);
            // Fallback to empty array if API call fails
            setReels([]);
        }
    };

    const handlePostsClick = () => {
        // Navigate to the posts page
        navigate('/studio/seller/posts');
    };

    const handleFollowersClick = () => {
        // Show followers list directly on the same page
        setActiveTab('followers');
        loadFollowers(); // Load followers data
    };
    
    const handleViewsClick = () => {
        // Show views list directly on the same page
        setActiveTab('views');
        loadReelViews(); // Load views data
    };
    
    const handleBackToProfile = () => {
        // Go back to main profile view
        setActiveTab('profile');
    };

    const loadFollowers = async () => {
        try {
            // Mock followers data - replace with actual API call
            const mockFollowers = [
                { id: 1, name: 'John Doe', username: '@johndoe', avatar: '/assets/images/users/avatar-2.jpg' },
                { id: 2, name: 'Jane Smith', username: '@janesmith', avatar: '/assets/images/users/avatar-3.jpg' },
                { id: 3, name: 'Mike Johnson', username: '@mikej', avatar: '/assets/images/users/avatar-4.jpg' },
                { id: 4, name: 'Sarah Williams', username: '@sarahw', avatar: '/assets/images/users/avatar-5.jpg' },
                { id: 5, name: 'David Brown', username: '@davidb', avatar: '/assets/images/users/avatar-6.jpg' }
            ];
            setFollowers(mockFollowers);
        } catch (error) {
            console.error('Error loading followers:', error);
            toast.error('Failed to load followers');
        }
    };
    
    const loadReelViews = async () => {
        try {
            // Get vendor ID from localStorage
            const storedUser = localStorage.getItem('studioUser');
            if (!storedUser) {
                toast.error('User not found');
                return;
            }
            
            const user = JSON.parse(storedUser);
            const vendorId = user.vendor_id;
            
            if (!vendorId) {
                toast.error('Vendor ID not found');
                return;
            }
            
            // Load reels with real data
            const response = await ApiService.getSellerReels(vendorId);
            if (response.success) {
                // Transform the data to match the view format
                // Show 0 views since the database doesn't track views for seller reels
                const reelViewsData = response.data.map((reel) => {
                    return {
                        id: reel.id,
                        reelTitle: reel.title,
                        views: 0, // Actual value from database (no view tracking)
                        date: reel.created_at
                    };
                });
                setReelViews(reelViewsData);
            } else {
                // Fallback to mock views data if API call fails
                const mockViews = [
                    { id: 1, reelTitle: 'Summer Collection Launch', views: 0, date: '2023-06-15' },
                    { id: 2, reelTitle: 'Behind the Scenes', views: 0, date: '2023-06-10' },
                    { id: 3, reelTitle: 'Product Review', views: 0, date: '2023-06-05' }
                ];
                setReelViews(mockViews);
            }
        } catch (error) {
            console.error('Error loading reel views:', error);
            // Fallback to mock views data if API call fails
            const mockViews = [
                { id: 1, reelTitle: 'Summer Collection Launch', views: 0, date: '2023-06-15' },
                { id: 2, reelTitle: 'Behind the Scenes', views: 0, date: '2023-06-10' },
                { id: 3, reelTitle: 'Product Review', views: 0, date: '2023-06-05' }
            ];
            setReelViews(mockViews);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageLoad = () => {
        setImageLoaded(true);
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.match('image.*')) {
                toast.error('Please select an image file (JPG, PNG, etc.)');
                return;
            }
            
            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size exceeds 5MB limit');
                return;
            }
            
            setLoading(true);
            
            try {
                // Upload the profile image to the server
                const response = await ApiService.uploadProfileImage(file);
                
                if (response.success) {
                    // Save the image path to the database
                    const updateResponse = await ApiService.updateProfileImagePath(response.imagePath);
                    if (!updateResponse.success) {
                        toast.error(updateResponse.message || 'Failed to save profile image to database');
                        return;
                    }
                    
                    // Update preview
                    const imageUrl = URL.createObjectURL(file);
                    setPreviewImage(imageUrl);
                    
                    // Update profile data with the new image path
                    setProfileData(prev => ({ 
                        ...prev, 
                        profileImage: response.imagePath
                    }));
                    
                    // Update localStorage with the new image path
                    const storedUser = localStorage.getItem('studioUser');
                    if (storedUser) {
                        const user = JSON.parse(storedUser);
                        const updatedUser = {
                            ...user,
                            image: response.imagePath
                        };
                        localStorage.setItem('studioUser', JSON.stringify(updatedUser));
                        
                        // Dispatch a custom event to notify other components of the user update
                        window.dispatchEvent(new Event('userUpdated'));
                    }
                    
                    toast.success('Profile picture updated successfully!');
                } else {
                    toast.error(response.message || 'Failed to upload profile picture');
                }
            } catch (error) {
                console.error('Profile image upload error:', error);
                toast.error('Failed to upload profile picture: ' + (error.message || 'Unknown error'));
            } finally {
                setLoading(false);
            }
        }
    };

    const triggerFileSelect = () => {
        if (!loading) {
            fileInputRef.current.click();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setLoading(true);
        
        try {
            // Update localStorage with the new data
            try {
                const storedUser = localStorage.getItem('studioUser');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    const updatedUser = {
                        ...user,
                        firstname: profileData.firstName,
                        lastname: profileData.lastName,
                        email: profileData.email,
                        telephone: profileData.phone,
                        image: previewImage || profileData.profileImage
                    };
                    localStorage.setItem('studioUser', JSON.stringify(updatedUser));
                    toast.success('Profile updated successfully!');
                    setEditing(false);
                    
                    // Dispatch a custom event to notify other components of the user update
                    window.dispatchEvent(new Event('userUpdated'));
                }
            } catch (error) {
                console.error('Error updating user profile:', error);
                toast.error('Failed to update profile');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('Failed to update profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const displayName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'Seller';
    const displayEmail = profileData.email || '';
    const displayPhone = profileData.phone || 'Not provided';
    // Use the uploaded image if available, otherwise fallback to default
    const profileImageUrl = previewImage || profileData.profileImage || '/assets/images/users/avatar-1.jpg';

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box d-flex align-items-center justify-content-between">
                    <h4 className="page-title mb-0">
                        {activeTab === 'profile' && 'Seller Profile'}
                        {activeTab === 'followers' && 'Followers'}
                        {activeTab === 'views' && 'Reel Views'}
                    </h4>
                    {activeTab !== 'profile' && (
                        <button 
                            className="btn btn-outline-secondary"
                            onClick={handleBackToProfile}
                        >
                            <i className="ri-arrow-left-line me-1"></i> Back to Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
                disabled={loading}
            />

            {activeTab === 'profile' ? (
                // Main Profile View
                <>
                    {/* Profile Header Card */}
                    <div className="col-lg-12">
                        <div className="card overflow-hidden">
                            <div className="card-body p-0">
                                <div className="bg-primary profile-bg rounded-top position-relative" style={{ height: '200px' }}>
                                    <div 
                                        className="avatar-xl mx-auto border border-light border-3 rounded-circle position-absolute top-100 start-50 translate-middle"
                                        style={{ width: '120px', height: '120px', cursor: loading ? 'not-allowed' : 'pointer' }}
                                        onClick={triggerFileSelect}
                                    >
                                        {/* Hidden default avatar that shows while loading */}
                                        {!imageLoaded && (
                                            <div 
                                                className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                                style={{ width: '120px', height: '120px' }}
                                            >
                                                <i className="ri-user-line ri-2x text-muted"></i>
                                            </div>
                                        )}
                                        
                                        {/* Profile image with onLoad handler */}
                                        <img 
                                            src={profileImageUrl} 
                                            alt={displayName} 
                                            className="rounded-circle"
                                            style={{ 
                                                width: '120px', 
                                                height: '120px', 
                                                objectFit: 'cover',
                                                display: imageLoaded ? 'block' : 'none'
                                            }}
                                            onLoad={handleImageLoad}
                                            onError={() => setImageLoaded(true)}
                                        />
                                        <div 
                                            className="position-absolute bottom-0 end-0 bg-primary rounded-circle d-flex align-items-center justify-content-center"
                                            style={{ width: '30px', height: '30px', cursor: loading ? 'not-allowed' : 'pointer' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!loading) {
                                                    triggerFileSelect();
                                                }
                                            }}
                                        >
                                            {loading ? (
                                                <span className="spinner-border spinner-border-sm text-white" role="status"></span>
                                            ) : (
                                                <i className="ri-camera-fill text-white"></i>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 px-4 pb-4">
                                    <div className="text-center mb-4">
                                        <h4 className="mb-2 fw-semibold">
                                            {displayName}
                                        </h4>
                                        <p className="text-muted mb-3">{displayEmail}</p>
                                        
                                        {/* Stats */}
                                        <div className="row g-3 mt-4 justify-content-center">
                                            <div className="col-lg-3 col-md-4 col-sm-6">
                                                <div 
                                                    className="border rounded p-3 cursor-pointer text-center"
                                                    onClick={handlePostsClick}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <h5 className="mb-1 fw-bold text-primary">{stats.posts}</h5>
                                                    <p className="text-muted mb-0 small">Posts</p>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-4 col-sm-6">
                                                <div 
                                                    className="border rounded p-3 cursor-pointer text-center"
                                                    onClick={handleFollowersClick}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <h5 className="mb-1 fw-bold text-primary">
                                                        {stats.followers > 1000 ? (stats.followers / 1000).toFixed(1) + 'k' : stats.followers}
                                                    </h5>
                                                    <p className="text-muted mb-0 small">Followers</p>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-4 col-sm-6">
                                                <div 
                                                    className="border rounded p-3 cursor-pointer text-center"
                                                    onClick={handleViewsClick}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <h5 className="mb-1 fw-bold text-primary">
                                                        {stats.views > 0 ? (
                                                            stats.views > 1000 ? (stats.views / 1000).toFixed(1) + 'k' : stats.views
                                                        ) : (
                                                            '0'
                                                        )}
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
                            <div className="col-xl-7 col-lg-6">
                                <div className="card">
                                    <div className="card-header bg-primary-subtle">
                                        <h4 className="card-title mb-0 text-primary">
                                            <i className="ri-user-line align-middle me-2"></i>
                                            Personal Information
                                        </h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="pb-2 border-bottom">
                                            <h6 className="text-dark fs-12 text-uppercase fw-bold mb-1">Full Name</h6>
                                            <p className="fw-medium mb-0">{displayName}</p>
                                        </div>
                                        
                                        <div className="py-2 border-bottom">
                                            <h6 className="text-dark fs-12 text-uppercase fw-bold mb-1">Email Address</h6>
                                            <p className="fw-medium mb-0">
                                                <a href={`mailto:${displayEmail}`} className="text-primary">{displayEmail}</a>
                                            </p>
                                        </div>
                                        
                                        <div className="py-2 border-bottom">
                                            <h6 className="text-dark fs-12 text-uppercase fw-bold mb-1">Phone Number</h6>
                                            <p className="fw-medium mb-0">{displayPhone}</p>
                                        </div>
                                        
                                        <div className="pt-2">
                                            <h6 className="text-dark fs-12 text-uppercase fw-bold mb-1">Member Since</h6>
                                            <p className="fw-medium mb-0">
                                                {new Date().toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions and Account Summary */}
                            <div className="col-xl-5 col-lg-6">
                                <div className="card">
                                    <div className="card-header bg-success-subtle">
                                        <h4 className="card-title mb-0 text-success">
                                            <i className="ri-settings-line align-middle me-2"></i>
                                            Quick Actions
                                        </h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="d-grid gap-2">
                                            <button 
                                                className="btn btn-primary"
                                                onClick={() => navigate('/studio/seller/profile/edit')}
                                            >
                                                <i className="ri-edit-line me-1"></i> Edit Profile
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Account Summary */}
                                <div className="card mt-3">
                                    <div className="card-header bg-info-subtle">
                                        <h4 className="card-title mb-0 text-info">
                                            <i className="ri-account-circle-line align-middle me-2"></i>
                                            Account Summary
                                        </h4>
                                    </div>
                                    <div className="card-body">
                                        <div className="row g-2">
                                            <div className="col-12">
                                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <div>
                                                        <h6 className="text-muted mb-1 fs-12">Total Reels</h6>
                                                        <h4 className="mb-0 fw-bold text-primary">{stats.posts}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <div>
                                                        <h6 className="text-muted mb-1 fs-12">Approved Reels</h6>
                                                        <h4 className="mb-0 fw-bold text-success">{reels.filter(reel => reel.status === 'approved').length}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                                                    <div>
                                                        <h6 className="text-muted mb-1 fs-12">Pending Reels</h6>
                                                        <h4 className="mb-0 fw-bold text-warning">{reels.filter(reel => reel.status === 'pending').length}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h6 className="text-muted mb-1 fs-12">Rejected Reels</h6>
                                                        <h4 className="mb-0 fw-bold text-danger">{reels.filter(reel => reel.status === 'rejected').length}</h4>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            ) : activeTab === 'followers' ? (
                // Followers List View
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Followers</h5>
                        </div>
                        <div className="card-body">
                            {followers.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="ri-user-line ri-3x text-muted mb-3"></i>
                                    <h5>No followers yet</h5>
                                    <p className="text-muted">Your followers will appear here</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-centered table-nowrap mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>User</th>
                                                <th>Username</th>
                                                <th className="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {followers.map((follower) => (
                                                <tr key={follower.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img 
                                                                src={follower.avatar} 
                                                                alt={follower.name} 
                                                                className="rounded-circle me-2" 
                                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                            />
                                                            <span>{follower.name}</span>
                                                        </div>
                                                    </td>
                                                    <td>{follower.username}</td>
                                                    <td className="text-end">
                                                        <button className="btn btn-sm btn-outline-primary">
                                                            <i className="ri-message-line"></i>
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
            ) : activeTab === 'views' ? (
                // Views List View (Reel Performance)
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Reel Views</h5>
                        </div>
                        <div className="card-body">
                            <div className="alert alert-info alert-dismissible fade show" role="alert">
                                <i className="ri-information-line me-2"></i>
                                View counts are not currently tracked for seller reels in the database. 
                                All reels show 0 views as this metric is not stored.
                                <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                            </div>
                            
                            {reelViews.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="ri-video-line ri-3x text-muted mb-3"></i>
                                    <h5>No reels yet</h5>
                                    <p className="text-muted">Your reels will appear here</p>
                                    <button 
                                        className="btn btn-primary mt-3"
                                        onClick={() => navigate('/studio/seller/upload')}
                                    >
                                        <i className="ri-upload-line me-1"></i> Upload Your First Reel
                                    </button>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-centered table-nowrap mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Reel Title</th>
                                                <th>Views</th>
                                                <th>Date Uploaded</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reelViews.map((view) => (
                                                <tr key={view.id}>
                                                    <td>{view.reelTitle}</td>
                                                    <td>
                                                        <span className="badge bg-primary">{view.views.toLocaleString()}</span>
                                                    </td>
                                                    <td>{new Date(view.date).toLocaleDateString('en-US')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}