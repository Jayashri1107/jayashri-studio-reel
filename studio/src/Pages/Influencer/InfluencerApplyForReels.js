import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const InfluencerApplyForReels = ({ onClose }) => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    platforms: [],
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirm: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const validateProfileUrl = (url, platform) => {
    const u = (url || '').trim();
    const p = (platform || '').toLowerCase();
    if (p === 'instagram') {
      const instagramRegex = /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?(?:\?.*)?$/i;
      return instagramRegex.test(u);
    }
    if (p === 'youtube') {
      const youtubeRegex = /^https?:\/\/(www\.)?(youtube\.com\/(?:@[A-Za-z0-9._-]+|(?:channel|user|c)\/[A-Za-z0-9._-]+)|youtu\.be\/[A-Za-z0-9_-]+)(?:\/.*|\?.*)?$/i;
      return youtubeRegex.test(u);
    }
    return true;
  };

  const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'Facebook', 'Twitter', 'Other'];

  const togglePlatform = (platform, checked) => {
    setFormData(prev => {
      const exists = prev.platforms.find(p => (p.platform || '').toLowerCase() === platform.toLowerCase());
      if (checked && !exists) {
        return { ...prev, platforms: [...prev.platforms, { platform, links: [''] }] };
      }
      if (!checked && exists) {
        return { ...prev, platforms: prev.platforms.filter(p => (p.platform || '').toLowerCase() !== platform.toLowerCase()) };
      }
      return prev;
    });
  };

  const addPlatformLink = (index) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.map((entry, i) => i === index ? { ...entry, links: [...(entry.links || []), ''] } : entry)
    }));
  };

  const removePlatformLink = (index, linkIndex) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.map((entry, i) => i === index ? { ...entry, links: entry.links.filter((_, li) => li !== linkIndex) } : entry)
    }));
  };

  const handlePlatformLinkChange = (index, linkIndex, value) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.map((entry, i) => {
        if (i !== index) return entry;
        const links = [...(entry.links || [])];
        links[linkIndex] = value;
        return { ...entry, links };
      })
    }));
  };
  
  const isDuplicateLinkInForm = (value) => {
    const v = (value || '').trim().toLowerCase();
    if (!v) return false;
    let count = 0;
    for (const entry of formData.platforms || []) {
      for (const l of (entry.links || [])) {
        if ((l || '').trim().toLowerCase() === v) count++;
      }
    }
    return count > 1;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.firstName) {
      setError('First name is required');
      return;
    }
    
    if (!formData.lastName) {
      setError('Last name is required');
      return;
    }
    
    if (!formData.email) {
      setError('Email is required');
      return;
    }
    
    if (!formData.mobile) {
      setError('Mobile number is required');
      return;
    }
    
    if (!formData.platforms || formData.platforms.length === 0) {
      setError('Please add at least one social media platform');
      return;
    }
    
    for (let i = 0; i < formData.platforms.length; i++) {
      const entry = formData.platforms[i];
      if (!entry.platform) {
        setError('Please select a platform for entry ' + (i + 1));
        return;
      }
      const links = entry.links || [];
      if (links.length === 0 || links.every(l => !l || !l.trim())) {
        setError('Please add at least one profile URL for ' + entry.platform);
        return;
      }
      for (let li = 0; li < links.length; li++) {
        const link = links[li];
        // Duplicate warning across current form entries
        if (isDuplicateLinkInForm(link)) {
          setError('An account with this link already exists');
          return;
        }
        if (!validateProfileUrl(link, entry.platform)) {
          if ((entry.platform || '').toLowerCase() === 'instagram') {
            setError('Invalid Instagram URL in ' + entry.platform + ' links (e.g., https://instagram.com/username)');
          } else if ((entry.platform || '').toLowerCase() === 'youtube') {
            setError('Invalid YouTube URL in ' + entry.platform + ' links (e.g., https://youtube.com/@username or channel)');
          } else {
            setError('Invalid profile URL in ' + entry.platform + ' links');
          }
          return;
        }
      }
    }
    
    if (!formData.password) {
      setError('Password is required');
      return;
    }
    
    const strongPwd = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPwd.test(formData.password)) {
      setError('Password must be 8+ chars with uppercase, number, and special character');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Single platform/url validation removed in favor of multi-platform validation above
    
    // Validate mobile number format (basic validation)
    const mobileRegex = /^[0-9]{10,12}$/;
    if (!mobileRegex.test(formData.mobile)) {
      setError('Please enter a valid mobile number (10-12 digits)');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Submit form data to backend
      const response = await fetch('/Studio/influencer/apply-for-reels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          mobile: formData.mobile,
          platform: formData.platforms[0]?.platform || '',
          accountLink: (formData.platforms[0]?.links || [])[0] || '',
          platforms: formData.platforms.map(p => ({ platform: p.platform, links: p.links })),
          password: formData.password
        }),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSuccess(true);
        toast.success("Application submitted successfully! You can now login.");
        
        // Close the modal and show login
        setTimeout(() => {
          if (onClose) {
            onClose();
            // Open the login modal
            window.dispatchEvent(new CustomEvent('openLoginModal', { detail: 'influencer-login' }));
          } else {
            navigate("/studio?message=pending_approval");
          }
        }, 2000);
      } else {
        const msg = (result && (result.message || result.error)) || '';
        const lower = (msg || '').toLowerCase();
        // Prioritize link duplicate over email duplicate when both are present
        if ((lower.includes('link') || lower.includes('profile')) && (lower.includes('exist') || lower.includes('already'))) {
          setError('An account with this link already exists');
        } else if (lower.includes('email') && (lower.includes('exist') || lower.includes('already'))) {
          setError('An account with this email already exists');
        } else if (lower.includes('mobile') && (lower.includes('exist') || lower.includes('already'))) {
          setError('This number already register with us');
        } else {
          setError(msg || 'Application failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Application error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-12">
          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button 
                type="button" 
                className="btn-close" 
                data-bs-dismiss="alert" 
                aria-label="Close"
                onClick={() => setError("")}
              ></button>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              Application successful! Redirecting to login page...
              <button 
                type="button" 
                className="btn-close" 
                data-bs-dismiss="alert" 
                aria-label="Close"
                onClick={() => setSuccess(false)}
              ></button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="mt-3">
            <div className="mb-3">
              <label htmlFor="firstName" className="form-label">
                <i className="fas fa-user me-2"></i>First Name
              </label>
              <input
                type="text"
                className="form-control form-control-lg rounded"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="Enter your first name"
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="lastName" className="form-label">
                <i className="fas fa-user me-2"></i>Last Name
              </label>
              <input
                type="text"
                className="form-control form-control-lg rounded"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Enter your last name"
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                <i className="fas fa-envelope me-2"></i>Email Address
              </label>
              <input
                type="email"
                className="form-control form-control-lg rounded"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="mobile" className="form-label">
                <i className="fas fa-mobile-alt me-2"></i>Mobile Number
              </label>
              <input
                type="tel"
                className="form-control form-control-lg rounded"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
                inputMode="numeric"
                pattern="^[0-9]{10,12}$"
                placeholder="Enter your mobile number"
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">
                <i className="fas fa-hashtag me-2"></i>Social Media Platforms <span className="text-danger">*</span>
              </label>
              <div className="row">
                {PLATFORMS.map((p) => {
                  const isChecked = !!formData.platforms.find(e => (e.platform || '').toLowerCase() === p.toLowerCase());
                  return (
                    <div className="col-sm-6 col-md-4 mb-2" key={p}>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`platform-${p}`}
                          checked={isChecked}
                          onChange={(e) => togglePlatform(p, e.target.checked)}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor={`platform-${p}`}>{p}</label>
                  </div>
                </div>
                  );
                })}
              </div>
            </div>
            {formData.platforms.length > 0 && (
              <div className="mb-3">
                {formData.platforms.map((entry, index) => (
                  <div className="mb-3" key={index}>
                    <div className="fw-semibold mb-2">{entry.platform}</div>
                    {(entry.links || []).map((link, li) => (
                      <div className="d-flex gap-2 mb-2" key={li}>
                        <input
                          type="url"
                          className="form-control"
                          placeholder={`Enter ${entry.platform} profile URL`}
                          value={link}
                          onChange={(e) => handlePlatformLinkChange(index, li, e.target.value)}
                          required
                          disabled={loading}
                        />
                        {isDuplicateLinkInForm(link) && (
                          <div className="text-danger small ms-2">An account with this link already exists</div>
                        )}
                        {(entry.links || []).length > 1 && (
                          <button type="button" className="btn btn-outline-danger" onClick={() => removePlatformLink(index, li)} disabled={loading}>Remove</button>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                <i className="fas fa-lock me-2"></i>Password
              </label>
              <div className="input-group input-group-lg">
                <input
                  type={formData.showPassword ? "text" : "password"}
                  className="form-control"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  aria-label="Toggle password visibility"
                >
                  <i className={formData.showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>
              <div className="form-text">Use 8+ chars, uppercase, number, and special character</div>
            </div>

            
            
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                <i className="fas fa-lock me-2"></i>Confirm Password
              </label>
              <div className="input-group input-group-lg">
                <input
                  type={formData.showConfirm ? "text" : "password"}
                  className="form-control"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm your password"
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, showConfirm: !prev.showConfirm }))}
                  aria-label="Toggle confirm password visibility"
                >
                  <i className={formData.showConfirm ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>
            </div>
            
            <div className="d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary d-flex align-items-center justify-content-center gap-1 fw-medium"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InfluencerApplyForReels;
