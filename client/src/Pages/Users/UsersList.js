import React, { useState, useEffect } from 'react';
import PageTitle from '../../Components/PageTitle';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../Config/axios';

export default function UsersList() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            console.log('Fetching users from API...');
            const response = await api.get('/User');
            console.log('API response:', response);
            
            if (response.data.success) {
                console.log('Users fetched successfully:', response.data.users);
                setUsers(response.data.users);
            } else {
                console.error('Failed to fetch users:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            console.error('Error response:', error.response);
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (userId) => {
        // Navigate to the edit user page
        navigate(`/users/edit/${userId}`);
    };

    return (
        <div className="container-fluid">
            <PageTitle title="Users Management" pageTitle="Users" />
            
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="header-title">All Users</h4>
                            <div className="d-flex justify-content-end">
                                <Link to="/users/add" className="btn btn-primary">
                                    <i className="ri-add-line align-middle me-1"></i> Add User
                                </Link>
                            </div>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div>Loading...</div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-centered table-nowrap mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>User</th>
                                                <th>Email</th>
                                                <th>Role</th>
                                                <th>Status</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.user_id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0 me-2">
                                                                <div className="avatar-xs">
                                                                    <span className="avatar-title bg-primary-subtle text-primary rounded-circle fs-16">
                                                                        {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                {user.username || `${user.firstname} ${user.lastname}`}
                                                                <div className="text-muted fs-13">{user.firstname} {user.lastname}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{user.email}</td>
                                                    <td>{user.user_group_id || 'N/A'}</td>
                                                    <td>
                                                        <span className={`badge bg-${user.status ? 'success' : 'secondary'}`}>
                                                            {user.status ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleEditUser(user.user_id)}
                                                        >
                                                            <i className="ri-pencil-line me-1"></i> Edit
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
        </div>
    );
}