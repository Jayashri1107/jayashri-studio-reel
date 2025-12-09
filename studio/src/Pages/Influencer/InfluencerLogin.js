import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function InfluencerLogin({ onClose }) {
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
            // Using the new API service for influencer login
            const data = await ApiService.influencerLogin(loginData.email, loginData.password);
            
            if (data.success) {
                // Login successful, store user data and redirect
                localStorage.setItem('studioToken', data.token);
                
                // Preserve the profile image if it exists from a previous session
                const existingUserData = localStorage.getItem('studioUser');
                let userData = data.data;
                
                if (existingUserData) {
                    try {
                        const parsedExistingData = JSON.parse(existingUserData);
                        // If the existing user has an image, preserve it
                        if (parsedExistingData.image && !userData.image) {
                            userData.image = parsedExistingData.image;
                        }
                    } catch (e) {
                        console.error('Error parsing existing user data:', e);
                    }
                }
                
                localStorage.setItem('studioUser', JSON.stringify(userData));
                
                toast.success('Login successful');
                if (onClose) onClose();
                navigate('/studio/influencer');
            } else {
                // Show different messages based on status
                if (data.message === 'Your account is pending approval') {
                    toast.error('your account is on review please wait for the admin approval');
                } else if (data.message === 'Your account has been rejected') {
                    toast.error('Your influencer account has been rejected. Please contact support for more information.');
                } else {
                    toast.error(data.message || 'Invalid credentials');
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        const email = loginData.email?.trim();
        if (!email) {
            toast.error('Enter your email first');
            return;
        }
        try {
            setLoading(true);
            const result = await ApiService.requestInfluencerPasswordReset(email);
            toast.success(result.message || 'If an account exists, a reset email has been sent');
            if (result.previewUrl) {
                console.log('Reset email preview URL:', result.previewUrl);
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="row justify-content-center">
                <div className="col-12">
                    <div className="text-center mb-3">
                        <h5 className="fw-bold text-dark">Influencer Login</h5>
                        <p className="text-muted small">Sign in to your influencer account</p>
                    </div>
                    
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-3">
                            <form onSubmit={handleSubmit} className="authentication-form">
                                <div className="mb-3">
                                    <label className="form-label" htmlFor="UserEmail">Email Address</label>
                                    <div className="position-relative">
                                        <input 
                                            type="email" 
                                            className="form-control form-control-lg" 
                                            id="UserEmail" 
                                            name="email"
                                            placeholder="Enter your email" 
                                            value={loginData.email}
                                            onChange={handleInputChange}
                                            autoComplete="email"
                                            required 
                                            disabled={loading}
                                        />
                                        <span className="text-muted position-absolute end-0 top-50 translate-middle-y me-3">
                                            <i className="fas fa-envelope"></i>
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="mb-3">
                                    <div className="d-flex justify-content-between">
                                        <label className="form-label" htmlFor="UserPass">Password</label>
                                        <a href="#" className="text-muted small" onClick={handleForgotPassword}>Forgot password?</a>
                                    </div>
                                    <div className="position-relative">
                                        <input 
                                            type={showPassword ? "text" : "password"}
                                            className="form-control form-control-lg" 
                                            id="UserPass" 
                                            name="password"
                                            placeholder="Enter your password" 
                                            value={loginData.password}
                                            onChange={handleInputChange}
                                            autoComplete="current-password"
                                            required 
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="btn text-muted position-absolute end-0 top-50 translate-middle-y me-3"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="form-check mb-3">
                                    <input type="checkbox" className="form-check-input" id="rememberMe" />
                                    <label className="form-check-label small" htmlFor="rememberMe">Remember me</label>
                                </div>
                                
                                <div className="d-grid">
                                    <button 
                                        className="btn btn-primary d-flex align-items-center justify-content-center gap-1 fw-medium" 
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Signing in...
                                            </>
                                        ) : (
                                            'Sign In'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}