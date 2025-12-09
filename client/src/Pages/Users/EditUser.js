import React, { useState, useEffect } from 'react';
import PageTitle from '../../Components/PageTitle';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../Config/axios';

export default function EditUser() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get the user ID from the URL
    const [userData, setUserData] = useState({
        username: '',
        userGroup: '',
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        profileImage: null,
        status: 'Active',
        password: '',
        confirmPassword: ''
    });
    const [userGroups, setUserGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        fetchUserGroups();
        if (id) {
            fetchUserDetails();
        } else {
            console.error('No user ID provided in URL');
            alert('No user ID provided');
            navigate('/users');
        }
    }, [id]);

    const fetchUserGroups = async () => {
        try {
            const response = await api.get('/user-groups');
            
            if (response.data.success) {
                setUserGroups(response.data.data);
            } else {
                console.error('Failed to fetch user groups:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching user groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async () => {
        setIsFetching(true);
        try {
            const response = await api.get(`/User/get/${id}`);
            
            if (response.data.success) {
                const user = response.data.user;
                setUserData({
                    username: user.username || '',
                    userGroup: user.user_group_id || '',
                    firstName: user.firstname || '',
                    lastName: user.lastname || '',
                    email: user.email || '',
                    mobile: user.telephone || '',
                    profileImage: null,
                    status: user.status ? 'Active' : 'Inactive'
                });
            } else {
                console.error('Failed to fetch user details:', response.data.message);
                alert('Failed to fetch user details: ' + response.data.message);
                navigate('/users');
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
            if (error.response) {
                console.error('Error response:', error.response);
                
                // Handle specific error cases
                if (error.response.status === 401) {
                    alert('Authentication failed. Please log in again.');
                    // Clear local storage and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/Login';
                    return;
                } else if (error.response.status === 403) {
                    alert('Access denied. You do not have permission to view this user.');
                    navigate('/users');
                    return;
                }
            }
            if (error.request) {
                alert('Network error. Please check your connection.');
            }
            alert('Error fetching user details: ' + (error.response?.data?.message || error.message));
            navigate('/users');
        } finally {
            setIsFetching(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setUserData(prev => ({
            ...prev,
            profileImage: e.target.files[0]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate passwords if they are being changed
        if (userData.password || userData.confirmPassword) {
            if (userData.password !== userData.confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            if (userData.password.length < 6) {
                alert('Password must be at least 6 characters long');
                return;
            }
        }
        
        try {
            // Prepare data for API
            const updateData = {
                username: userData.username,
                userGroup: userData.userGroup,
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                mobile: userData.mobile,
                status: userData.status
            };
            
            // Only include password if it's being changed
            if (userData.password) {
                updateData.password = userData.password;
            }
            
            // Call update API endpoint
            const response = await api.put(`/User/update/${id}`, updateData);
            
            if (response.data.success) {
                alert('User updated successfully');
                // Navigate back to users page
                navigate('/users');
            } else {
                alert('Failed to update user: ' + response.data.message);
            }
        } catch (error) {
            console.error('Error updating user:', error);
            if (error.response) {
                alert('Error updating user: ' + (error.response.data.message || error.response.statusText));
            } else {
                alert('Network error. Please try again.');
            }
        }
    };

    return (
        <div className="container-fluid">
            <PageTitle title="Edit User" pageTitle="Edit User" />
            
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="header-title">Edit User</h4>
                        </div>
                        <div className="card-body">
                            {isFetching ? (
                                <div>Loading user details...</div>
                            ) : (
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Username *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="username"
                                                    value={userData.username}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">User Group *</label>
                                                {loading ? (
                                                    <select
                                                        className="form-select"
                                                        name="userGroup"
                                                        value={userData.userGroup}
                                                        onChange={handleInputChange}
                                                        required
                                                        disabled
                                                    >
                                                        <option value="">Loading...</option>
                                                    </select>
                                                ) : (
                                                    <select
                                                        className="form-select"
                                                        name="userGroup"
                                                        value={userData.userGroup}
                                                        onChange={handleInputChange}
                                                        required
                                                    >
                                                        <option value="">Select User Group</option>
                                                        {userGroups.map(group => (
                                                            <option key={group.user_group_id} value={group.user_group_id}>
                                                                {group.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">First Name *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="firstName"
                                                    value={userData.firstName}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Last Name *</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="lastName"
                                                    value={userData.lastName}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Email *</label>
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    name="email"
                                                    value={userData.email}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Mobile</label>
                                                <input
                                                    type="tel"
                                                    className="form-control"
                                                    name="mobile"
                                                    value={userData.mobile}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    name="password"
                                                    value={userData.password}
                                                    onChange={handleInputChange}
                                                    placeholder="Leave blank to keep current password"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    name="confirmPassword"
                                                    value={userData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="Leave blank to keep current password"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Profile Image</label>
                                                <input
                                                    type="file"
                                                    className="form-control"
                                                    onChange={handleFileChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Status</label>
                                                <select
                                                    className="form-select"
                                                    name="status"
                                                    value={userData.status}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="d-flex justify-content-end">
                                        <Link to="/users" className="btn btn-light me-2">
                                            Cancel
                                        </Link>
                                        <button type="submit" className="btn btn-primary">
                                            Update User
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}