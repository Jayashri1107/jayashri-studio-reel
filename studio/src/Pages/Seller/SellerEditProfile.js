import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function SellerEditProfile() {
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
                        bio: user.bio || '',
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
    }, []);

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
            const storedUser = localStorage.getItem('studioUser');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const updatedUser = {
                    ...user,
                    firstname: profileData.firstName,
                    lastname: profileData.lastName,
                    email: profileData.email,
                    telephone: profileData.phone,
                    bio: profileData.bio,
                    image: previewImage || profileData.profileImage
                };
                localStorage.setItem('studioUser', JSON.stringify(updatedUser));
                
                // Dispatch a custom event to notify other components of the user update
                window.dispatchEvent(new Event('userUpdated'));
            }
            
            toast.success('Profile updated successfully!');
            
            // Navigate back to profile page
            navigate('/studio/seller/profile');
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('Failed to update profile: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const displayName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'Seller';
    const displayEmail = profileData.email || '';
    // Use the uploaded image if available, otherwise fallback to default
    const profileImageUrl = previewImage || profileData.profileImage || '/assets/images/users/avatar-1.jpg';

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-flex align-items-center justify-content-between">
                        <h4 className="page-title mb-0">Edit Profile</h4>
                        <button 
                            className="btn btn-outline-secondary"
                            onClick={() => navigate('/studio/seller/profile')}
                        >
                            <i className="ri-arrow-left-line me-1"></i> Back to Profile
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    {/* Profile Picture Section */}
                                    <div className="col-lg-4">
                                        <div className="text-center mb-4">
                                            <div 
                                                className="mx-auto mb-3 position-relative"
                                                style={{ width: '150px', height: '150px', cursor: loading ? 'not-allowed' : 'pointer' }}
                                                onClick={triggerFileSelect}
                                            >
                                                {/* Hidden default avatar that shows while loading */}
                                                {!imageLoaded && (
                                                    <div 
                                                        className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                                        style={{ width: '150px', height: '150px' }}
                                                    >
                                                        <i className="ri-user-line ri-3x text-muted"></i>
                                                    </div>
                                                )}
                                                
                                                {/* Profile image with onLoad handler */}
                                                <img 
                                                    src={profileImageUrl} 
                                                    alt={displayName} 
                                                    className="rounded-circle"
                                                    style={{ 
                                                        width: '150px', 
                                                        height: '150px', 
                                                        objectFit: 'cover',
                                                        display: imageLoaded ? 'block' : 'none'
                                                    }}
                                                    onLoad={handleImageLoad}
                                                    onError={() => setImageLoaded(true)}
                                                />
                                                <div 
                                                    className="position-absolute bottom-0 end-0 bg-primary rounded-circle d-flex align-items-center justify-content-center"
                                                    style={{ width: '40px', height: '40px', cursor: loading ? 'not-allowed' : 'pointer' }}
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
                                            <h5 className="mb-1">{displayName}</h5>
                                            <p className="text-muted mb-0">{displayEmail}</p>
                                            <p className="text-muted small">Click on the image to change profile picture</p>
                                        </div>
                                    </div>
                                    
                                    {/* Profile Form Section */}
                                    <div className="col-lg-8">
                                        <div className="row">
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label htmlFor="firstName" className="form-label">
                                                        First Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="firstName"
                                                        name="firstName"
                                                        value={profileData.firstName}
                                                        onChange={handleInputChange}
                                                        disabled={loading}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label htmlFor="lastName" className="form-label">
                                                        Last Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        id="lastName"
                                                        name="lastName"
                                                        value={profileData.lastName}
                                                        onChange={handleInputChange}
                                                        disabled={loading}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label htmlFor="email" className="form-label">
                                                        Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        className="form-control"
                                                        id="email"
                                                        name="email"
                                                        value={profileData.email}
                                                        onChange={handleInputChange}
                                                        disabled={loading}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="col-md-6">
                                                <div className="mb-3">
                                                    <label htmlFor="phone" className="form-label">
                                                        Phone
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        className="form-control"
                                                        id="phone"
                                                        name="phone"
                                                        value={profileData.phone}
                                                        onChange={handleInputChange}
                                                        disabled={loading}
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="col-12">
                                                <div className="mb-3">
                                                    <label htmlFor="bio" className="form-label">
                                                        Bio
                                                    </label>
                                                    <textarea
                                                        className="form-control"
                                                        id="bio"
                                                        name="bio"
                                                        rows="4"
                                                        value={profileData.bio}
                                                        onChange={handleInputChange}
                                                        disabled={loading}
                                                        placeholder="Tell us about yourself..."
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="d-flex justify-content-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => navigate('/studio/seller/profile')}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
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
        </div>
    );
}