import React, { useState, useEffect } from 'react';
import PageTitle from '../../Components/PageTitle';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../Config/axios';

export default function AddUserGroup() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get the ID from the URL for editing
    const isEditing = !!id; // Check if we're editing or adding
    
    const [userGroup, setUserGroup] = useState({
        groupName: '',
        accessPermissions: [],
        modificationPermissions: []
    });
    
    const [loading, setLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // Define access permissions based on user requirements and sidebar structure
    const accessPermissions = [
        { 
            id: 'dashboard', 
            name: 'Dashboard', 
            category: 'access' 
        },
        { 
            id: 'seller', 
            name: 'Seller', 
            category: 'access',
            children: [
                { id: 'manage_seller', name: 'Manage Seller' },
                { id: 'seller_reels', name: 'Seller Reels' },
                { id: 'seller_approval_list', name: 'Approval List' }
            ]
        },
        { 
            id: 'influencer', 
            name: 'Influencer', 
            category: 'access',
            children: [
                { id: 'manage_influencer', name: 'Manage Influencer' },
                { id: 'influencer_reels', name: 'Influencer Reels' },
                { id: 'influencer_approval_list', name: 'Approval List' }
            ]
        },
        { 
            id: 'brand', 
            name: 'Brand', 
            category: 'access',
            children: [
                { id: 'brand_reels', name: 'Brand Reels' }
            ]
        },
        { 
            id: 'categories', 
            name: 'Categories', 
            category: 'access'
        },
        { 
            id: 'user_management', 
            name: 'User Management', 
            category: 'access',
            children: [
                { id: 'users', name: 'Users' },
                { id: 'user_groups', name: 'User Groups' }
            ]
        }
    ];

    // Define modification permissions based on user requirements
    const modificationPermissions = [
        { 
            id: 'dashboard_mod', 
            name: 'Dashboard', 
            category: 'modification' 
        },
        { 
            id: 'seller_mod', 
            name: 'Seller', 
            category: 'modification',
            children: [
                { id: 'manage_seller_mod', name: 'Manage Seller' },
                { id: 'seller_reels_mod', name: 'Seller Reels' },
                { id: 'seller_approval_list_mod', name: 'Approval List' }
            ]
        },
        { 
            id: 'influencer_mod', 
            name: 'Influencer', 
            category: 'modification',
            children: [
                { id: 'manage_influencer_mod', name: 'Manage Influencer' },
                { id: 'influencer_reels_mod', name: 'Influencer Reels' },
                { id: 'influencer_approval_list_mod', name: 'Approval List' }
            ]
        },
        { 
            id: 'brand_mod', 
            name: 'Brand', 
            category: 'modification',
            children: [
                { id: 'brand_reels_mod', name: 'Brand Reels' }
            ]
        },
        { 
            id: 'categories_mod', 
            name: 'Categories', 
            category: 'modification'
        },
        { 
            id: 'user_management_mod', 
            name: 'User Management', 
            category: 'modification',
            children: [
                { id: 'users_mod', name: 'Users' },
                { id: 'user_groups_mod', name: 'User Groups' }
            ]
        }
    ];

    // Fetch user group data if editing
    useEffect(() => {
        if (isEditing) {
            fetchUserGroup();
        }
    }, [id]);

    const fetchUserGroup = async () => {
        setIsFetching(true);
        try {
            const response = await api.get(`/user-groups/${id}`);
            
            if (response.data.success) {
                const groupData = response.data.data;
                setUserGroup({
                    groupName: groupData.name,
                    accessPermissions: groupData.access_permissions ? JSON.parse(groupData.access_permissions) : [],
                    modificationPermissions: groupData.modification_permissions ? JSON.parse(groupData.modification_permissions) : []
                });
            } else {
                console.error('Failed to fetch user group:', response.data.message);
                alert('Failed to fetch user group data');
                navigate('/users/groups');
            }
        } catch (error) {
            console.error('Error fetching user group:', error);
            alert('Error fetching user group data');
            navigate('/users/groups');
        } finally {
            setIsFetching(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserGroup(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePermissionChange = (permissionId, type) => {
        setUserGroup(prev => {
            const permissions = [...prev[type]];
            const index = permissions.indexOf(permissionId);
            
            if (index > -1) {
                // Remove permission
                permissions.splice(index, 1);
            } else {
                // Add permission
                permissions.push(permissionId);
            }
            
            return {
                ...prev,
                [type]: permissions
            };
        });
    };

    const handleParentPermissionChange = (parentId, children, type) => {
        setUserGroup(prev => {
            const permissions = [...prev[type]];
            
            // Check if parent is already selected
            const parentIndex = permissions.indexOf(parentId);
            const isParentSelected = parentIndex > -1;
            
            if (isParentSelected) {
                // Remove parent and all children
                const updatedPermissions = permissions.filter(id => 
                    id !== parentId && !children.some(child => child.id === id)
                );
                return {
                    ...prev,
                    [type]: updatedPermissions
                };
            } else {
                // Add parent and all children
                const updatedPermissions = [...permissions, parentId];
                children.forEach(child => {
                    if (!updatedPermissions.includes(child.id)) {
                        updatedPermissions.push(child.id);
                    }
                });
                return {
                    ...prev,
                    [type]: updatedPermissions
                };
            }
        });
    };

    const isChildSelected = (childId, type) => {
        return userGroup[type].includes(childId);
    };

    const isParentSelected = (parentId, children, type) => {
        return userGroup[type].includes(parentId) || 
               (children.length > 0 && children.every(child => userGroup[type].includes(child.id)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate group name
        if (!userGroup.groupName.trim()) {
            alert('Please enter a group name!');
            return;
        }
        
        setLoading(true);
        
        // Prepare data for API
        const groupData = {
            name: userGroup.groupName,
            access_permissions: JSON.stringify(userGroup.accessPermissions),
            modification_permissions: JSON.stringify(userGroup.modificationPermissions),
            is_active: 1
        };
        
        try {
            let response;
            if (isEditing) {
                // Update existing user group
                response = await api.put(`/user-groups/${id}`, groupData);
            } else {
                // Create new user group
                response = await api.post('/user-groups/add', groupData);
            }
            
            if (response.data.success) {
                alert(isEditing ? 'User group updated successfully!' : 'User group created successfully!');
                // Navigate back to user groups page
                navigate('/users/groups');
            } else {
                alert('Error: ' + (response.data.message || (isEditing ? 'Failed to update user group' : 'Failed to create user group')));
            }
        } catch (error) {
            console.error('Error ' + (isEditing ? 'updating' : 'saving') + ' user group:', error);
            if (error.response && error.response.data && error.response.data.message) {
                alert('Error: ' + error.response.data.message);
            } else {
                alert('Error ' + (isEditing ? 'updating' : 'saving') + ' user group. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid">
            <PageTitle title={isEditing ? "Edit User Group" : "Add User Group"} pageTitle={isEditing ? "Edit User Group" : "Add User Group"} />
            
            {(isFetching && isEditing) ? (
                <div className="d-flex justify-content-center my-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h4 className="header-title">{isEditing ? "Edit User Group" : "Add New User Group"}</h4>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Group Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="groupName"
                                            value={userGroup.groupName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="row">
                                        {/* Access Permissions Column */}
                                        <div className="col-md-6">
                                            <div className="mb-4">
                                                <h5 className="mb-3">Access Permissions</h5>
                                                {accessPermissions.map(permission => (
                                                    <div className="mb-3" key={permission.id}>
                                                        {permission.children ? (
                                                            <div className="border rounded p-3">
                                                                <div className="form-check mb-2">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`access-${permission.id}`}
                                                                        checked={isParentSelected(permission.id, permission.children, 'accessPermissions')}
                                                                        onChange={() => handleParentPermissionChange(permission.id, permission.children, 'accessPermissions')}
                                                                    />
                                                                    <label className="form-check-label fw-bold" htmlFor={`access-${permission.id}`}>
                                                                        {permission.name}
                                                                    </label>
                                                                </div>
                                                                <div className="ms-3">
                                                                    {permission.children.map(child => (
                                                                        <div className="form-check mb-1" key={child.id}>
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="checkbox"
                                                                                id={`access-${child.id}`}
                                                                                checked={isChildSelected(child.id, 'accessPermissions')}
                                                                                onChange={() => handlePermissionChange(child.id, 'accessPermissions')}
                                                                            />
                                                                            <label className="form-check-label" htmlFor={`access-${child.id}`}>
                                                                                {child.name}
                                                                            </label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="form-check">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`access-${permission.id}`}
                                                                    checked={userGroup.accessPermissions.includes(permission.id)}
                                                                    onChange={() => handlePermissionChange(permission.id, 'accessPermissions')}
                                                                />
                                                                <label className="form-check-label fw-bold" htmlFor={`access-${permission.id}`}>
                                                                    {permission.name}
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Modification Permissions Column */}
                                        <div className="col-md-6">
                                            <div className="mb-4">
                                                <h5 className="mb-3">Modification Permissions</h5>
                                                {modificationPermissions.map(permission => (
                                                    <div className="mb-3" key={permission.id}>
                                                        {permission.children ? (
                                                            <div className="border rounded p-3">
                                                                <div className="form-check mb-2">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`mod-${permission.id}`}
                                                                        checked={isParentSelected(permission.id, permission.children, 'modificationPermissions')}
                                                                        onChange={() => handleParentPermissionChange(permission.id, permission.children, 'modificationPermissions')}
                                                                    />
                                                                    <label className="form-check-label fw-bold" htmlFor={`mod-${permission.id}`}>
                                                                        {permission.name}
                                                                    </label>
                                                                </div>
                                                                <div className="ms-3">
                                                                    {permission.children.map(child => (
                                                                        <div className="form-check mb-1" key={child.id}>
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="checkbox"
                                                                                id={`mod-${child.id}`}
                                                                                checked={isChildSelected(child.id, 'modificationPermissions')}
                                                                                onChange={() => handlePermissionChange(child.id, 'modificationPermissions')}
                                                                            />
                                                                            <label className="form-check-label" htmlFor={`mod-${child.id}`}>
                                                                                {child.name}
                                                                            </label>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="form-check">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`mod-${permission.id}`}
                                                                    checked={userGroup.modificationPermissions.includes(permission.id)}
                                                                    onChange={() => handlePermissionChange(permission.id, 'modificationPermissions')}
                                                                />
                                                                <label className="form-check-label fw-bold" htmlFor={`mod-${permission.id}`}>
                                                                    {permission.name}
                                                                </label>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="d-flex justify-content-end">
                                        <Link to="/users/groups" className="btn btn-light me-2">
                                            Cancel
                                        </Link>
                                        <button type="submit" className="btn btn-primary" disabled={loading}>
                                            {loading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update User Group' : 'Add User Group')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}