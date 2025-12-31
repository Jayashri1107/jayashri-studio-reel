import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import InfluencerService from '../../Services/InfluencerService';

export default function EditInfluencer() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [influencerData, setInfluencerData] = useState({
        firstname: '',
        lastname: '',
        email: '',
        telephone: '',
        platform: '',
        account_link: '',
        status: 'pending'
    });
    const [platformLinks, setPlatformLinks] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) {
            fetchInfluencerDetails();
        } else {
            toast.error('No influencer ID provided');
            navigate('/influencers');
        }
    }, [id]);

    const fetchInfluencerDetails = async () => {
        try {
            setLoading(true);
            const response = await InfluencerService.getInfluencerById(id);
            
            if (response.success && response.data) {
                const influencer = response.data;
                // Convert database status integer to string
                const statusString = getStatusString(influencer.status);
                const platforms = (influencer.platform || '').split(',').map(p => p.trim()).filter(Boolean);
                const accountLinks = (influencer.account_link || '').split(',').map(l => l.trim()).filter(Boolean);
                
                // Create platform links object
                const linksObj = {};
                platforms.forEach((platform, index) => {
                    linksObj[platform] = accountLinks[index] || '';
                });
                
                setInfluencerData({
                    firstname: influencer.firstname || '',
                    lastname: influencer.lastname || '',
                    email: influencer.email || '',
                    telephone: influencer.telephone || '',
                    platform: influencer.platform || '',
                    account_link: influencer.account_link || '',
                    status: statusString
                });
                setPlatformLinks(linksObj);
                // Force re-render to update select value
                setTimeout(() => {
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }, 100);
            } else {
                toast.error(response.message || 'Influencer not found');
                navigate('/influencers');
            }
        } catch (error) {
            console.error('Error fetching influencer details:', error);
            toast.error('Failed to load influencer details');
            navigate('/influencers');
        } finally {
            setLoading(false);
        }
    };

    // Convert database status integer to string
    const getStatusString = (status) => {
        switch (status) {
            case 1:
                return 'approved';
            case 2:
                return 'rejected';
            case 0:
            default:
                return 'pending';
        }
    };

    // Convert frontend status string to database integer
    const getStatusInteger = (status) => {
        switch (status) {
            case 'approved':
                return 1;
            case 'rejected':
                return 2;
            case 'pending':
            default:
                return 0;
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const sanitized =
            name === 'firstname' || name === 'lastname'
                ? value.replace(/^\s+/, '')
                : value;
        setInfluencerData(prev => ({
            ...prev,
            [name]: sanitized
        }));
        
        // Update platform links when platform field changes
        if (name === 'platform') {
            const platforms = sanitized.split(',').map(p => p.trim()).filter(Boolean);
            const newLinks = {};
            platforms.forEach(platform => {
                newLinks[platform] = platformLinks[platform] || '';
            });
            setPlatformLinks(newLinks);
        }
    };
    
    const handlePlatformLinkChange = (platform, link) => {
        setPlatformLinks(prev => ({
            ...prev,
            [platform]: link
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!influencerData.firstname || !influencerData.lastname) {
            toast.error('First name and last name are required');
            return;
        }
        
        if (!influencerData.email) {
            toast.error('Email is required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(influencerData.email.trim())) {
            toast.error('Please enter a valid email address');
            return;
        }

        if (influencerData.telephone && !/^\+?[0-9]{7,15}$/.test(influencerData.telephone.trim())) {
            toast.error('Please enter a valid phone number (7-15 digits, optional +)');
            return;
        }

        try {
            setSaving(true);
            
            // Convert status string back to integer for API
            const statusInt = getStatusInteger(influencerData.status);
            
            // Combine platform links back into comma-separated string
            const platforms = influencerData.platform.split(',').map(p => p.trim()).filter(Boolean);
            const combinedLinks = platforms.map(platform => platformLinks[platform] || '').filter(Boolean).join(',');
            
            // Update influencer via API using InfluencerService
            const response = await InfluencerService.updateInfluencer(id, {
                status: statusInt,
                firstname: influencerData.firstname.trim(),
                lastname: influencerData.lastname.trim(),
                email: influencerData.email.trim(),
                telephone: influencerData.telephone?.trim() || null,
                platform: influencerData.platform || null,
                account_link: combinedLinks || null
            });
            
            if (response.success) {
                toast.success('Influencer updated successfully');
                navigate('/influencers');
            } else {
                toast.error(response.message || 'Failed to update influencer');
            }
        } catch (error) {
            console.error('Error updating influencer:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to update influencer';
            toast.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [influencerData]);

    if (loading) {
        return (
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body text-center py-5">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Edit Influencer</h4>
                        </div>
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => navigate('/influencers')}
                        >
                            <i data-lucide="arrow-left"></i>
                            &nbsp;Back
                        </button>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSave}>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-normal">First Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control bg-body text-body"
                                        name="firstname"
                                        value={influencerData.firstname}
                                        onChange={handleInputChange}
                                        placeholder="Enter first name"
                                        required
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-normal">Last Name <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control bg-body text-body"
                                        name="lastname"
                                        value={influencerData.lastname}
                                        onChange={handleInputChange}
                                        placeholder="Enter last name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Email <span className="text-danger">*</span></label>
                                <input
                                    type="email"
                                    className="form-control bg-body text-body"
                                    name="email"
                                    value={influencerData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter email address"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Telephone</label>
                                <input
                                    type="tel"
                                    className="form-control bg-body text-body"
                                    name="telephone"
                                    value={influencerData.telephone}
                                    onChange={handleInputChange}
                                    placeholder="Enter telephone number"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Platform</label>
                                <input
                                    type="text"
                                    className="form-control bg-body text-body"
                                    name="platform"
                                    value={influencerData.platform || ''}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Instagram, YouTube, TikTok (comma-separated)"
                                />
                                {influencerData.platform && (
                                    <div className="mt-2">
                                        <small className="text-body mb-0">Platforms:</small>
                                        <div className="d-flex flex-wrap gap-2">
                                            {influencerData.platform
                                                .split(',')
                                                .map(p => p.trim())
                                                .filter(Boolean)
                                                .map((platform, idx) => (
                                                    <span key={idx} className="badge bg-primary">
                                                        {platform}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Profile Links</label>
                                {influencerData.platform ? (
                                    influencerData.platform
                                        .split(',')
                                        .map(p => p.trim())
                                        .filter(Boolean)
                                        .map((platform, idx) => (
                                            <div key={idx} className="mb-2">
                                                <label className="text-body mb-0">{platform} Link</label>
                                <input
                                    type="url"
                                    className="form-control bg-body text-body"
                                                    value={platformLinks[platform] || ''}
                                                    onChange={(e) => handlePlatformLinkChange(platform, e.target.value)}
                                                    placeholder={`https://${platform.toLowerCase()}.com/...`}
                                />
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-muted small">Add platforms above to enter profile links</p>
                                )}
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Status</label>
                                <select
                                    className="form-select bg-body text-body"
                                    name="status"
                                    value={influencerData.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div className="d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/influencers')}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <i data-lucide="save"></i>
                                            &nbsp;Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
