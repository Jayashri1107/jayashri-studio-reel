import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../Config/axios';
import './Login.css';

export default function Login() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Force re-render when theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-bs-theme') {
                    // Theme changed, component will re-render automatically
                }
            });
        });
        
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-bs-theme']
        });
        
        return () => {
            observer.disconnect();
        };
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (!identifier.trim()) {
            newErrors.identifier = 'Email or username is required';
        }
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setLoading(true);
        
        try {
            // Fix the endpoint to match the actual server route
            const response = await api.post('/Users/User/Login', {
                identifier,
                password
            });
            
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/');
            } else {
                setErrors({ general: response.data.message || 'Login failed' });
            }
        } catch (error) {
            console.error('Login error:', error);
            setErrors({ general: error.response?.data?.message || 'Login failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-container">
                <div className="logo-container">
                    <img src="/assets/images/ipshopy-logo-white.png" alt="ipshopy logo" className="logo-light" />
                </div>
                
                <div className="login-form-container">
                    <form onSubmit={handleSubmit} className="login-form">
                        {errors.general && (
                            <div className="alert alert-danger">
                                {errors.general}
                            </div>
                        )}
                        
                        <div className="form-group">
                            <label htmlFor="UserEmail">Email or Username</label>
                            <div className="input-with-icon">
                                <input 
                                    type="text" 
                                    id="UserEmail" 
                                    placeholder="Enter your email or username" 
                                    value={identifier}
                                    onChange={(e) => {
                                        setIdentifier(e.target.value);
                                        if (errors.identifier) {
                                            setErrors({...errors, identifier: null});
                                        }
                                    }}
                                    className={errors.identifier ? 'error' : ''}
                                    autoComplete="username"
                                />
                                <span className="input-icon">
                                    <i data-lucide="mail"></i>
                                </span>
                            </div>
                            {errors.identifier && <span className="error-message">{errors.identifier}</span>}
                        </div>
                        
                        <div className="form-group">
                            <div className="password-label">
                                <label htmlFor="UserPass">Password</label>
                                <Link to="#" className="forgot-password">Forgot Password?</Link>
                            </div>
                            <div className="input-with-icon">
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    id="UserPass" 
                                    placeholder="Enter your password" 
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) {
                                            setErrors({...errors, password: null});
                                        }
                                    }}
                                    className={errors.password ? 'error' : ''}
                                    autoComplete="current-password"
                                />
                                <span className="input-icon">
                                    <i 
                                        data-lucide={showPassword ? "eye-off" : "eye"}
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="toggle-password"
                                    ></i>
                                </span>
                            </div>
                            {errors.password && <span className="error-message">{errors.password}</span>}
                        </div>
                        
                        <div className="form-options">
                            <label className="checkbox-container">
                                <input type="checkbox" />
                                <span className="checkmark"></span>
                                Remember me
                            </label>
                        </div>
                        
                        <button 
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="spinner"></div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                    
                    <div className="signup-link">
                        <p>Don't have an account? <Link to="/Signup">Sign Up</Link></p>
                    </div>
                </div>
                
                <div className="login-footer">
                    <p>© {new Date().getFullYear()} Ipshopy. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}