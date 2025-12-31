import React, { useState, useEffect, useRef } from 'react';
import api from '../../Config/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../Config/constants';

export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
    
    const load = async () => {
      try {
        const resp = await api.get('/Users/me');
        if (resp.data?.success) {
          const u = resp.data.user;
          setProfileData({
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            email: u.email || '',
            phone: u.phone || ''
          });
          setFormData({
            firstName: u.firstName || '',
            lastName: u.lastName || '',
            email: u.email || '',
            phone: u.phone || ''
          });
          if (u.image) {
            setPreviewImage(`${BASE_URL}${u.image}`);
            setImageLoaded(true);
          } else {
            setPreviewImage(null);
            setImageLoaded(false);
          }
        }
      } catch (e) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Reinitialize Lucide icons when component updates
  useEffect(() => {
    if (window.lucide) {
      setTimeout(() => {
        window.lucide.createIcons();
      }, 0);
    }
  }, [previewImage, loading]);

  const isValidEmail = (em) => {
    const e = String(em || '').trim();
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(e)) return false;
    const parts = e.split('@');
    if (parts.length !== 2) return false;
    const domainParts = parts[1].split('.');
    if (domainParts.length < 2) return false;
    const tld = domainParts.pop() || '';
    const sld = domainParts.pop() || '';
    return sld.length >= 3 && tld.length >= 3;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const sanitized =
      name === 'firstName' || name === 'lastName'
        ? value.replace(/^\s+/, '')
        : name === 'phone'
        ? value.replace(/\D/g, '').slice(0, 10)
        : value;
    setFormData(prev => ({
      ...prev,
      [name]: sanitized
    }));
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        toast.error('Please select an image file (JPG, PNG, etc.)');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size exceeds 5MB limit');
        return;
      }
      
      setImageFile(file);
      
      // Create preview
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage(imageUrl);
      setImageLoaded(true); // For local files, we can consider them loaded immediately
    }
  };

  const triggerFileSelect = () => {
    if (!loading) {
      fileInputRef.current.click();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validations
    const phoneRegex = /^(?!([0-9])\1{9})[1-9][0-9]{9}$/;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    if (!isValidEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (formData.phone && !phoneRegex.test(formData.phone.trim())) {
      toast.error('Enter a valid 10-digit mobile number (no leading 0, not all same)');
      return;
    }

    setLoading(true);
    
    try {
      // Update basic info
      await api.put('/Users/profile', {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        mobile: formData.phone ? formData.phone.trim() : null
      });

      // Upload image if selected
      if (imageFile) {
        const fd = new FormData();
        fd.append('profileImage', imageFile);
        const up = await api.post('/Users/profile/image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (!up.data?.success) {
          throw new Error(up.data?.message || 'Image upload failed');
        }
      }

      // Refresh local user
      const resp = await api.get('/Users/me');
      if (resp.data?.success) {
        localStorage.setItem('user', JSON.stringify(resp.data.user));
        window.dispatchEvent(new Event('user-updated'));
        setProfileData({
          firstName: resp.data.user.firstName || '',
          lastName: resp.data.user.lastName || '',
          email: resp.data.user.email || '',
          phone: resp.data.user.phone || ''
        });
        setFormData({
          firstName: resp.data.user.firstName || '',
          lastName: resp.data.user.lastName || '',
          email: resp.data.user.email || '',
          phone: resp.data.user.phone || ''
        });
        if (resp.data.user.image) {
          setPreviewImage(`${BASE_URL}${resp.data.user.image}`);
          setImageLoaded(true);
        } else {
          setPreviewImage(null);
          setImageLoaded(false);
        }
      }
      
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const displayName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || 'Admin User';
  const displayEmail = profileData.email || '';
  const profileImageUrl = previewImage;

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-dark">Loading profile...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="page-title-box d-flex align-items-center justify-content-between">
            <h4 className="page-title mb-0 text-dark">Edit Profile</h4>
            <button 
              className="btn btn-outline-secondary d-inline-flex align-items-center justify-content-center"
              onClick={() => navigate('/profile')}
              aria-label="Back"
              title="Back"
              style={{ width: '36px', height: '36px', borderRadius: '50%' }}
            >
              <i data-lucide="arrow-left" className="icon-sm"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row">
                  {/* Profile Picture Section */}
                  <div className="col-lg-4">
                    <div className="text-center mb-4">
                      <div 
                        className="mx-auto mb-3 position-relative"
                        style={{ width: '150px', height: '150px', cursor: loading ? 'not-allowed' : 'pointer' }}
                        onClick={triggerFileSelect}
                      >
                        {/* Hidden default avatar that shows while loading */}
                        {!imageLoaded && (
                          <div 
                            className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                            style={{ width: '150px', height: '150px' }}
                          >
                            <i className="ri-user-line ri-3x text-muted"></i>
                          </div>
                        )}
                        
                        {/* Profile image with onLoad handler */}
                        <img 
                          src={profileImageUrl} 
                          alt={displayName} 
                          className="rounded-circle"
                          style={{ 
                            width: '150px', 
                            height: '150px', 
                            objectFit: 'cover',
                            display: imageLoaded ? 'block' : 'none'
                          }}
                          onLoad={handleImageLoad}
                          onError={() => {
                            setImageLoaded(false);
                            setPreviewImage(null);
                          }}
                        />
                        <div 
                          className="position-absolute bottom-0 end-0 bg-primary rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '40px', height: '40px', cursor: loading ? 'not-allowed' : 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!loading) {
                              triggerFileSelect();
                            }
                          }}
                        >
                          {loading ? (
                            <span className="spinner-border spinner-border-sm text-white" role="status"></span>
                          ) : (
                            <i data-lucide="camera" className="icon-sm text-white"></i>
                          )}
                        </div>
                      </div>
                      <h5 className="mb-1 text-dark">{displayName}</h5>
                      <p className="text-body mb-0">{displayEmail}</p>
                      <p className="text-body small">Click on the image to change profile picture</p>
                    </div>
                  </div>
                  
                  {/* Profile Form Section */}
                  <div className="col-lg-8">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="firstName" className="form-label text-dark">
                            First Name   <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            disabled={loading}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="lastName" className="form-label text-dark">
                            Last Name   <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            disabled={loading}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="email" className="form-label text-dark">
                            Email  <span className="text-danger">*</span>
                          </label>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            disabled={loading}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label htmlFor="phone" className="form-label text-dark">
                            Phone
                          </label>
                          <input
                            type="tel"
                            className="form-control"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            disabled={loading}
                            inputMode="numeric"
                            maxLength={10}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/profile')}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
        disabled={loading}
      />
    </div>
  );
}
