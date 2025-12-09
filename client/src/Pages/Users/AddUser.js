import React, { useState, useEffect } from 'react';
import PageTitle from '../../Components/PageTitle';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../Config/axios';

export default function AddUser() {
    const navigate = useNavigate();
    const [newUser, setNewUser] = useState({
        username: '',
        userGroup: '',
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        profileImage: null,
        password: '',
        confirmPassword: '',
        status: 'Active'
    });
    const [userGroups, setUserGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserGroups();
    }, []);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        setNewUser(prev => ({
            ...prev,
            profileImage: e.target.files[0]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate passwords match
        if (newUser.password !== newUser.confirmPassword) {
            alert('Passwords do not match!');
            return;
        }
        
        // Prepare data for API
        const userData = {
            username: newUser.username,
            userGroup: newUser.userGroup,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            mobile: newUser.mobile,
            profileImage: newUser.profileImage,
            password: newUser.password,
            status: newUser.status
        };
        
        try {
            // Save to oc_admin_user table
            const response = await api.post('/User/add', userData);
            
            if (response.data.success) {
                alert('User created successfully!');
                // Navigate back to users page
                navigate('/users');
            } else {
                alert(`Error: ${response.data.message || 'Failed to create user'}`);
            }
        } catch (error) {
            console.error('Error saving user:', error);
            if (error.response && error.response.data && error.response.data.message) {
                alert(`Error: ${error.response.data.message}`);
            } else {
                alert('Error saving user. Please try again.');
            }
        }
    };

    return (
        <div className="container-fluid">
            <PageTitle title="Add User" pageTitle="Add User" />
            
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="header-title">Add New User</h4>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Username *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="username"
                                                value={newUser.username}
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
                                                    value={newUser.userGroup}
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
                                                    value={newUser.userGroup}
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
                                                value={newUser.firstName}
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
                                                value={newUser.lastName}
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
                                                value={newUser.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Mobile</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="mobile"
                                                value={newUser.mobile}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Password *</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="password"
                                                value={newUser.password}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Confirm Password *</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                name="confirmPassword"
                                                value={newUser.confirmPassword}
                                                onChange={handleInputChange}
                                                required
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
                                                value={newUser.status}
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
                                        Add User
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}