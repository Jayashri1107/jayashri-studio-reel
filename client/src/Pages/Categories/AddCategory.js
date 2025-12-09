import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function AddCategory() {
    const navigate = useNavigate();
    const [category, setCategory] = useState({ 
        name: '', 
        description: '',
        sort_order: 0,
        is_active: 1  // Changed to numeric value to match database
    });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCategory(prev => ({
            ...prev,
            [name]: name === 'is_active' ? parseInt(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!category.name.trim()) {
            toast.error('Category name is required');
            return;
        }

        setLoading(true);
        
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3189'}/Categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: category.name,
                    description: category.description,
                    sort_order: parseInt(category.sort_order) || 0,
                    is_active: category.is_active  // Already numeric
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                toast.success('Category added successfully');
                // Redirect to categories list after successful addition
                navigate('/categories');
            } else {
                toast.error(data.message || 'Failed to add category');
            }
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Failed to add category: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/categories');
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title mb-0">Add New Category</h4>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Category Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control bg-body text-body"
                                    name="name"
                                    required
                                    value={category.name}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Description</label>
                                <textarea
                                    className="form-control bg-body text-body"
                                    name="description"
                                    rows="3"
                                    value={category.description}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Sort Order</label>
                                <input
                                    type="number"
                                    className="form-control bg-body text-body"
                                    name="sort_order"
                                    min="0"
                                    value={category.sort_order}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Status</label>
                                <select
                                    className="form-select bg-body text-body"
                                    name="is_active"
                                    value={category.is_active}
                                    onChange={handleInputChange}
                                    disabled={loading}
                                >
                                    <option value={1}>Active</option>
                                    <option value={0}>Inactive</option>
                                </select>
                            </div>
                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
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
