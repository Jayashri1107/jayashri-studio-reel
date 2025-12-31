import React, { useEffect, useState } from 'react';
import api from '../../Config/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [errors, setErrors] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((err) => ({ ...err, [name]: '' }));
  };

  const isStrongPassword = (pwd) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);
  };

  const submit = async (e) => {
    e.preventDefault();
    const newErrors = { currentPassword: '', newPassword: '', confirmPassword: '' };
    if (!form.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!form.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!isStrongPassword(form.newPassword)) {
      newErrors.newPassword = 'Password must be 8+ chars with upper, lower, number, special';
    } else if (form.newPassword === form.currentPassword) {
      newErrors.newPassword = 'New password must differ from current password';
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (newErrors.currentPassword || newErrors.newPassword || newErrors.confirmPassword) {
      setErrors(newErrors);
      return;
    }
    try {
      setLoading(true);
      await api.put('/Users/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      toast.success('Password updated');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // Navigate back to profile page after successful update
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password';
      if (/current password/i.test(msg)) {
        setErrors((e) => ({ ...e, currentPassword: msg }));
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [show]);

  return (
    <div className="row">
      <div className="col-lg-6 mx-auto">
        <div className="card">
          <div className="card-header">
            <h4 className="mb-0">Change Password</h4>
          </div>
          <div className="card-body">
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="form-label">Current Password</label>
                <div className="position-relative">
                  <input
                    type={show.current ? 'text' : 'password'}
                    name="currentPassword"
                    value={form.currentPassword}
                    onChange={onChange}
                    className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent p-0 me-2"
                    onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
                    aria-label={show.current ? 'Hide password' : 'Show password'}
                  >
                    <i data-lucide={show.current ? 'eye-off' : 'eye'}></i>
                  </button>
                </div>
                {errors.currentPassword && <div className="invalid-feedback d-block">{errors.currentPassword}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">New Password</label>
                <div className="position-relative">
                  <input
                    type={show.next ? 'text' : 'password'}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={onChange}
                    className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent p-0 me-2"
                    onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
                    aria-label={show.next ? 'Hide password' : 'Show password'}
                  >
                    <i data-lucide={show.next ? 'eye-off' : 'eye'}></i>
                  </button>
                </div>
                <small className="text-body mb-0">
                  Use 8+ characters with upper, lower, number, and special character.
                </small>
                {errors.newPassword && <div className="invalid-feedback d-block">{errors.newPassword}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label">Confirm New Password</label>
                <div className="position-relative">
                  <input
                    type={show.confirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={onChange}
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent p-0 me-2"
                    onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
                    aria-label={show.confirm ? 'Hide password' : 'Show password'}
                  >
                    <i data-lucide={show.confirm ? 'eye-off' : 'eye'}></i>
                  </button>
                </div>
                {errors.confirmPassword && <div className="invalid-feedback d-block">{errors.confirmPassword}</div>}
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/profile')}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>Update Password</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
