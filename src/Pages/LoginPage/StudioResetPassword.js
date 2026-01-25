import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ApiService from '../../Services/ApiService';
import { toast } from 'react-toastify';
import './Login.css';

export default function StudioResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const role = (params.get('role') || 'seller').toLowerCase();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const valid = () => {
    const strong = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strong.test(password)) {
      toast.error('Password must be 8+ chars with uppercase, number, and special character');
      return false;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return false;
    }
    if (!token) {
      toast.error('Invalid or expired reset link');
      return false;
    }
    return true;
  };

  const reset = async () => {
    if (!valid()) return;
    setLoading(true);
    try {
      const resp = role === 'seller'
        ? await ApiService.resetSellerPassword(token, password)
        : await ApiService.resetInfluencerPassword(token, password);
      if (resp?.success) {
        toast.success(resp.message || 'Password reset successful');
        setTimeout(() => navigate('/Login'), 500);
      } else {
        toast.error(resp?.message || 'Failed to reset password');
      }
    } catch (e) {
      toast.error('Invalid or expired token');
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
          <div className="login-form">
            <h5 className="mb-3">Reset Password ({role === 'seller' ? 'Seller' : 'Influencer'})</h5>
            <div className="form-group">
              <label htmlFor="newPwd">New Password</label>
              <input
                id="newPwd"
                type="password"
                className="form-control"
                placeholder="Enter new password"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPwd">Confirm Password</label>
              <input
                id="confirmPwd"
                type="password"
                className="form-control"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e)=>setConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <button
              type="button"
              className="login-button"
              disabled={loading}
              onClick={reset}
            >
              {loading ? 'Saving...' : 'Set New Password'}
            </button>
            <div className="mt-3">
              <button type="button" className="btn btn-link p-0" onClick={()=>navigate('/Login')}>Back to Login</button>
            </div>
          </div>
        </div>
        <div className="login-footer">
          <p>© {new Date().getFullYear()} Ipshopy. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
