import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PERMISSIONS } from '../../Permissions/permissions';
import { userService } from '../../Services/userService';
import Pagination from '../../Components/Pagination';

const UserGroups = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    name: ''
  });
  const [filteredGroups, setFilteredGroups] = useState([]);

  useEffect(() => {
    // Fetch user groups from database
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await userService.getUserGroups();
        
        if (response && response.success) {
          // The server now returns user counts, so we can use the data directly
          setGroups(response.data);
        } else {
          throw new Error(response?.message || 'Failed to fetch user groups');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch user groups');
        // Fallback to mock data if API fails
        const mockGroups = [
          { 
            user_group_id: 1, 
            name: 'Administrators', 
            description: 'Full system access', 
            users: 3, 
            accessCount: Object.keys(PERMISSIONS).length, 
            modificationCount: Object.keys(PERMISSIONS).length 
          },
          { 
            user_group_id: 2, 
            name: 'Editors', 
            description: 'Can edit content', 
            users: 5, 
            accessCount: Object.keys(PERMISSIONS).length, 
            modificationCount: 5 
          },
          { 
            user_group_id: 3, 
            name: 'Viewers', 
            description: 'Read-only access', 
            users: 12, 
            accessCount: 5, 
            modificationCount: 0 
          },
        ];
        setGroups(mockGroups);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();

    // Initialize icons on mount
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  // Apply filters whenever filters or groups change
  useEffect(() => {
    if (groups.length > 0) {
      let filtered = [...groups];
      
      // Apply name filter
      if (filters.name) {
        filtered = filtered.filter(group => 
          group.name.toLowerCase().includes(filters.name.toLowerCase())
        );
      }
      
      setFilteredGroups(filtered);
      setCurrentPage(1); // Reset to first page when filters change
    } else {
      setFilteredGroups([]);
    }
  }, [filters, groups]);

  // Initialize Lucide icons after render
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [groups]);

  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to delete this user group?')) {
      try {
        setError('');
        // Delete from database
        await userService.deleteUserGroup(groupId);
        // Update state to remove the deleted group
        setGroups(groups.filter(group => group.user_group_id !== groupId));
        setSelectedGroups(selectedGroups.filter(id => id !== groupId));
      } catch (err) {
        setError(err.message || 'Failed to delete user group');
      }
    }
  };

  const handleSelectGroup = (groupId) => {
    setSelectedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleSelectAll = () => {
    if (selectedGroups.length === currentGroups.length && currentGroups.length > 0) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(currentGroups.map(group => group.user_group_id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGroups.length === 0) {
      alert('Please select at least one user group');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedGroups.length} user group(s)?`)) {
      return;
    }

    setBulkDeleting(true);
    setError('');

    try {
      await userService.deleteUserGroups(selectedGroups);
      
      const count = selectedGroups.length;
      
      // Refresh the list
      const response = await userService.getUserGroups();
      if (response && response.success) {
        setGroups(response.data);
        setSelectedGroups([]);
        alert(`${count} user group(s) deleted successfully!`);
      }
    } catch (err) {
      setError(err.message || 'Failed to delete user groups');
      alert('Error: ' + (err.message || 'Failed to delete user groups'));
    } finally {
      setBulkDeleting(false);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGroups = filteredGroups.length > 0 ? filteredGroups.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = Math.ceil(filteredGroups.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="header-title">User Groups</h4>
              <div className="d-flex gap-2 align-items-center">
                {selectedGroups.length > 0 && (
                  <button
                    className="btn btn-danger"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                  >
                    <i data-lucide="trash-2" style={{width: '16px', height: '16px', marginRight: '6px'}}></i>
                    Delete ({selectedGroups.length})
                  </button>
                )}
                <Link to="/users/groups/add" className="btn btn-primary">
                  <i className="ri-add-line align-middle me-1"></i> Add Group
                </Link>
              </div>
            </div>
            <div className="card-body">
              {/* Filter Section */}
              <div className="mb-4 p-3 bg-body-secondary rounded border">
                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label fw-semibold mb-2">Group Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by group name..."
                      value={filters.name}
                      onChange={(e) => setFilters({...filters, name: e.target.value})}
                    />
                  </div>
                  <div className="col-md-2 d-flex gap-2 align-items-end">
                    <button 
                      className="btn btn-primary btn-sm w-100"
                      onClick={() => {}}
                    >
                      <i data-lucide="filter"></i> Apply
                    </button>
                    <button 
                      className="btn btn-outline-secondary btn-sm w-100"
                      onClick={() => setFilters({name: ''})}
                    >
                      <i data-lucide="x"></i> Clear
                    </button>
                  </div>
                </div>
              </div>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="table-responsive">
                <table className="table table-striped table-centered mb-0">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedGroups.length === currentGroups.length && currentGroups.length > 0}
                          onChange={handleSelectAll}
                          className="form-check-input"
                        />
                      </th>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Users</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentGroups.map((group) => (
                      <tr key={group.user_group_id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(group.user_group_id)}
                            onChange={() => handleSelectGroup(group.user_group_id)}
                            className="form-check-input"
                          />
                        </td>
                        <td>{group.user_group_id}</td>
                        <td>{group.name}</td>
                        <td>{group.users || 0}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Link 
                              to={`/users/groups/edit/${group.user_group_id}`} 
                              className="btn btn-sm btn-outline-warning"
                              title="Edit Group"
                            >
                              <i data-lucide="edit" style={{width: '16px', height: '16px'}}></i>
                            </Link>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteGroup(group.user_group_id)}
                              title="Delete Group"
                            >
                              <i data-lucide="trash-2" style={{width: '16px', height: '16px'}}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredGroups.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGroups;