import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function EditCategory() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [category, setCategory] = useState({ 
        name: '', 
        description: '',
        sort_order: 0,
        is_active: 1  // Changed to numeric value to match database
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (id) {
            fetchCategory();
        }
    }, [id]);

    const fetchCategory = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3189'}/Categories/${id}`);
            const data = await response.json();
            
            if (data.success) {
                setCategory({
                    name: data.data.name || '',
                    description: data.data.description || '',
                    sort_order: data.data.sort_order || 0,
                    is_active: data.data.is_active  // Keep as numeric value
                });
            } else {
                toast.error(data.message || 'Failed to fetch category');
                navigate('/categories');
            }
        } catch (error) {
            console.error('Error fetching category:', error);
            toast.error('Error fetching category: ' + error.message);
            navigate('/categories');
        } finally {
            setFetching(false);
        }
    };

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
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3189'}/Categories/${id}`, {
                method: 'PUT',
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
                toast.success('Category updated successfully');
                // Redirect to categories list after successful update
                navigate('/categories');
            } else {
                toast.error(data.message || 'Failed to update category');
            }
        } catch (error) {
            console.error('Error updating category:', error);
            toast.error('Failed to update category: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigate('/categories');
    };

    if (fetching) {
        return (
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Edit Category</h4>
                        </div>
                        <div className="card-body text-center">
                            <div className="spinner-border" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title mb-0">Edit Category</h4>
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
                                    value={category.description || ''}
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
                                        'Update Category'
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
