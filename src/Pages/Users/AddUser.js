import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { userService } from '../../Services/userService';

const AddUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    telephone: '',
    password: '',
    confirmPassword: '',
    user_group_id: '', // Require manual selection
    status: 1, // Default to Active (1 = Active, 0 = Inactive)
    showPassword: false,
    showConfirmPassword: false
  });
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
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
          // Do not auto-select; user must choose a group
        } else {
          throw new Error(response?.message || 'Failed to fetch user groups');
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch user groups');
      }
    };

    fetchUserGroups();
    
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  // Initialize Lucide icons after render
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.lucide) {
        window.lucide.createIcons();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [formData.status]);

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
    let value = e.target.value;
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      value = value.replace(/\s/g, '');
    }
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    
    // Clear password error when user starts typing
    if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
      setPasswordError('');
    }
    
    // Validate username
    if (e.target.name === 'username') {
      const error = validateUsername(value);
      setUsernameError(error);
    }
    
    // Validate first name and last name length (2–255), allow any characters
    if (e.target.name === 'firstname') {
      if (!value) {
        setFirstNameError('First name is required');
      } else if (value.length < 2) {
        setFirstNameError('First name must be at least 2 characters');
      } else {
        setFirstNameError('');
      }
    }
    if (e.target.name === 'lastname') {
      if (!value) {
        setLastNameError('Last name is required');
      } else if (value.length < 2) {
        setLastNameError('Last name must be at least 2 characters');
      } else {
        setLastNameError('');
      }
    }
    if (e.target.name === 'email') {
      const error = validateEmail(value);
      setEmailError(error);
    }
    if (e.target.name === 'telephone') {
      const error = validatePhone(value);
      setPhoneError(error);
    }
    if (e.target.name === 'user_group_id') {
      setUserGroupError('');
    }
  };

  const togglePasswordVisibility = (field) => {
    setFormData(prevFormData => ({
      ...prevFormData,
      [field]: !prevFormData[field]
    }));
  };

  const isStrongPassword = (password) => {
    // Check if password meets requirements:
    // 8+ characters with at least one uppercase, one lowercase, one number, and one special character
    const strongPasswordRegex = /^(?!.*\s)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    return strongPasswordRegex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Username validation
    const usernameValidation = validateUsername(formData.username);
    if (usernameValidation) {
      setUsernameError(usernameValidation);
      return;
    }
    
    // Name validations
    if (!formData.firstname || formData.firstname.length < 2) {
      setFirstNameError(!formData.firstname ? 'First name is required' : 'First name must be at least 2 characters');
      return;
    }
    if (!formData.lastname || formData.lastname.length < 2) {
      setLastNameError(!formData.lastname ? 'Last name is required' : 'Last name must be at least 2 characters');
      return;
    }
    if (formData.firstname.length > 255) {
      setFirstNameError('First name must be at most 255 characters');
      return;
    }
    if (formData.lastname.length > 255) {
      setLastNameError('Last name must be at most 255 characters');
      return;
    }
    
    // Email validation
    const emailValidation = validateEmail(formData.email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    
    // Require user group selection
    if (!formData.user_group_id) {
      setUserGroupError('Please select a user group');
      return;
    }
    
    if (formData.telephone) {
      const telError = validatePhone(formData.telephone);
      if (telError) {
        setPhoneError(telError);
        return;
      }
    }
    
    // Password validation
    if (!formData.password) {
      setPasswordError('Password is required');
      return;
    }
    
    if (!isStrongPassword(formData.password)) {
      setPasswordError('Use 8+ characters with upper, lower, number, and special character');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    setPasswordError('');
    
    try {
      // Prepare data for API call in the format expected by the server
      const userData = {
        username: formData.username,
        firstname: formData.firstname,
        lastname: formData.lastname,
        email: formData.email,
        telephone: formData.telephone || null,
        password: formData.password,
        user_group_id: Number(formData.user_group_id),
        status: formData.status
      };
      
      // Save to database
      await userService.createUser(userData);
      
      // Redirect to users list after successful creation
      navigate('/users');
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h4 className="header-title">Add New User</h4>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => navigate('/users')}
              >
                <i className="ri-arrow-left-line me-1"></i> Back
              </button>
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
                  {!firstNameError && <div className="form-text">Enter 2–255 characters. Numbers are allowed.</div>}
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
                  {!lastNameError && <div className="form-text">Enter 2–255 characters. Numbers are allowed.</div>}
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
                  {!emailError && <div className="form-text">Example: user@example.com</div>}
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
                  {!phoneError && <div className="form-text">Digits only: 10–15 digits accepted. Formatting allowed.</div>}
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input
                      type={formData.showPassword ? "text" : "password"}
                      className={`form-control bg-body text-body ${passwordError ? 'is-invalid' : ''}`}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => togglePasswordVisibility('showPassword')}
                    >
                      <i data-lucide={formData.showPassword ? "eye-off" : "eye"}></i>
                    </button>
                  </div>
                  <div className="form-text">Use 8+ characters with upper, lower, number, and special character</div>
                  {passwordError && <div className="invalid-feedback">{passwordError}</div>}
                </div>
                
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password <span className="text-danger">*</span></label>
                  <div className="input-group">
                    <input
                      type={formData.showConfirmPassword ? "text" : "password"}
                      className={`form-control bg-body text-body ${passwordError ? 'is-invalid' : ''}`}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => togglePasswordVisibility('showConfirmPassword')}
                    >
                      <i data-lucide={formData.showConfirmPassword ? "eye-off" : "eye"}></i>
                    </button>
                  </div>
                  {passwordError && <div className="invalid-feedback">{passwordError}</div>}
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
                  <label className="form-label">Status</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn ${formData.status === 1 ? 'btn-success' : 'btn-outline-success'}`}
                      onClick={() => setFormData({ ...formData, status: 1 })}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      className={`btn ${formData.status === 0 ? 'btn-danger' : 'btn-outline-danger'}`}
                      onClick={() => setFormData({ ...formData, status: 0 })}
                    >
                      Inactive
                    </button>
                  </div>
                </div>
                
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Add User'}
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

export default AddUser;
