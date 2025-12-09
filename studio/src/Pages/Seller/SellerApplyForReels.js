import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const SellerApplyForReels = ({ onClose }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.mobile) {
      setError("First Name, Last Name, Email, and Mobile Number are required");
      return false;
    }
    const mobileRegex = /^[0-9]{10,12}$/;
    if (!mobileRegex.test(formData.mobile)) {
      setError("Please enter a valid mobile number (10-12 digits)");
      return false;
    }
    return true;
  };

  const validatePasswordForm = () => {
    if (!passwordData.password || !passwordData.confirmPassword) {
      setError("Please enter and confirm your password");
      return false;
    }
    if (passwordData.password !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    const strongPwd = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPwd.test(passwordData.password)) {
      setError("Password must be 8+ chars with uppercase, number, and special character");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      // Check if seller exists in oc_vendor table
      const response = await fetch("/Studio/seller/check-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          mobile: formData.mobile,
          firstName: formData.firstName,
          lastName: formData.lastName
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Seller exists in oc_vendor table
        if (result.exists) {
          // Show password form
          setShowPasswordForm(true);
        } else {
          // Seller does not exist
          setError("You are not a seller of ipshopy. First you need to register as a seller in ipshopy");
        }
      } else {
        setError(result.message || "An error occurred while checking seller details");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;

    setLoading(true);
    setError("");

    try {
      // Register seller with password
      const response = await fetch("/Studio/seller/register-for-reels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          password: passwordData.password
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast.success("Registration successful! You can now login.");
        setTimeout(() => {
          onClose();
          // Dispatch event to open seller login modal
          window.dispatchEvent(new CustomEvent('openLoginModal', { detail: 'seller-login' }));
        }, 2000);
      } else {
        const msg = (result && (result.message || result.error)) || "";
        const lower = (msg || "").toLowerCase();
        if (lower.includes("email") && (lower.includes("exist") || lower.includes("already"))) {
          setError("An account with this email already exists");
        } else if (lower.includes("mobile") && (lower.includes("exist") || lower.includes("already"))) {
          setError("This number already register with us");
        } else {
          setError(msg || "Registration failed");
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-5">
        <div className="text-success mb-3">
          <i className="fas fa-check-circle fa-3x"></i>
        </div>
        <h4>Application Submitted Successfully!</h4>
        <p>Your application for reels has been submitted. We'll review it shortly.</p>
      </div>
    );
  }

  return (
    <div>
      
      {showPasswordForm ? (
        // Password Form
        <form onSubmit={handlePasswordSubmit}>
          <div className="mb-3">
            <label className="form-label">Set Password</label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                name="password"
                value={passwordData.password}
                onChange={handlePasswordChange}
                placeholder="Enter password"
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
            <div className="form-text">Use 8+ chars, uppercase, number, and special character</div>
          </div>
          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <div className="input-group">
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="form-control"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm password"
                required
              />
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Toggle confirm password visibility"
              >
                <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
              </button>
            </div>
          </div>
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowPasswordForm(false)}
              disabled={loading}
            >
              Back
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Processing..." : "Register"}
            </button>
          </div>
        </form>
      ) : (
        // Application Form
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">First Name</label>
            <input
              type="text"
              className="form-control"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Last Name</label>
            <input
              type="text"
              className="form-control"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Mobile Number</label>
            <input
              type="tel"
              className="form-control"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Enter your mobile number"
              inputMode="numeric"
              pattern="^[0-9]{10,12}$"
              required
            />
          </div>
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Checking..." : "Submit Application"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default SellerApplyForReels;
