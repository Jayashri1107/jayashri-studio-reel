import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../Config/axios';

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
            const response = await api.get('/Studio/influencer/applications');
            
            if (response.data.success && Array.isArray(response.data.data)) {
                const influencer = response.data.data.find(inf => inf.id === parseInt(id));
                if (influencer) {
                    // Convert database status integer to string
                    const statusString = getStatusString(influencer.status);
                    setInfluencerData({
                        firstname: influencer.firstname || '',
                        lastname: influencer.lastname || '',
                        email: influencer.email || '',
                        telephone: influencer.telephone || '',
                        platform: influencer.platform || '',
                        account_link: influencer.account_link || '',
                        status: statusString
                    });
                } else {
                    toast.error('Influencer not found');
                    navigate('/influencers');
                }
            } else {
                toast.error('Failed to fetch influencer details');
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
        setInfluencerData(prev => ({
            ...prev,
            [name]: value
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

        try {
            setSaving(true);
            
            // Convert status string back to integer for API
            const statusInt = getStatusInteger(influencerData.status);
            
            // Update influencer via API
            const response = await api.put(`/Studio/influencer/${id}`, {
                status: statusInt,
                firstname: influencerData.firstname.trim(),
                lastname: influencerData.lastname.trim(),
                email: influencerData.email.trim(),
                telephone: influencerData.telephone?.trim() || null,
                platform: influencerData.platform || null,
                account_link: influencerData.account_link?.trim() || null
            });
            
            if (response.data.success) {
                toast.success('Influencer updated successfully');
                navigate('/influencers');
            } else {
                toast.error(response.data.message || 'Failed to update influencer');
            }
        } catch (error) {
            console.error('Error updating influencer:', error);
            toast.error(error.response?.data?.message || 'Failed to update influencer');
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
                                <select
                                    className="form-select bg-body text-body"
                                    name="platform"
                                    value={influencerData.platform}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select Platform</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="YouTube">YouTube</option>
                                    <option value="TikTok">TikTok</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="Twitter">Twitter</option>
                                    <option value="LinkedIn">LinkedIn</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Profile Link</label>
                                <input
                                    type="url"
                                    className="form-control bg-body text-body"
                                    name="account_link"
                                    value={influencerData.account_link}
                                    onChange={handleInputChange}
                                    placeholder="https://..."
                                />
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

