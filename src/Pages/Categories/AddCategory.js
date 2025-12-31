import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageTitle from '../../Components/PageTitle';
import api from '../../Config/axios';
import { BASE_URL } from '../../Config/constants';


export default function AddCategory() {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(1);
    const [sortOrder, setSortOrder] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nameError, setNameError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (name.length > 30) {
            alert('Category Name cannot exceed 30 characters.');
            return;
        }
        if (name.startsWith(' ')) {
            alert('Category Name cannot start with a space.');
            return;
        }
        if (/^[^a-zA-Z0-9]/.test(name) || /[^a-zA-Z0-9]$/.test(name)) {
            alert('Category Name cannot start or end with special characters.');
            return;
        }
        
        try {
            setIsSubmitting(true);
            
            // Updated to use BASE_URL constant instead of environment variable
            const response = await fetch(`${BASE_URL}/Categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: name, description: description.trim(), status, sort_order: sortOrder }),
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Category added successfully!');
                navigate('/categories');
            } else {
                alert('Failed to add category: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error("Error adding category:", error);
            alert('An error occurred while adding the category.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h4 className="card-title mb-0">Add New Category</h4>
                        <button 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => navigate('/categories')}
                        >
                            <i className="ri-arrow-left-line me-1"></i> Back
                        </button>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Category Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className={`form-control bg-body text-body ${nameError ? 'is-invalid' : ''}`}
                                    name="name"
                                    required
                                    value={name}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setName(value);
                                        
                                        // Real-time validation
                                        if (value.length > 30) {
                                            setNameError('Category Name cannot exceed 30 characters.');
                                        } else if (value.startsWith(' ')) {
                                            setNameError('Category Name cannot start with a space.');
                                        } else if (/^[^a-zA-Z0-9]/.test(value) || /[^a-zA-Z0-9]$/.test(value)) {
                                            setNameError('Category Name cannot start or end with special characters.');
                                        } else {
                                            setNameError('');
                                        }
                                    }}
                                    disabled={isSubmitting}
                                />
                                {nameError && <div className="invalid-feedback d-block">{nameError}</div>}
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Description</label>
                                <textarea
                                    className="form-control bg-body text-body"
                                    name="description"
                                    rows="3"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Sort Order</label>
                                <input
                                    type="number"
                                    className="form-control bg-body text-body"
                                    name="sort_order"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                                    disabled={isSubmitting}
                                    min="0"
                                />
                                <small className="form-text text-muted">Lower numbers appear first</small>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Status</label>
                                <select
                                    className="form-select bg-body text-body"
                                    name="is_active"
                                    value={status}
                                    onChange={(e) => setStatus(parseInt(e.target.value))}
                                    disabled={isSubmitting}
                                >
                                    <option value={1}>Active</option>
                                    <option value={0}>Inactive</option>
                                </select>
                            </div>
                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/categories')}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Saving...
                                        </>
                                    ) : (
                                        'Add Category'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
