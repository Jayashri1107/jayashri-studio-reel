import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { userService } from '../../Services/userService';

const EditUser = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    telephone: '',
    user_group_id: 3,
    status: 1
  });
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [userGroupError, setUserGroupError] = useState('');


  useEffect(() => {
    // Fetch user groups from database
    const fetchUserGroups = async () => {
      try {
        const response = await userService.getUserGroups();
        
        if (response && response.success) {
          setUserGroups(response.data);
        } else {
          throw new Error(response?.message || 'Failed to fetch user groups');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch user groups');
      }
    };

    // Fetch user details
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await userService.getUserById(id);
        
        if (response && response.success) {
          setFormData({
            username: response.data.username,
            firstname: response.data.first_name || response.data.firstname,
            lastname: response.data.last_name || response.data.lastname,
            email: response.data.email,
            telephone: response.data.telephone || '',
            user_group_id: response.data.user_group_id,
            status: response.data.status
          });
        } else {
          throw new Error(response?.message || 'Failed to fetch user details');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch user details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserGroups();
      fetchUserDetails();
    }
  }, [id]);

  const validateUsername = (username) => {
    const trimmed = String(username || '').trim();
    if (!trimmed) return 'Username is required';
    if (trimmed.length < 3) return 'Username must be at least 3 characters';
    if (trimmed.length > 20) return 'Username must be less than 20 characters';
    if (!/^[a-zA-Z0-9]+$/.test(trimmed)) return 'Username must contain only letters and numbers';
    return '';
  };

  const validateEmail = (email) => {
    const trimmed = String(email || '').trim();
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;
    if (!trimmed) return 'Email is required';
    if (!emailRegex.test(trimmed)) return 'Please enter a valid email address';
    return '';
  };
  
  const validatePhone = (phone) => {
    const v = String(phone || '').trim();
    if (!v) return '';
    const digits = v.replace(/\D/g, '');
    if (digits.length !== 10) {
      return 'Phone number must be exactly 10 digits';
    }
    if (digits.startsWith('000')) {
      return 'Phone number cannot start with 000';
    }
    // Check if all digits are the same (e.g., 1111111111)
    if (/^(\d)\1{9}$/.test(digits)) {
      return 'Phone number cannot have all same digits';
    }
    // Check if it's a sequence like 1234567890
    if (digits === '1234567890' || digits === '0987654321') {
      return 'Invalid phone number pattern';
    }
    return '';
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    
    // Validate username
    if (name === 'username') {
      const error = validateUsername(value);
      setUsernameError(error);
    }
    
    // Validate first name
    if (name === 'firstname') {
      if (!value) {
        setFirstNameError('First name is required');
      } else if (value.length < 2) {
        setFirstNameError('First name must be at least 2 characters');
      } else {
        setFirstNameError('');
      }
    }
    
    // Validate last name
    if (name === 'lastname') {
      if (!value) {
        setLastNameError('Last name is required');
      } else if (value.length < 2) {
        setLastNameError('Last name must be at least 2 characters');
      } else {
        setLastNameError('');
      }
    }
    
    // Validate email
    if (name === 'email') {
      const error = validateEmail(value);
      setEmailError(error);
    }
    
    // Validate phone
    if (name === 'telephone') {
      const error = validatePhone(value);
      setPhoneError(error);
    }
    
    // Validate user group
    if (name === 'user_group_id') {
      if (!value) {
        setUserGroupError('Please select a user group');
      } else {
        setUserGroupError('');
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    
    // Validate all required fields
    const usernameValidation = validateUsername(formData.username);
    if (usernameValidation) {
      setUsernameError(usernameValidation);
      setSaving(false);
      return;
    }
    
    if (!formData.firstname || formData.firstname.length < 2) {
      setFirstNameError(!formData.firstname ? 'First name is required' : 'First name must be at least 2 characters');
      setSaving(false);
      return;
    }
    
    if (!formData.lastname || formData.lastname.length < 2) {
      setLastNameError(!formData.lastname ? 'Last name is required' : 'Last name must be at least 2 characters');
      setSaving(false);
      return;
    }
    
    if (formData.firstname.length > 255) {
      setFirstNameError('First name must be at most 255 characters');
      setSaving(false);
      return;
    }
    
    if (formData.lastname.length > 255) {
      setLastNameError('Last name must be at most 255 characters');
      setSaving(false);
      return;
    }
    
    const emailValidation = validateEmail(formData.email);
    if (emailValidation) {
      setEmailError(emailValidation);
      setSaving(false);
      return;
    }
    
    if (formData.telephone) {
      const phoneValidation = validatePhone(formData.telephone);
      if (phoneValidation) {
        setPhoneError(phoneValidation);
        setSaving(false);
        return;
      }
    }
    
    // Validate user group
    if (!formData.user_group_id) {
      setUserGroupError('Please select a user group');
      setSaving(false);
      return;
    }
    
    try {
      // Prepare data for API call in the format expected by the server
      const userData = {
        username: formData.username,
        first_name: formData.firstname,
        last_name: formData.lastname,
        email: formData.email,
        telephone: formData.telephone || null,
        user_group_id: formData.user_group_id,
        status: formData.status
      };
      
      // Update in database
      await userService.updateUser(id, userData);
      
      // Redirect to users list after successful update
      navigate('/users');
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h4 className="header-title">Edit User</h4>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control bg-body text-body ${usernameError ? 'is-invalid' : ''}`}
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                  {usernameError && <div className="invalid-feedback">{usernameError}</div>}
                </div>
                
                <div className="mb-3">
                  <label htmlFor="firstname" className="form-label">First Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control bg-body text-body ${firstNameError ? 'is-invalid' : ''}`}
                    id="firstname"
                    name="firstname"
                    value={formData.firstname}
                    onChange={handleChange}
                    maxLength={255}
                    required
                  />
                  {firstNameError && <div className="invalid-feedback">{firstNameError}</div>}
                </div>
                
                <div className="mb-3">
                  <label htmlFor="lastname" className="form-label">Last Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className={`form-control bg-body text-body ${lastNameError ? 'is-invalid' : ''}`}
                    id="lastname"
                    name="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                    maxLength={255}
                    required
                  />
                  {lastNameError && <div className="invalid-feedback">{lastNameError}</div>}
                </div>
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email <span className="text-danger">*</span></label>
                  <input
                    type="email"
                    className={`form-control bg-body text-body ${emailError ? 'is-invalid' : ''}`}
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {emailError && <div className="invalid-feedback">{emailError}</div>}
                </div>
                
                <div className="mb-3">
                  <label htmlFor="telephone" className="form-label">Phone</label>
                  <input
                    type="tel"
                    className={`form-control bg-body text-body ${phoneError ? 'is-invalid' : ''}`}
                    id="telephone"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    inputMode="tel"
                    placeholder="e.g., +1 555-123-4567"
                  />
                  {phoneError && <div className="invalid-feedback">{phoneError}</div>}
                </div>
                
                <div className="mb-3">
                  <label htmlFor="user_group_id" className="form-label">User Group <span className="text-danger">*</span></label>
                  <select
                    className={`form-select bg-body text-body ${userGroupError ? 'is-invalid' : ''}`}
                    id="user_group_id"
                    name="user_group_id"
                    value={formData.user_group_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select User Group</option>
                    {userGroups.map(group => (
                      <option key={group.user_group_id} value={group.user_group_id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  {userGroupError && <div className="invalid-feedback">{userGroupError}</div>}
                </div>
                
                <div className="mb-3">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    className="form-select bg-body text-body"
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Update User'}
                </button>
                <Link to="/users" className="btn btn-secondary ms-2">Cancel</Link>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditUser;