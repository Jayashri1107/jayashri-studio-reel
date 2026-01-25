import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../Services/userService';
import Pagination from '../../Components/Pagination';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [userGroupMap, setUserGroupMap] = useState({});
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('users_list_page');
    return saved ? parseInt(saved, 10) : 1;
  });
  const itemsPerPage = 10;
  
  // Filter states
  const [filters, setFilters] = useState({
    username: '',
    email: '',
    status: '',
    date: ''
  });
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    sessionStorage.setItem('users_list_page', currentPage);
  }, [currentPage]);

  useEffect(() => {
    // Fetch user groups first
    const fetchUserGroups = async () => {
      try {
        const response = await userService.getUserGroups();
        if (response && response.success) {
          setUserGroups(response.data);
          // Create a map of user_group_id to name
          const map = {};
          response.data.forEach(group => {
            map[group.user_group_id] = group.name;
          });
          setUserGroupMap(map);
        }
      } catch (err) {
        console.error('Failed to fetch user groups:', err);
      }
    };

    // Fetch users from database
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await userService.getUsers();
        
        if (response && response.success) {
          setUsers(response.data);
        } else {
          throw new Error(response?.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch users');
        // Fallback to mock data if API fails
        const mockUsers = [
          { user_id: 1, username: 'admin', first_name: 'Admin', last_name: 'User', firstname: 'Admin', lastname: 'User', email: 'admin@example.com', telephone: '+1234567890', status: 1, date_added: '2023-01-01' },
          { user_id: 2, username: 'editor', first_name: 'Jane', last_name: 'Smith', firstname: 'Jane', lastname: 'Smith', email: 'jane@example.com', telephone: '+1234567891', status: 1, date_added: '2023-01-02' },
          { user_id: 3, username: 'viewer', first_name: 'Robert', last_name: 'Johnson', firstname: 'Robert', lastname: 'Johnson', email: 'robert@example.com', telephone: '+1234567892', status: 0, date_added: '2023-01-03' },
        ];
        setUsers(mockUsers);
      } finally {
        setLoading(false);
      }
    };

    fetchUserGroups();
    fetchUsers();

    // Initialize icons on mount
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  // Apply filters whenever filters or users change
  useEffect(() => {
    if (users.length > 0) {
      let filtered = [...users];
      
      // Apply username filter
      if (filters.username) {
        filtered = filtered.filter(user => 
          user.username.toLowerCase().includes(filters.username.toLowerCase())
        );
      }
      
      // Apply email filter
      if (filters.email) {
        filtered = filtered.filter(user => 
          user.email.toLowerCase().includes(filters.email.toLowerCase())
        );
      }
      
      // Apply status filter
      if (filters.status) {
        const statusValue = filters.status === 'Active' ? 1 : 0;
        filtered = filtered.filter(user => user.status === statusValue);
      }
      
      // Apply date filter
      if (filters.date) {
        filtered = filtered.filter(user => {
          const userDate = new Date(user.date_added).toISOString().split('T')[0];
          return userDate === filters.date;
        });
      }
      
      setFilteredUsers(filtered);
      setCurrentPage(1); // Reset to first page when filters change
    } else {
      setFilteredUsers([]);
    }
  }, [filters, users]);

  // Initialize Lucide icons after render
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [users, selectedUsers]);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError('');
        const response = await userService.deleteUser(userId);
        
        if (response && response.success) {
          // Refresh the users list after successful deletion
          const updatedUsers = users.filter(user => user.user_id !== userId);
          setUsers(updatedUsers);
          // Remove from selected if it was selected
          setSelectedUsers(selectedUsers.filter(id => id !== userId));
          // Show success message (optional)
          alert('User deleted successfully!');
        } else {
          throw new Error(response?.message || 'Failed to delete user');
        }
      } catch (err) {
        setError(err.message || 'Failed to delete user');
        alert('Error: ' + (err.message || 'Failed to delete user'));
      }
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.user_id));
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    const statusText = status === 1 ? 'Active' : 'Inactive';
    if (!window.confirm(`Are you sure you want to set ${selectedUsers.length} user(s) to ${statusText}?`)) {
      return;
    }

    setBulkUpdating(true);
    setError('');

    try {
      // Update each selected user's status using existing user data
      const updatePromises = selectedUsers.map(async (userId) => {
        const user = users.find(u => u.user_id === userId);
        if (!user) return null;

        // Update with new status using current user data
        const updateData = {
          username: user.username,
          first_name: user.first_name || user.firstname,
          last_name: user.last_name || user.lastname,
          email: user.email,
          telephone: user.telephone || null,
          user_group_id: user.user_group_id,
          status: status
        };

        return await userService.updateUser(userId, updateData);
      });

      await Promise.all(updatePromises);

      const count = selectedUsers.length;

      // Refresh the users list
      const response = await userService.getUsers();
      if (response && response.success) {
        setUsers(response.data);
        setSelectedUsers([]);
        alert(`${count} user(s) updated to ${statusText} successfully!`);
      }
    } catch (err) {
      setError(err.message || 'Failed to update users');
      alert('Error: ' + (err.message || 'Failed to update users'));
    } finally {
      setBulkUpdating(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // Function to get status text
  const getStatusText = (status) => {
    return status === 1 ? 'Active' : 'Inactive';
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.length > 0 ? filteredUsers.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="header-title">Users List</h4>
              <div className="d-flex gap-2 align-items-center">
                {selectedUsers.length > 0 && (() => {
                  const selected = users.filter(u => selectedUsers.includes(u.user_id));
                  const activeCount = selected.filter(u => u.status === 1).length;
                  const inactiveCount = selected.filter(u => u.status === 0).length;
                  const onlyActive = activeCount > 0 && inactiveCount === 0;
                  const onlyInactive = inactiveCount > 0 && activeCount === 0;
                  return (
                    <>
                      {(onlyInactive || (!onlyActive && !onlyInactive)) && (
                        <button
                          className="btn btn-success"
                          onClick={() => handleBulkStatusUpdate(1)}
                          disabled={bulkUpdating}
                        >
                          <i data-lucide="check-circle" style={{width: '16px', height: '16px', marginRight: '6px'}}></i>
                          Active ({inactiveCount || selectedUsers.length})
                        </button>
                      )}
                      {(onlyActive || (!onlyActive && !onlyInactive)) && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleBulkStatusUpdate(0)}
                          disabled={bulkUpdating}
                        >
                          <i data-lucide="x-circle" style={{width: '16px', height: '16px', marginRight: '6px'}}></i>
                          Inactive ({activeCount || selectedUsers.length})
                        </button>
                      )}
                    </>
                  );
                })()}
                <Link to="/users/add" className="btn btn-primary">
                  <i className="ri-add-line align-middle me-1"></i> Add User
                </Link>
              </div>
            </div>
            <div className="card-body">
              {/* Filter Section */}
              <div className="mb-4 p-3 bg-body-secondary rounded border">
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-semibold mb-2">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by username..."
                      value={filters.username}
                      onChange={(e) => setFilters({...filters, username: e.target.value})}
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold mb-2">Email</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by email..."
                      value={filters.email}
                      onChange={(e) => setFilters({...filters, email: e.target.value})}
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold mb-2">Status</label>
                    <select
                      className="form-select"
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                      <option value="">All</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label fw-semibold mb-2">Date Added</label>
                    <input
                      type="date"
                      className="form-control"
                      value={filters.date}
                      onChange={(e) => setFilters({...filters, date: e.target.value})}
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
                      onClick={() => setFilters({username: '', email: '', status: '', date: ''})}
                    >
                      <i data-lucide="x"></i> Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="table-responsive">
                <table className="table table-striped table-centered mb-0">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={handleSelectAll}
                          className="form-check-input"
                        />
                      </th>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>User Group</th>
                      <th>Status</th>
                      <th>Date Added</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((user) => (
                      <tr key={user.user_id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.user_id)}
                            onChange={() => handleSelectUser(user.user_id)}
                            className="form-check-input"
                          />
                        </td>
                        <td>{user.user_id}</td>
                        <td>{user.username}</td>
                        <td>{user.first_name || user.firstname} {user.last_name || user.lastname}</td>
                        <td>{user.email}</td>
                        <td>{userGroupMap[user.user_group_id] || 'N/A'}</td>
                        <td>
                          <span className={`badge bg-${user.status === 1 ? 'success' : 'danger'}`}>
                            {getStatusText(user.status)}
                          </span>
                        </td>
                        <td>{new Date(user.date_added).toLocaleDateString()}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <Link 
                              to={`/users/edit/${user.user_id}`} 
                              className="btn btn-sm btn-outline-warning"
                              title="Edit User"
                            >
                              <i data-lucide="edit" style={{width: '16px', height: '16px'}}></i>
                            </Link>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteUser(user.user_id)}
                              title="Delete User"
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
                totalItems={filteredUsers.length}
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

export default UsersList;
