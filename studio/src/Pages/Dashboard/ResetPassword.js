import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const role = params.get('role') || '';
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const strong = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !role) {
      toast.error('Invalid or missing reset link');
      return;
    }
    if (!password || !confirm) {
      toast.error('Enter and confirm your new password');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (!strong.test(password)) {
      toast.error('Password must be 8+ chars with uppercase, number, and special');
      return;
    }
    setLoading(true);
    try {
      const endpoint = role === 'seller' ? '/Studio/seller/reset-password' : '/Studio/influencer/reset-password';
      const res = await fetch(`http://localhost:3189${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('Password reset successful. Please log in.');
        navigate(role === 'seller' ? '/studio/seller/login' : '/studio/influencer/login');
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (err) {
      toast.error('Network error. Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm mt-4">
            <div className="card-body p-4">
              <div className="text-center mb-3">
                <h5 className="fw-bold text-dark">Reset Password</h5>
                <p className="text-muted small">Set a new password for your account</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                  />
                </div>
                <div className="d-grid">
                  <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
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
