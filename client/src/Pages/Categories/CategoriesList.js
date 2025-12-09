import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AutocompleteInput from '../../Components/AutocompleteInput';

export default function CategoriesList() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtered, setFiltered] = useState([]);
    const [filters, setFilters] = useState({ name: '', status: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3189'}/Categories`);
            const data = await response.json();
            
            if (data.success) {
                setCategories(data.data);
                setFiltered(data.data);
            } else {
                toast.error('Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Error fetching categories: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let list = categories;
        const n = filters.name.trim().toLowerCase();
        const s = filters.status.trim().toLowerCase();
        if (n) list = list.filter(c => (c.name || '').toLowerCase().includes(n));
        if (s) list = list.filter(c => {
            const active = c.is_active ? 'active' : 'inactive';
            return active.includes(s);
        });
        setFiltered(list);
        setCurrentPage(1); // Reset to first page when filters change
    }, [filters, categories]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [filtered, loading]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3189'}/Categories/${id}`, {
                    method: 'DELETE'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    toast.success('Category deleted successfully');
                    // Refresh the categories list
                    fetchCategories();
                } else {
                    toast.error(data.message || 'Failed to delete category');
                }
            } catch (error) {
                console.error('Error deleting category:', error);
                toast.error('Error deleting category: ' + error.message);
            }
        }
    };

    const handleAddCategory = () => {
        navigate('/categories/add');
    };

    const handleEdit = (id) => {
        navigate(`/categories/edit/${id}`);
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const renderPagination = () => {
        const pageNumbers = [];
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }

        return (
            <nav aria-label="Categories pagination">
                <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                    </li>
                    
                    {pageNumbers.map(number => (
                        <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                            <button 
                                className="page-link" 
                                onClick={() => handlePageChange(number)}
                            >
                                {number}
                            </button>
                        </li>
                    ))}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        );
    };

    if (loading) {
        return (
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Categories Management</h4>
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
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Categories Management</h4>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={handleAddCategory}
                        >
                            <i data-lucide="plus" className="me-2"></i> Add Category
                        </button>
                    </div>
                    <div className="card-body">
                        <div className="row mb-3 align-items-end">
                            <div className="col-md-4">
                                <AutocompleteInput
                                    label="Category"
                                    placeholder="Category"
                                    value={filters.name}
                                    onChange={(v) => setFilters({ ...filters, name: v })}
                                    suggestions={Array.from(new Set(categories.map(c => c.name).filter(Boolean)))}
                                />
                            </div>
                            <div className="col-md-3">
                                <AutocompleteInput
                                    label="Status"
                                    placeholder="All Statuses"
                                    value={filters.status}
                                    onChange={(v) => setFilters({ ...filters, status: v })}
                                    suggestions={["active","inactive"]}
                                />
                            </div>
                            <div className="col-md-5 d-flex justify-content-end gap-2">
                                <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={() => setFilters({ ...filters })}
                                >
                                    Filter
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => setFilters({ name: '', status: '' })}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                        {categories.length === 0 ? (
                            <div className="text-center py-5">
                                <h5>No categories found</h5>
                                <p>Click "Add Category" to create your first category.</p>
                            </div>
                        ) : (
                            <>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Description</th>
                                                <th>Status</th>
                                                <th>Sort Order</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((category) => (
                                                <tr key={category.id}>
                                                    <td>{category.id}</td>
                                                    <td>{category.name}</td>
                                                    <td>{category.description || '-'}</td>
                                                    <td>
                                                        <span className={`badge ${category.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                            {category.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>{category.sort_order || 0}</td>
                                                    <td>
                                                        <button
                                                            className="btn btn-sm btn-outline-warning me-1"
                                                            onClick={() => handleEdit(category.id)}
                                                        >
                                                            <i data-lucide="edit"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDelete(category.id)}
                                                        >
                                                            <i data-lucide="trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="mt-4">
                                        {renderPagination()}
                                        <div className="text-center mt-2 text-muted">
                                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filtered.length)} of {filtered.length} entries
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}