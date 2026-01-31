import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { PERMISSIONS, PERMISSION_NAMES } from '../../Permissions/permissions';
import { userService } from '../../Services/userService';

const AddUserGroup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    accessPermissions: [],
    modificationPermissions: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [permissionsError, setPermissionsError] = useState('');
  const [nameError, setNameError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      // Validate the name
      if (value.trim() === '') {
        setNameError('Group name is required');
      } else if (value.length > 0 && value.startsWith(' ')) {
        setNameError('Group name cannot start with a space');
      } else if (value.trim().length > 50) {
        setNameError('Group name must not exceed 50 characters');
      } else {
        setNameError('');
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAccessPermissionChange = (permissionId) => {
    const updatedPermissions = formData.accessPermissions.includes(permissionId)
      ? formData.accessPermissions.filter(p => p !== permissionId)
      : [...formData.accessPermissions, permissionId];
      
    setFormData({
      ...formData,
      accessPermissions: updatedPermissions
    });
    const total = updatedPermissions.length + formData.modificationPermissions.length;
    if (total > 0) setPermissionsError('');
  };

  const handleModificationPermissionChange = (permissionId) => {
    const updatedPermissions = formData.modificationPermissions.includes(permissionId)
      ? formData.modificationPermissions.filter(p => p !== permissionId)
      : [...formData.modificationPermissions, permissionId];
      
    setFormData({
      ...formData,
      modificationPermissions: updatedPermissions
    });
    const total = formData.accessPermissions.length + updatedPermissions.length;
    if (total > 0) setPermissionsError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate name before submission
    if (formData.name.trim() === '') {
      setNameError('Group name is required');
      return;
    } else if (formData.name.length > 0 && formData.name.startsWith(' ')) {
      setNameError('Group name cannot start with a space');
      return;
    } else if (formData.name.trim().length > 50) {
      setNameError('Group name must not exceed 50 characters');
      return;
    }
    
    const totalSelected = formData.accessPermissions.length + formData.modificationPermissions.length;
    if (totalSelected === 0) {
      setPermissionsError('Please select at least one permission');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare data for API call in the format expected by the server
      const groupData = {
        name: formData.name,
        access_permissions: JSON.stringify(formData.accessPermissions),
        modification_permissions: JSON.stringify(formData.modificationPermissions),
        is_active: 1
      };
      
      // Save to database
      await userService.createUserGroup(groupData);
      
      // Redirect to user groups list after successful creation
      navigate('/users/groups');
    } catch (err) {
      setError(err.message || 'Failed to create user group');
    } finally {
      setLoading(false);
    }
  };

  // Mock permissions list using constants
  const permissionsList = Object.entries(PERMISSIONS).map(([key, value]) => ({
    id: value,
    name: PERMISSION_NAMES[value]
  }));

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="header-title">Add New User Group</h4>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => navigate('/users/groups')}
              >
                <i className="ri-arrow-left-line me-1"></i> Back
              </button>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Group Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control ${nameError ? 'is-invalid' : ''}`}
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  {nameError && <div className="invalid-feedback">{nameError}</div>}
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Access Permissions</label>
                  <div className="row">
                    {permissionsError && (
                      <div className="col-12">
                        <div className="alert alert-danger py-2 mb-3">{permissionsError}</div>
                      </div>
                    )}
                    {permissionsList.map(permission => (
                      <div className="col-md-6" key={`access-${permission.id}`}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`access-permission-${permission.id}`}
                            checked={formData.accessPermissions.includes(permission.id)}
                            onChange={() => handleAccessPermissionChange(permission.id)}
                          />
                          <label className="form-check-label" htmlFor={`access-permission-${permission.id}`}>
                            {permission.name}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Modification Permissions</label>
                  <div className="row">
                    {permissionsList.map(permission => (
                      <div className="col-md-6" key={`mod-${permission.id}`}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`mod-permission-${permission.id}`}
                            checked={formData.modificationPermissions.includes(permission.id)}
                            onChange={() => handleModificationPermissionChange(permission.id)}
                          />
                          <label className="form-check-label" htmlFor={`mod-permission-${permission.id}`}>
                            {permission.name}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Add Group'}
                </button>
                <Link to="/users/groups" className="btn btn-secondary ms-2">Cancel</Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUserGroup;
