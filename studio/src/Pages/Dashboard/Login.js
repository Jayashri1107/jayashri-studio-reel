import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function StudioLogin() {
    const navigate = useNavigate();
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize icons if lucide is available
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!loginData.email || !loginData.password) {
            toast.error('Please enter both email and password');
            return;
        }

        setLoading(true);
        
        try {
            // Try seller login first using the new API service
            let data;
            try {
                data = await ApiService.sellerLoginWithPassword(loginData.email, loginData.password);
                
                if (data.success) {
                    // Seller login successful
                    localStorage.setItem('studioToken', data.token);
                    localStorage.setItem('studioUser', JSON.stringify(data.data));
                    
                    toast.success('Login successful');
                    navigate('/studio/seller');
                    return;
                }
            } catch (sellerError) {
                // Seller login failed, we'll try influencer next
                console.log('Seller login failed, trying influencer login');
            }
            
            // If seller login failed, try influencer login using the new API service
            try {
                data = await ApiService.influencerLogin(loginData.email, loginData.password);
                
                if (data.success) {
                    // Influencer login successful
                    localStorage.setItem('studioToken', data.token);
                    localStorage.setItem('studioUser', JSON.stringify(data.data));
                    
                    toast.success('Login successful');
                    navigate('/studio/influencer');
                    return;
                }
            } catch (influencerError) {
                // Both login attempts failed
                toast.error('Invalid credentials');
                return;
            }
            
            // If both failed, show error message
            toast.error(data?.message || 'Invalid credentials');
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="account-pages pt-2 pt-sm-5 pb-4 pb-sm-5">
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-xl-5">
                        <div className="card auth-card">
                            <div className="card-body">
                                <div className="p-3">
                                    <div className="mx-auto mb-5 auth-logo text-center">
                                        <a href="/studio" className="logo-dark">
                                            <img src="/assets/images/logo-light.png" height="30" alt="studio logo" />
                                        </a>
                                        <a href="/studio" className="logo-light">
                                            <img src="/assets/images/logo-light.png" height="30" alt="studio logo" />
                                        </a>
                                    </div>

                                    <div className="text-center">
                                        <h3 className="fw-bold text-dark fs-20">Welcome Back 👋</h3>
                                        <p className="text-muted mt-1 mb-4">Sign in to continue to Studio Platform.</p>
                                    </div>
                                    
                                    <div className="p-3">
                                        <form onSubmit={handleSubmit} className="authentication-form">
                                            <div className="mb-4">
                                                <label className="form-label" htmlFor="UserEmail">Email</label>
                                                <div className="position-relative w-100">
                                                    <input 
                                                        type="email" 
                                                        className="form-control form-control-lg rounded" 
                                                        id="UserEmail" 
                                                        name="email"
                                                        placeholder="Enter Email" 
                                                        value={loginData.email}
                                                        onChange={handleInputChange}
                                                        required 
                                                        disabled={loading}
                                                    />
                                                    <p className="text-muted p-0 position-absolute end-0 top-50 border-0 fs-4 translate-middle-y me-2 mb-0">
                                                        <iconify-icon icon="solar:letter-bold-duotone" className="fs-20 mt-1 text-muted"></iconify-icon>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <a href="#" className="float-end fw-semibold text-reset ms-1">Reset password</a>
                                                <label className="form-label" htmlFor="UserPass">Password</label>
                                                <div className="position-relative w-100">
                                                    <input 
                                                        type={showPassword ? "text" : "password"}
                                                        className="form-control form-control-lg rounded" 
                                                        id="UserPass" 
                                                        name="password"
                                                        placeholder="Enter password" 
                                                        value={loginData.password}
                                                        onChange={handleInputChange}
                                                        required 
                                                        disabled={loading}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn text-muted p-0 position-absolute end-0 top-50 border-0 fs-4 translate-middle-y me-2"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                    >
                                                        <iconify-icon
                                                            icon={showPassword ? "solar:eye-closed-bold-duotone" : "solar:eye-bold-duotone"}
                                                            className="fs-20 mt-1 text-muted"
                                                        ></iconify-icon>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mb-3">
                                                <div className="form-check">
                                                    <input type="checkbox" className="form-check-input" id="checkbox-signin" />
                                                    <label className="form-check-label" htmlFor="checkbox-signin">Remember me</label>
                                                </div>
                                            </div>
                                            <div className="text-center d-grid">
                                                <button 
                                                    className="btn btn-primary d-flex align-items-center justify-content-center gap-1 fw-medium" 
                                                    type="submit"
                                                    disabled={loading}
                                                >
                                                    {loading ? (
                                                        <>Loading...</>
                                                    ) : (
                                                        <>
                                                            <i data-lucide="log-in" className="fs-18"></i> Sign In
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                        <p className="text-muted text-center mt-4 mb-0">
                                            Don't have an account?{' '}
                                            <Link to="/studio/apply" className="link-primary fst-italic text-decoration-underline fw-semibold">
                                                Apply for access
                                            </Link>
                                        </p>
                                        <p className="text-muted text-center mt-2 mb-0">
                                            <Link to="/studio" className="link-primary fst-italic text-decoration-underline fw-semibold">
                                                Back to Studio Home
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}