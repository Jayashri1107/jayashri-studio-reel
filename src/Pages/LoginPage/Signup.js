import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../Config/axios';
import { toast } from 'react-toastify';
import './Signup.css';

export default function Signup() {
    const [formData, setFormData] = useState({
        username: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        if (!formData.acceptTerms) {
            toast.error('Please accept the terms and conditions');
            setLoading(false);
            return;
        }

        try {
            console.log('Attempting signup with:', { email: formData.email, firstName: formData.firstName, lastName: formData.lastName });
            // Fix the endpoint to match the actual server route
            const response = await api.post('/Users/User/Signup', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                phone: formData.phone || null
            });

            console.log('Signup response:', response.data);

            if (response.data.success) {
                toast.success('Account created successfully! Please login to continue.');
                navigate('/Login');
            } else {
                toast.error(response.data.message || 'Signup failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            console.error('Error response:', error.response);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
            
            let errorMessage = 'Signup failed. Please try again.';
            
            if (error.response) {
                // Server responded with error
                errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = 'Unable to connect to server. Please check if the server is running.';
            } else {
                // Error setting up the request
                errorMessage = error.message || 'An error occurred while processing your request.';
            }
            
            toast.error(errorMessage);
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
                                        <Link to="/" className="logo-dark">
                                            <img src="/assets/images/ipshopy-logo-black.png" height="30" alt="ipshopy logo" />
                                        </Link>
                                        <Link to="/" className="logo-light">
                                            <img src="/assets/images/ipshopy-logo-white.png" height="30" alt="ipshopy logo" />
                                        </Link>
                                    </div>

                                    <div className="text-center">
                                        <h3 className="fw-bold text-dark fs-20">Hi, Sign Up 👋</h3>
                                        <p className="text-muted mt-1 mb-4">New to our platform? Sign up now! It only takes a minute.</p>
                                    </div>

                                    <div className="p-3">
                                        <form onSubmit={handleSubmit} className="authentication-form">
                                            <div className="mb-3">
                                                <label className="form-label" htmlFor="username">Username</label>
                                                <div className="position-relative w-100">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-lg rounded"
                                                        id="username"
                                                        name="username"
                                                        placeholder="Enter Username"
                                                        value={formData.username}
                                                        onChange={handleChange}
                                                        required
                                                        autoComplete="username"
                                                    />
                                                    <p className="text-muted p-0 position-absolute end-0 top-50 border-0 fs-4 translate-middle-y me-2 mb-0">
                                                        <iconify-icon icon="solar:user-circle-bold-duotone" className="fs-20 mt-1 text-muted"></iconify-icon>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label" htmlFor="firstName">First Name</label>
                                                <div className="position-relative w-100">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-lg rounded"
                                                        id="firstName"
                                                        name="firstName"
                                                        placeholder="Enter First Name"
                                                        value={formData.firstName}
                                                        onChange={handleChange}
                                                        required
                                                        autoComplete="given-name"
                                                    />
                                                    <p className="text-muted p-0 position-absolute end-0 top-50 border-0 fs-4 translate-middle-y me-2 mb-0">
                                                        <iconify-icon icon="solar:user-bold-duotone" className="fs-20 mt-1 text-muted"></iconify-icon>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label" htmlFor="lastName">Last Name</label>
                                                <div className="position-relative w-100">
                                                    <input
                                                        type="text"
                                                        className="form-control form-control-lg rounded"
                                                        id="lastName"
                                                        name="lastName"
                                                        placeholder="Enter Last Name"
                                                        value={formData.lastName}
                                                        onChange={handleChange}
                                                        required
                                                        autoComplete="family-name"
                                                    />
                                                    <p className="text-muted p-0 position-absolute end-0 top-50 border-0 fs-4 translate-middle-y me-2 mb-0">
                                                        <iconify-icon icon="solar:user-bold-duotone" className="fs-20 mt-1 text-muted"></iconify-icon>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label" htmlFor="email">Email</label>
                                                <div className="position-relative w-100">
                                                    <input
                                                        type="email"
                                                        className="form-control form-control-lg rounded"
                                                        id="email"
                                                        name="email"
                                                        placeholder="Enter Email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        required
                                                        autoComplete="email"
                                                    />
                                                    <p className="text-muted p-0 position-absolute end-0 top-50 border-0 fs-4 translate-middle-y me-2 mb-0">
                                                        <iconify-icon icon="solar:letter-bold-duotone" className="fs-20 mt-1 text-muted"></iconify-icon>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label" htmlFor="phone">Mobile Number (Optional)</label>
                                                <div className="position-relative w-100">
                                                    <input
                                                        type="tel"
                                                        className="form-control form-control-lg rounded"
                                                        id="phone"
                                                        name="phone"
                                                        placeholder="Enter Phone Number"
                                                        value={formData.phone}
                                                        onChange={handleChange}
                                                        autoComplete="tel"
                                                    />
                                                    <p className="text-muted p-0 position-absolute end-0 top-50 border-0 fs-4 translate-middle-y me-2 mb-0">
                                                        <iconify-icon icon="solar:phone-bold-duotone" className="fs-20 mt-1 text-muted"></iconify-icon>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label" htmlFor="password">Password</label>
                                                <div className="position-relative w-100">
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        className="form-control form-control-lg rounded"
                                                        id="password"
                                                        name="password"
                                                        placeholder="Enter password"
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        required
                                                        autoComplete="new-password"
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
                                                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                                                <div className="position-relative w-100">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        className="form-control form-control-lg rounded"
                                                        id="confirmPassword"
                                                        name="confirmPassword"
                                                        placeholder="Confirm password"
                                                        value={formData.confirmPassword}
                                                        onChange={handleChange}
                                                        required
                                                        autoComplete="new-password"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn text-muted p-0 position-absolute end-0 top-50 border-0 fs-4 translate-middle-y me-2"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    >
                                                        <iconify-icon
                                                            icon={showConfirmPassword ? "solar:eye-closed-bold-duotone" : "solar:eye-bold-duotone"}
                                                            className="fs-20 mt-1 text-muted"
                                                        ></iconify-icon>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <div className="form-check">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input"
                                                        id="acceptTerms"
                                                        name="acceptTerms"
                                                        checked={formData.acceptTerms}
                                                        onChange={handleChange}
                                                        required
                                                    />
                                                    <label className="form-check-label" htmlFor="acceptTerms">
                                                        I accept Terms and Condition
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="mb-1 text-center d-grid">
                                                <button
                                                    className="btn btn-primary d-flex align-items-center justify-content-center gap-1 fw-medium"
                                                    type="submit"
                                                    disabled={loading}
                                                >
                                                    {loading ? (
                                                        <>Loading...</>
                                                    ) : (
                                                        <>
                                                            <i data-lucide="user-plus" className="fs-18"></i> Sign Up
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    <p className="text-muted text-center mt-4 mb-0">
                                        I already have an account{' '}
                                        <Link to="/Login" className="link-primary fst-italic text-decoration-underline fw-semibold">
                                            Sign In
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}