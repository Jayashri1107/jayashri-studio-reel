import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { PERMISSIONS, PERMISSION_NAMES } from '../../Permissions/permissions';
import { userService } from '../../Services/userService';

const EditUserGroup = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    accessPermissions: [],
    modificationPermissions: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [permissionsError, setPermissionsError] = useState('');
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    // Fetch user group details
    const fetchGroupDetails = async () => {
      try {
        setLoading(true);
        const response = await userService.getUserGroupById(id);
        
        if (response && response.success) {
          // Parse permissions from JSON strings
          let accessPermissions = [];
          let modificationPermissions = [];
          
          try {
            accessPermissions = JSON.parse(response.data.access_permissions || response.data.accessPermissions || '[]');
          } catch (parseError) {
            console.error('Error parsing access_permissions:', parseError);
            accessPermissions = [];
          }
          
          try {
            modificationPermissions = JSON.parse(response.data.modification_permissions || response.data.modificationPermissions || '[]');
          } catch (parseError) {
            console.error('Error parsing modification_permissions:', parseError);
            modificationPermissions = [];
          }
          
          setFormData({
            name: response.data.name,
            accessPermissions: accessPermissions,
            modificationPermissions: modificationPermissions
          });
        } else {
          throw new Error(response?.message || 'Failed to fetch group details');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch group details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGroupDetails();
    }
  }, [id]);

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

    setSaving(true);

    try {
      // Prepare data for API call in the format expected by the server
      const groupData = {
        name: formData.name,
        access_permissions: JSON.stringify(formData.accessPermissions),
        modification_permissions: JSON.stringify(formData.modificationPermissions),
        is_active: 1
      };
      
      // Update in database
      await userService.updateUserGroup(id, groupData);
      
      // Redirect to user groups list after successful update
      navigate('/users/groups');
    } catch (err) {
      setError(err.message || 'Failed to update user group');
    } finally {
      setSaving(false);
    }
  };

  // Mock permissions list using constants
  const permissionsList = Object.entries(PERMISSIONS).map(([key, value]) => ({
    id: value,
    name: PERMISSION_NAMES[value]
  }));

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="header-title">Edit User Group</h4>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Group Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control bg-body text-body ${nameError ? 'is-invalid' : ''}`}
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
                
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Update Group'}
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

export default EditUserGroup;
