import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageTitle from '../../Components/PageTitle';
import Shimmer from '../../Components/Shimmer';
import AutocompleteInput from '../../Components/AutocompleteInput';
import Pagination from '../../Components/Pagination';
import api from '../../Config/axios';
import { BASE_URL } from '../../Config/constants';

export default function CategoriesList() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtered, setFiltered] = useState([]);
    const [filters, setFilters] = useState({ name: '', status: '' });
    const [tempFilters, setTempFilters] = useState({ name: '', status: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchCategories();
        
        // Initialize icons on mount
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    // Initialize Lucide icons after render
    useEffect(() => {
        const timer = setTimeout(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }, 100);
        
        return () => clearTimeout(timer);
    }, [categories, filtered, currentPage]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            // Updated to use BASE_URL constant instead of environment variable
            const response = await fetch(`${BASE_URL}/Categories`);
            const result = await response.json();
            
            if (result.success) {
                setCategories(result.data);
                setFiltered(result.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        } finally {
            setLoading(false);
        }
    };

    // Apply filters only when filters state changes (triggered by Filter button)
    useEffect(() => {
        let list = categories;
        const n = filters.name.trim().toLowerCase();
        const s = filters.status.trim().toLowerCase();
        if (n) list = list.filter(c => (c.name || '').toLowerCase().includes(n));
        if (s) list = list.filter(c => {
            const active = c.is_active ? 'active' : 'inactive';
            return active === s;
        });
        setFiltered(list);
        setCurrentPage(1); // Reset to first page when filters change
    }, [filters, categories]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const handleDelete = async (id) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this category?");
        if (confirmDelete) {
            try {
                // Updated to use BASE_URL constant instead of environment variable
                const response = await fetch(`${BASE_URL}/Categories/${id}`, {
                    method: 'DELETE'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Category deleted successfully!');
                    fetchCategories(); // Refresh the list
                } else {
                    alert('Failed to delete category: ' + (result.message || 'Unknown error'));
                }
            } catch (error) {
                console.error("Error deleting category:", error);
                alert('An error occurred while deleting the category.');
            }
        }
    };

    const handleAddCategory = () => {
        window.location.href = '/categories/add';
    };

    const handleEdit = (id) => {
        window.location.href = `/categories/edit/${id}`;
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleFilter = () => {
        // Apply the temporary filters
        setFilters({ ...tempFilters });
    };

    const handleClear = () => {
        // Clear both temp and applied filters
        setTempFilters({ name: '', status: '' });
        setFilters({ name: '', status: '' });
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
                            <i className="ri-add-line align-middle me-1"></i> Add Category
                        </button>
                    </div>
                    <div className="card-body">
                        <div className="row mb-3 align-items-end">
                            <div className="col-md-4">
                                <AutocompleteInput
                                    label="Category"
                                    placeholder="Category"
                                    value={tempFilters.name}
                                    onChange={(v) => setTempFilters({ ...tempFilters, name: v })}
                                    suggestions={Array.from(new Set(categories.map(c => c.name).filter(Boolean)))}
                                    maxSuggestions={5}
                                    keepOpenOnSelect={true}
                                />
                            </div>
                            <div className="col-md-3">
                                <AutocompleteInput
                                    label="Status"
                                    placeholder="All Statuses"
                                    value={tempFilters.status}
                                    onChange={(v) => setTempFilters({ ...tempFilters, status: v })}
                                    suggestions={["active", "inactive"]}
                                    renderSuggestion={(s) => (
                                        <div className="d-flex justify-content-between align-items-center w-100">
                                            <span>{s}</span>
                                            <span style={{width:8,height:8,borderRadius:'50%',backgroundColor: s==='active' ? '#28a745' : '#dc3545'}}></span>
                                        </div>
                                    )}
                                />
                            </div>
                            <div className="col-md-5 d-flex justify-content-end gap-2">
                                <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={handleFilter}
                                >
                                    Filter
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={handleClear}
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
                                                    <td>
                                                        <div className="d-flex gap-2">
                                                            <button
                                                                className="btn btn-sm btn-outline-warning"
                                                                onClick={() => handleEdit(category.id)}
                                                                title="Edit Category"
                                                            >
                                                                <i data-lucide="edit" style={{width: '16px', height: '16px'}}></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-outline-danger"
                                                                onClick={() => handleDelete(category.id)}
                                                                title="Delete Category"
                                                            >
                                                                <i data-lucide="trash-2" style={{width: '16px', height: '16px'}}></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={filtered.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={handlePageChange}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
