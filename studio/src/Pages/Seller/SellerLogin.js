import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function SellerLogin({ onClose }) {
    const navigate = useNavigate();
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [step, setStep] = useState(1); // 1: email check, 2: password entry
    const [loading, setLoading] = useState(false);
    const [sellerInfo, setSellerInfo] = useState(null);

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

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        
        if (!loginData.email) {
            toast.error('Please enter your email');
            return;
        }

        setLoading(true);
        
        try {
            // Check if seller exists in our database using the new API service
            const result = await ApiService.checkSellerEmail(loginData.email);

            if (result.exists) {
                // Seller exists, proceed to password entry
                setSellerInfo(result.seller);
                setStep(2);
            } else {
                // Seller doesn't exist in our database
                toast.error('You are not registered as a seller for reels. Please apply first.');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        
        if (!loginData.password) {
            toast.error('Please enter your password');
            return;
        }

        setLoading(true);
        
        try {
            // Login with email and password using the new API service
            const result = await ApiService.sellerLoginWithPassword(loginData.email, loginData.password);

            if (result.success) {
                // Successful login
                localStorage.setItem('studioToken', result.token);
                
                // Preserve the profile image if it exists from a previous session
                const existingUserData = localStorage.getItem('studioUser');
                let userData = result.data;
                
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
                toast.success('Login successful!');
                onClose();
                navigate('/studio/seller');
            } else {
                toast.error(result.message || 'Invalid credentials');
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
            const result = await ApiService.requestSellerPasswordReset(email);
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
                    <div className="card border-0 shadow-sm">
                        <div className="card-body p-4">
                            <div className="text-center mb-4">
                                <h3 className="fw-bold">Seller Login</h3>
                                <p className="text-muted">
                                    {step === 1 
                                        ? "Enter your email to verify your seller account" 
                                        : "Enter your password to login"}
                                </p>
                            </div>

                            {step === 1 ? (
                                <form onSubmit={handleEmailSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-control form-control-lg"
                                            name="email"
                                            value={loginData.email}
                                            onChange={handleInputChange}
                                            placeholder="Enter your email"
                                            autoComplete="email"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="d-grid gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-lg"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <span>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Verifying...
                                                </span>
                                            ) : (
                                                'Verify Email'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <form onSubmit={handlePasswordSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-control form-control-lg"
                                            autoComplete="email"
                                            value={loginData.email}
                                            readOnly
                                        />
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label className="form-label">Password</label>
                                        <div className="input-group">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="form-control form-control-lg"
                                                name="password"
                                                value={loginData.password}
                                                onChange={handleInputChange}
                                                placeholder="Enter your password"
                                                autoComplete="current-password"
                                                required
                                            />
                                            <button
                                                className="btn btn-outline-secondary"
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label="Toggle password visibility"
                                            >
                                                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                                            </button>
                                        </div>
                                        <div className="mt-2 text-end">
                                            <a href="#" onClick={handleForgotPassword} className="text-muted small">Forgot password?</a>
                                        </div>
                                    </div>
                                    
                                    <div className="d-grid gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-lg"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <span>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Logging in...
                                                </span>
                                            ) : (
                                                'Login'
                                            )}
                                        </button>
                                    </div>
                                    
                                    
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}