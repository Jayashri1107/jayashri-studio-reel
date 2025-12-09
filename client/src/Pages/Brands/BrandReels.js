import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function BrandReels() {
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [filteredReels, setFilteredReels] = useState([]);
    const [filters, setFilters] = useState({ title: '', brand: '', category: '', status: '', date: '' });
    const [uiFilters, setUiFilters] = useState({ title: '', brand: '', category: '', status: '', date: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchAllReels();
    }, []);

    useEffect(() => {
        if (window.lucide) {
            // Small delay to ensure DOM is updated
            setTimeout(() => {
                window.lucide.createIcons();
            }, 100);
        }
    }, [error, reels, filteredReels, currentPage]);

    const fetchAllReels = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Fetch brand reels only from brand_reels table
            const brandReelsResponse = await ApiService.getBrandReels();

            let allReels = [];

            // Process brand reels (only from brand_reels table)
            if (brandReelsResponse && brandReelsResponse.success) {
                const data = Array.isArray(brandReelsResponse.data) ? brandReelsResponse.data : [];
                const processedBrandReels = data.map(reel => ({
                    ...reel,
                    id: reel.id,
                    title: reel.title || 'Untitled',
                    description: reel.description || '',
                    brand_id: reel.brand_id,
                    brand_name: reel.brand_name || 'N/A',
                    category_id: reel.category_id,
                    category_name: reel.category_name || 'N/A',
                    product_id: reel.product_id || null,
                    video_url: reel.video_url || null,
                    thumbnail_url: reel.thumbnail_url || null,
                    views: reel.views || 0,
                    likes: reel.likes || 0,
                    comments: reel.comments || 0,
                    status: reel.status || 'pending',
                    created_at: reel.created_at || new Date().toISOString(),
                    reelType: 'brand' // Only brand reels now
                }));
                allReels = [...processedBrandReels];
                setError('');
            } else {
                const errorMsg = brandReelsResponse?.message || 'Failed to fetch brand reels';
                setError(errorMsg);
                toast.error(errorMsg);
            }

            setReels(allReels);
            setFilteredReels(allReels);
        } catch (error) {
            console.error('Error fetching reels:', error);
            const errorMsg = error?.response?.data?.message || error?.message || 'Failed to fetch reels. Please check your connection and try again.';
            setError(errorMsg);
            toast.error(errorMsg);
            setReels([]);
            setFilteredReels([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let list = reels;
        const t = filters.title.trim().toLowerCase();
        const b = filters.brand.trim().toLowerCase();
        const c = filters.category.trim().toLowerCase();
        const s = filters.status.trim().toLowerCase();
        const d = filters.date.trim();
        if (t) list = list.filter(r => (r.title || '').toLowerCase().includes(t));
        if (b) list = list.filter(r => (r.brand_name || '').toLowerCase().includes(b));
        if (c) list = list.filter(r => (r.category_name || '').toLowerCase().includes(c));
        if (s) list = list.filter(r => (r.status || '').toLowerCase().includes(s));
        if (d) list = list.filter(r => {
            try {
                const dstr = new Date(r.created_at).toISOString().slice(0, 10);
                return dstr === d;
            } catch {
                return false;
            }
        });
        setFilteredReels(list);
        setCurrentPage(1); // Reset to first page when filters change
    }, [filters, reels]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReels = filteredReels.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredReels.length / itemsPerPage);

    const handleDelete = async (id, reelType) => {
        if (window.confirm(`Are you sure you want to delete this brand reel?`)) {
            try {
                // Handle brand_reels only
                const response = await ApiService.deleteReel(id);
                
                if (response.success) {
                    setReels(reels.filter(reel => reel.id !== id));
                    toast.success('Brand reel deleted successfully');
                } else {
                    toast.error('Failed to delete brand reel: ' + response.message);
                }
            } catch (error) {
                console.error('Error deleting brand reel:', error);
                toast.error(`Failed to delete ${reelType} reel`);
            }
        }
    };

    const handleAddBrandReel = () => {
        navigate('/brands/reels/add');
    };

    // Add handler for viewing a brand reel
    const handleViewBrandReel = (id) => {
        // Navigate to view page - assuming there's a view page
        navigate(`/brands/reels/view/${id}`);
    };

    // Add handler for editing a brand reel
    const handleEditBrandReel = (id) => {
        // Navigate to edit page
        navigate(`/brands/reels/edit/${id}`);
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
            <nav aria-label="Reels pagination">
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

    // Function to get badge class (all reels are now brand type)
    const getTypeBadgeClass = (reelType) => {
        return 'badge bg-success me-1';
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Brand Reels</h4>
                            <p className="mb-0 text-muted">Shows brand_reels and seller_reels with brand_id</p>
                        </div>
                        <div>
                            <button 
                                className="btn btn-primary"
                                onClick={handleAddBrandReel}
                            >
                                <i data-lucide="plus"></i> Add Brand Reel
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row mb-3">
                            <div className="col-md-3">
                                <label className="form-label fw-normal">Title</label>
                                <input
                                    type="text"
                                    className="form-control bg-body text-body"
                                    placeholder="Search by title..."
                                    value={uiFilters.title}
                                    onChange={(e) => setUiFilters({ ...uiFilters, title: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-normal">Brand</label>
                                <input
                                    type="text"
                                    className="form-control bg-body text-body"
                                    placeholder="Search by brand..."
                                    value={uiFilters.brand}
                                    onChange={(e) => setUiFilters({ ...uiFilters, brand: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-normal">Category</label>
                                <input
                                    type="text"
                                    className="form-control bg-body text-body"
                                    placeholder="Search by category..."
                                    value={uiFilters.category}
                                    onChange={(e) => setUiFilters({ ...uiFilters, category: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-normal">Status</label>
                                <select
                                    className="form-select bg-body text-body"
                                    value={uiFilters.status}
                                    onChange={(e) => setUiFilters({ ...uiFilters, status: e.target.value })}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="approved">Approved</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-normal">Date</label>
                                <input
                                    type="date"
                                    className="form-control bg-body text-body"
                                    value={uiFilters.date}
                                    onChange={(e) => setUiFilters({ ...uiFilters, date: e.target.value })}
                                />
                            </div>
                            <div className="col-md-3 d-flex align-items-end gap-2 justify-content-end">
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setFilters({ ...uiFilters })}
                                >
                                    Apply
                                </button>
                                <button 
                                    className="btn btn-outline-secondary"
                                    onClick={() => { setUiFilters({ title: '', brand: '', category: '', status: '', date: '' }); setFilters({ title: '', brand: '', category: '', status: '', date: '' }); }}
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center gap-2">
                                    <i data-lucide="alert-circle"></i>
                                    <span>{error}</span>
                                </div>
                                <button className="btn btn-sm btn-outline-light" onClick={fetchAllReels}>
                                    <i data-lucide="refresh-cw"></i> Retry
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Brand</th>
                                                <th>Category</th>
                                                <th>Views</th>
                                                <th>Likes</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                                <th>Type</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentReels.length > 0 ? (
                                                currentReels.map((reel) => (
                                                    <tr key={reel.id}>
                                                        <td>{reel.title}</td>
                                                        <td>{reel.brand_name}</td>
                                                        <td>{reel.category_name}</td>
                                                        <td>{reel.views}</td>
                                                        <td>{reel.likes}</td>
                                                        <td>{new Date(reel.created_at).toLocaleDateString()}</td>
                                                        <td>
                                                            <span className={`badge ${reel.status === 'approved' ? 'bg-success' : reel.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>
                                                                {reel.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={getTypeBadgeClass(reel.reelType)}>
                                                                {reel.reelType}
                                                            </span>
                                                        </td>
                                                        <td className="text-nowrap">
                                                            <div className="btn-group btn-group-sm" role="group">
                                                                <button 
                                                                    className="btn btn-info"
                                                                    title="View"
                                                                    onClick={() => handleViewBrandReel(reel.id)}
                                                                >
                                                                    <i data-lucide="eye"></i>
                                                                </button>
                                                                <button 
                                                                    className="btn btn-warning"
                                                                    title="Edit"
                                                                    onClick={() => handleEditBrandReel(reel.id)}
                                                                >
                                                                    <i data-lucide="edit"></i>
                                                                </button>
                                                                <button 
                                                                    className="btn btn-danger"
                                                                    onClick={() => handleDelete(reel.id, reel.reelType)}
                                                                    title="Delete"
                                                                >
                                                                    <i data-lucide="trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="9" className="text-center">
                                                        No reels found
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {totalPages > 1 && (
                                    <div className="mt-4">
                                        {renderPagination()}
                                        <div className="text-center mt-2 text-muted">
                                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredReels.length)} of {filteredReels.length} entries
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
