import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageTitle from '../../Components/PageTitle';
import api from '../../Config/axios';
import { BASE_URL } from '../../Config/constants';


export default function EditCategory() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState(1);
    const [sortOrder, setSortOrder] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nameError, setNameError] = useState('');

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Use api instance which includes authentication headers
            const response = await api.get(`/Categories/${id}`);
            const result = response.data;
            
            if (result.success && result.data) {
                // Handle both array and object response formats
                const category = Array.isArray(result.data) ? result.data[0] : result.data;
                
                if (category) {
                    setName(category.name || '');
                    setDescription(category.description || '');
                    setStatus(category.is_active !== undefined && category.is_active !== null ? category.is_active : (category.status !== undefined && category.status !== null ? category.status : 1));
                    setSortOrder(category.sort_order !== undefined && category.sort_order !== null ? parseInt(category.sort_order) : 0);
                } else {
                    console.error("Category data is empty");
                    alert('Category not found or data is invalid');
                }
            } else {
                console.error("Failed to fetch category:", result.message);
                alert(result.message || 'Failed to fetch category details');
            }
        } catch (error) {
            console.error("Error fetching category:", error);
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred while fetching category details';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (name.length > 30) {
            setNameError('Category Name cannot exceed 30 characters.');
            return;
        }
        if (name.startsWith(' ')) {
            setNameError('Category Name cannot start with a space.');
            return;
        }
        if (/^[^a-zA-Z0-9]/.test(name) || /[^a-zA-Z0-9]$/.test(name)) {
            setNameError('Category Name cannot start or end with special characters.');
            return;
        }

        try {
            setIsSubmitting(true);
            
            // Use api instance which includes authentication headers
            const response = await api.put(`/Categories/${id}`, {
                name: name,
                description,
                status,
                sort_order: sortOrder
            });
            
            const result = response.data;
            
            if (result.success) {
                alert('Category updated successfully!');
                navigate('/categories');
            } else {
                alert('Failed to update category: ' + (result.message || 'Unknown error'));
            }
        } catch (error) {
            console.error("Error updating category:", error);
            const errorMessage = error.response?.data?.message || error.message || 'An error occurred while updating the category';
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                                    disabled={loading}
                                />
                                {nameError && <div className="invalid-feedback d-block">{nameError}</div>}
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Description</label>
                                <textarea
                                    className="form-control bg-body text-body"
                                    name="description"
                                    rows="3"
                                    value={description || ''}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={loading}
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
                                    disabled={loading || isSubmitting}
                                    min="0"
                                />
                                <small className="form-text text-muted">Lower numbers appear first</small>
                            </div>
                            <div className="mb-3">
                                <label className="form-label fw-normal">Status</label>
                                <select
                                    className="form-select bg-body text-body"
                                    name="status"
                                    value={status}
                                    onChange={(e) => setStatus(parseInt(e.target.value))}
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
                                    onClick={() => navigate('/categories')}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {isSubmitting ? (
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
