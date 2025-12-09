import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function StudioProfile() {
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        bio: '',
        profileImage: null
    });
    const [loading, setLoading] = useState(false);

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
                        profileImage: null
                    });
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

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileData(prev => ({
                ...prev,
                profileImage: file
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setLoading(true);
        
        try {
            // In a real implementation, this would send data to the backend
            // For now, we'll just show a success message
            setTimeout(() => {
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
                            telephone: profileData.phone
                        };
                        localStorage.setItem('studioUser', JSON.stringify(updatedUser));
                        toast.success('Profile updated successfully!');
                    }
                } catch (error) {
                    console.error('Error updating user profile:', error);
                    toast.error('Failed to update profile');
                }
            }, 1000);
        } catch (error) {
            console.error('Profile update error:', error);
            toast.error('Failed to update profile: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box d-flex align-items-center justify-content-between">
                    <h4 className="page-title mb-0">My Profile</h4>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">Profile Information</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-md-8">
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
                                                />
                                            </div>
                                        </div>
                                    </div>

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
                                        />
                                    </div>

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
                                        ></textarea>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Profile Image
                                        </label>
                                        <div className="text-center">
                                            <div className="mb-3">
                                                <img 
                                                    src="/assets/images/users/avatar-1.jpg" 
                                                    alt="Profile" 
                                                    className="rounded-circle avatar-lg" 
                                                />
                                            </div>
                                            <div className="input-group">
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    accept="image/*"
                                                    onChange={handleFileChange}
                                                    disabled={loading}
                                                />
                                            </div>
                                            <div className="form-text">
                                                JPG, PNG formats allowed. Max size: 5MB
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => navigate(-1)}
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
    );
}