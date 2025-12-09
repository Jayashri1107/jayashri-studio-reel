import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ApplyForAccess() {
    const navigate = useNavigate();
    const [userType, setUserType] = useState('seller'); // Default to seller
    const [sellerData, setSellerData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        mobile: ''
    });
    const [influencerData, setInfluencerData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        mobile: '',
        platforms: [],
        password: '',
        confirmPassword: ''
    });
    const [step, setStep] = useState(1); // 1: select type, 2: form, 3: success
    const [loading, setLoading] = useState(false);

    const handleSellerSubmit = async (e) => {
        e.preventDefault();
        
        if (!sellerData.email || !sellerData.firstName || !sellerData.lastName || !sellerData.mobile) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        
        try {
            // For seller application, we just redirect to login since they need to be verified from oc_vendor
            toast.info('Please proceed to login to verify your seller account');
            navigate('/studio/seller/login');
        } catch (error) {
            console.error('Application error:', error);
            toast.error('Application failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInfluencerSubmit = async (e) => {
        e.preventDefault();
        
        if (!influencerData.firstName || !influencerData.lastName || !influencerData.email || 
            !influencerData.mobile || !influencerData.password || !influencerData.confirmPassword) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (!influencerData.platforms || influencerData.platforms.length === 0) {
            toast.error('Please add at least one social media platform');
            return;
        }

        for (let i = 0; i < influencerData.platforms.length; i++) {
            const entry = influencerData.platforms[i];
            if (!entry.platform) {
                toast.error(`Please select platform for entry ${i + 1}`);
                return;
            }
            const links = entry.links || [];
            if (links.length === 0 || links.every(l => !l || !l.trim())) {
                toast.error(`Please add at least one link for ${entry.platform}`);
                return;
            }
        }

        if (influencerData.password !== influencerData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        const strongPwd = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
        if (!strongPwd.test(influencerData.password)) {
            toast.error('Password must be 8+ chars with uppercase, number, and special character');
            return;
        }

        setLoading(true);
        
        try {
            const response = await fetch('http://localhost:3189/Studio/influencer/apply', {                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: influencerData.firstName,
                    lastName: influencerData.lastName,
                    email: influencerData.email,
                    mobile: influencerData.mobile,
                    platforms: influencerData.platforms.map(p => ({ platform: p.platform, links: p.links })),
                    password: influencerData.password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                toast.success('Application submitted successfully!');
                setStep(3); // Show success message
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Application error:', error);
            toast.error('Application failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const renderSellerForm = () => (
        <form onSubmit={handleSellerSubmit}>
            <div className="alert alert-info">
                <p className="mb-0">
                    <i className="ri-information-line me-1"></i>
                    To apply as a seller, you must already be registered as a vendor in our system. 
                    After submitting this form, you'll be redirected to login where we'll verify your vendor status.
                </p>
            </div>
            
            <div className="row">
                <div className="col-md-6">
                    <div className="mb-3">
                        <label htmlFor="sellerEmail" className="form-label">
                            Email <span className="text-danger">*</span>
                        </label>
                        <input
                            type="email"
                            className="form-control"
                            id="sellerEmail"
                            name="email"
                            placeholder="Enter your email"
                            value={sellerData.email}
                            onChange={(e) => setSellerData({...sellerData, email: e.target.value})}
                            disabled={loading}
                            required
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="mb-3">
                        <label htmlFor="sellerMobile" className="form-label">
                            Mobile Number <span className="text-danger">*</span>
                        </label>
                        <input
                            type="tel"
                            className="form-control"
                            id="sellerMobile"
                            name="mobile"
                            placeholder="Enter your mobile number"
                            value={sellerData.mobile}
                            onChange={(e) => setSellerData({...sellerData, mobile: e.target.value})}
                            disabled={loading}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <div className="mb-3">
                        <label htmlFor="sellerFirstName" className="form-label">
                            First Name <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="sellerFirstName"
                            name="firstName"
                            placeholder="Enter your first name"
                            value={sellerData.firstName}
                            onChange={(e) => setSellerData({...sellerData, firstName: e.target.value})}
                            disabled={loading}
                            required
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="mb-3">
                        <label htmlFor="sellerLastName" className="form-label">
                            Last Name <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="sellerLastName"
                            name="lastName"
                            placeholder="Enter your last name"
                            value={sellerData.lastName}
                            onChange={(e) => setSellerData({...sellerData, lastName: e.target.value})}
                            disabled={loading}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="d-flex gap-2 mt-4">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStep(1)}
                    disabled={loading}
                >
                    Back
                </button>
                <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Processing...
                        </>
                    ) : (
                        'Apply as Seller'
                    )}
                </button>
            </div>
        </form>
    );

    const renderInfluencerForm = () => (
        <form onSubmit={handleInfluencerSubmit}>
            <div className="row">
                <div className="col-md-6">
                    <div className="mb-3">
                        <label htmlFor="infFirstName" className="form-label">
                            First Name <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="infFirstName"
                            name="firstName"
                            placeholder="Enter your first name"
                            value={influencerData.firstName}
                            onChange={(e) => setInfluencerData({...influencerData, firstName: e.target.value})}
                            disabled={loading}
                            required
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="mb-3">
                        <label htmlFor="infLastName" className="form-label">
                            Last Name <span className="text-danger">*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="infLastName"
                            name="lastName"
                            placeholder="Enter your last name"
                            value={influencerData.lastName}
                            onChange={(e) => setInfluencerData({...influencerData, lastName: e.target.value})}
                            disabled={loading}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <div className="mb-3">
                        <label htmlFor="infEmail" className="form-label">
                            Email <span className="text-danger">*</span>
                        </label>
                        <input
                            type="email"
                            className="form-control"
                            id="infEmail"
                            name="email"
                            placeholder="Enter your email"
                            value={influencerData.email}
                            onChange={(e) => setInfluencerData({...influencerData, email: e.target.value})}
                            disabled={loading}
                            required
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="mb-3">
                        <label htmlFor="infMobile" className="form-label">
                            Mobile Number <span className="text-danger">*</span>
                        </label>
                        <input
                            type="tel"
                            className="form-control"
                            id="infMobile"
                            name="mobile"
                            placeholder="Enter your mobile number"
                            value={influencerData.mobile}
                            onChange={(e) => setInfluencerData({...influencerData, mobile: e.target.value})}
                            disabled={loading}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="mb-3">
                <label className="form-label">
                    Social Media Platforms <span className="text-danger">*</span>
                </label>
                <div className="row">
                    {['Instagram','YouTube','TikTok','Facebook','Twitter','Other'].map((p) => {
                        const isChecked = !!influencerData.platforms.find(e => (e.platform || '').toLowerCase() === p.toLowerCase());
                        return (
                            <div className="col-sm-6 col-md-4 mb-2" key={p}>
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`apply-platform-${p}`}
                                        checked={isChecked}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setInfluencerData(prev => {
                                                const exists = prev.platforms.find(pl => (pl.platform || '').toLowerCase() === p.toLowerCase());
                                                if (checked && !exists) {
                                                    return { ...prev, platforms: [...prev.platforms, { platform: p, links: [''] }] };
                                                }
                                                if (!checked && exists) {
                                                    return { ...prev, platforms: prev.platforms.filter(pl => (pl.platform || '').toLowerCase() !== p.toLowerCase()) };
                                                }
                                                return prev;
                                            });
                                        }}
                                        disabled={loading}
                                    />
                                    <label className="form-check-label" htmlFor={`apply-platform-${p}`}>{p}</label>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {influencerData.platforms.length > 0 && (
                <div className="mb-3">
                    {influencerData.platforms.map((entry, index) => (
                        <div className="mb-3" key={index}>
                            <div className="fw-semibold mb-2">{entry.platform}</div>
                            {(entry.links || []).map((link, li) => (
                                <div className="d-flex gap-2 mb-2" key={li}>
                                    <input
                                        type="url"
                                        className="form-control"
                                        placeholder={`Enter ${entry.platform} profile URL`}
                                        value={link}
                                        onChange={(e) => {
                                    const value = e.target.value;
                                    setInfluencerData(prev => ({
                                        ...prev,
                                        platforms: prev.platforms.map((pl, pi) => {
                                            if (pi !== index) return pl;
                                            const links = [...(pl.links || [])];
                                            links[li] = value;
                                            return { ...pl, links };
                                        })
                                    }));
                                }}
                                disabled={loading}
                                required
                            />
                            {isDuplicateLinkInForm(link) && (
                                <div className="text-danger small ms-2">This profile is already in use</div>
                            )}
                            {(entry.links || []).length > 1 && (
                                <button type="button" className="btn btn-outline-danger" onClick={() => {
                                    setInfluencerData(prev => ({
                                        ...prev,
                                        platforms: prev.platforms.map((pl, pi) => {
                                            if (pi !== index) return pl;
                                            return { ...pl, links: pl.links.filter((_, lidx) => lidx !== li) };
                                        })
                                    }));
                                }} disabled={loading}>Remove</button>
                            )}
                        </div>
                    ))}
                        </div>
                    ))}
                </div>
            )}

            <div className="row">
                <div className="col-md-6">
                    <div className="mb-3">
                        <label htmlFor="infPassword" className="form-label">
                            Password <span className="text-danger">*</span>
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            id="infPassword"
                            name="password"
                            placeholder="Enter your password"
                            value={influencerData.password}
                            onChange={(e) => setInfluencerData({...influencerData, password: e.target.value})}
                            disabled={loading}
                            required
                        />
                        <div className="form-text">Use 8+ chars, uppercase, number, and special character</div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="mb-3">
                        <label htmlFor="infConfirmPassword" className="form-label">
                            Confirm Password <span className="text-danger">*</span>
                        </label>
                        <input
                            type="password"
                            className="form-control"
                            id="infConfirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={influencerData.confirmPassword}
                            onChange={(e) => setInfluencerData({...influencerData, confirmPassword: e.target.value})}
                            disabled={loading}
                            required
                        />
                    </div>
                </div>
            </div>

            <div className="d-flex gap-2 mt-4">
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStep(1)}
                    disabled={loading}
                >
                    Back
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Processing...
                        </>
                    ) : (
                        'Apply as Influencer'
                    )}
                </button>
            </div>
        </form>
    );

    const renderSuccessMessage = () => (
        <div className="text-center">
            <div className="mb-4">
                <i className="ri-checkbox-circle-fill text-success" style={{fontSize: '4rem'}}></i>
            </div>
            <h4 className="text-success">Application Submitted Successfully!</h4>
            <p className="text-muted">
                Thank you for applying. Our team will review your application and contact you soon.
            </p>
            <div className="mt-4">
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        if (userType === 'seller') {
                            navigate('/studio/seller/login');
                        } else {
                            navigate('/studio/influencer/login');
                        }
                    }}
                >
                    Proceed to Login
                </button>
            </div>
        </div>
    );

    return (
        <div className="auth-page-wrapper pt-5">
            <div className="auth-one-bg-position auth-one-bg" id="auth-element">
                <div className="bg-overlay"></div>
                <div className="shape">
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1440 120">
                        <path d="M 0,36 C 144,53.6 432,123.2 720,124 C 1008,124.8 1296,56.8 1440,40L1440 140L0 140z"></path>
                    </svg>
                </div>
            </div>

            <div className="auth-page-content">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="text-center mt-sm-5 mb-4 text-white-50">
                                <div>
                                    <a href="/studio" className="d-inline-block auth-logo">
                                        <img src="/assets/images/logo-light.png" alt="" height="50" />
                                    </a>
                                </div>
                                <p className="mt-3 fs-15 fw-medium">Apply for Access - Studio Platform</p>
                            </div>
                        </div>
                    </div>

                    <div className="row justify-content-center">
                        <div className="col-md-10 col-lg-8 col-xl-7">
                            <div className="card mt-4">
                                <div className="card-body p-4">
                                    {step === 1 ? (
                                        <div>
                                            <div className="text-center mt-2">
                                                <h5 className="text-primary">Apply for Access</h5>
                                                <p className="text-muted">Select your account type to continue</p>
                                            </div>
                                            
                                            <div className="row mt-4">
                                                <div className="col-md-6">
                                                    <div className="card border-success">
                                                        <div className="card-body text-center">
                                                            <i className="ri-store-line text-success" style={{fontSize: '3rem'}}></i>
                                                            <h5 className="mt-3">Seller Account</h5>
                                                            <p className="text-muted">
                                                                For vendors who want to upload product reels
                                                            </p>
                                                            <button
                                                                className="btn btn-success"
                                                                onClick={() => {
                                                                    setUserType('seller');
                                                                    setStep(2);
                                                                }}
                                                            >
                                                                Apply as Seller
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="card border-primary">
                                                        <div className="card-body text-center">
                                                            <i className="ri-user-star-line text-primary" style={{fontSize: '3rem'}}></i>
                                                            <h5 className="mt-3">Influencer Account</h5>
                                                            <p className="text-muted">
                                                                For content creators who want to promote products
                                                            </p>
                                                            <button
                                                                className="btn btn-primary"
                                                                onClick={() => {
                                                                    setUserType('influencer');
                                                                    setStep(2);
                                                                }}
                                                            >
                                                                Apply as Influencer
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : step === 2 ? (
                                        <div>
                                            <div className="text-center mt-2">
                                                <h5 className="text-primary">
                                                    {userType === 'seller' ? 'Seller Application' : 'Influencer Application'}
                                                </h5>
                                                <p className="text-muted">
                                                    Fill in your details to apply for access
                                                </p>
                                            </div>
                                            
                                            <div className="p-2 mt-4">
                                                {userType === 'seller' ? renderSellerForm() : renderInfluencerForm()}
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="text-center mt-2">
                                                <h5 className="text-primary">Application Submitted</h5>
                                            </div>
                                            
                                            <div className="p-2 mt-4">
                                                {renderSuccessMessage()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 text-center">
                                <p className="mb-0">
                                    Already have an account?{' '}
                                    <button 
                                        className="btn btn-link text-primary text-decoration-underline p-0"
                                        onClick={() => navigate('/studio')}
                                    >
                                        Back to Login
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
    const isDuplicateLinkInForm = (value) => {
        const v = (value || '').trim().toLowerCase();
        if (!v) return false;
        let count = 0;
        for (const entry of influencerData.platforms || []) {
            for (const l of (entry.links || [])) {
                if ((l || '').trim().toLowerCase() === v) count++;
            }
        }
        return count > 1;
    };
