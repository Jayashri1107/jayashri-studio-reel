import React, { useState, useEffect } from 'react';
import PageTitle from '../../Components/PageTitle';
import { useNavigate } from 'react-router-dom';
import api from '../../Config/axios';

export default function UserGroups() {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroups, setSelectedGroups] = useState([]);

    useEffect(() => {
        fetchUserGroups();
    }, []);

    const fetchUserGroups = async () => {
        try {
            const response = await api.get('/user-groups');
            
            if (response.data.success) {
                setGroups(response.data.data);
            } else {
                console.error('Failed to fetch user groups:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching user groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddGroup = () => {
        navigate('/users/groups/add');
    };

    const handleEditGroup = (groupId) => {
        navigate(`/users/groups/edit/${groupId}`);
    };

    const handleDeleteSelected = () => {
        if (selectedGroups.length === 0) {
            alert('Please select at least one user group to delete.');
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${selectedGroups.length} selected user group(s)?`)) {
            deleteSelectedGroups();
        }
    };

    const deleteSelectedGroups = async () => {
        try {
            console.log('Deleting user groups with IDs:', selectedGroups);
            
            // Call API to delete selected user groups
            const response = await api.delete('/user-groups', {
                data: { user_group_ids: selectedGroups }
            });
            
            console.log('Delete response:', response);
            
            if (response.data.success) {
                // Remove deleted groups from the state
                setGroups(prevGroups => prevGroups.filter(group => !selectedGroups.includes(group.user_group_id)));
                setSelectedGroups([]);
                alert(response.data.message || 'User group(s) deleted successfully!');
            } else {
                alert('Failed to delete user group(s): ' + response.data.message);
            }
        } catch (error) {
            console.error('Error deleting user groups:', error);
            console.error('Error response:', error.response);
            if (error.response && error.response.data && error.response.data.message) {
                alert('Error deleting user groups: ' + error.response.data.message);
            } else {
                alert('Error deleting user groups. Please try again.');
            }
        }
    };

    const handleSelectGroup = (groupId) => {
        setSelectedGroups(prevSelectedGroups => {
            if (prevSelectedGroups.includes(groupId)) {
                return prevSelectedGroups.filter(id => id !== groupId);
            } else {
                return [...prevSelectedGroups, groupId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedGroups.length === groups.length) {
            setSelectedGroups([]);
        } else {
            setSelectedGroups(groups.map(group => group.user_group_id));
        }
    };

    return (
        <div className="container-fluid">
            <PageTitle title="User Groups" pageTitle="User Groups" />
            
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="header-title">User Groups</h4>
                            <div className="d-flex justify-content-end">
                                <button className="btn btn-primary me-2" onClick={handleAddGroup}>
                                    <i className="ri-add-line align-middle me-1"></i> Add User Group
                                </button>
                                <button className="btn btn-danger" onClick={handleDeleteSelected}>
                                    <i className="ri-delete-bin-line align-middle me-1"></i> Delete
                                </button>
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
                                                <th>
                                                    <div className="form-check">
                                                        <input 
                                                            type="checkbox" 
                                                            className="form-check-input" 
                                                            id="select-all" 
                                                            onChange={handleSelectAll}
                                                            checked={selectedGroups.length === groups.length && groups.length > 0}
                                                        />
                                                        <label className="form-check-label" htmlFor="select-all"></label>
                                                    </div>
                                                </th>
                                                <th>User Group Name</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groups.map((group) => (
                                                <tr key={group.user_group_id}>
                                                    <td>
                                                        <div className="form-check">
                                                            <input 
                                                                type="checkbox" 
                                                                className="form-check-input" 
                                                                id={`group-${group.user_group_id}`} 
                                                                onChange={() => handleSelectGroup(group.user_group_id)}
                                                                checked={selectedGroups.includes(group.user_group_id)}
                                                            />
                                                            <label className="form-check-label" htmlFor={`group-${group.user_group_id}`}></label>
                                                        </div>
                                                    </td>
                                                    <td>{group.name}</td>
                                                    <td>
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleEditGroup(group.user_group_id)}
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