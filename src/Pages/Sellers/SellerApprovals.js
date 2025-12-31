import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import Pagination from '../../Components/Pagination';

export default function SellerApprovals() {
    const [approvedReels, setApprovedReels] = useState([]);
    const [filteredReels, setFilteredReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [uiFilters, setUiFilters] = useState({ title: '', product: '', brand: '', date: '' });
    const [activeFilters, setActiveFilters] = useState({ title: '', product: '', brand: '', date: '' });

    useEffect(() => {
        fetchApprovedSellerReels();
    }, []);

    useEffect(() => {
        if (window.lucide) {
            setTimeout(() => {
                window.lucide.createIcons();
            }, 100);
        }
    }, [approvedReels, filteredReels, currentPage, uiFilters]);

    // Apply filters when activeFilters change
    useEffect(() => {
        let filtered = [...approvedReels];
        
        const titleFilter = activeFilters.title.trim().toLowerCase();
        const productFilter = activeFilters.product.trim().toLowerCase();
        const brandFilter = activeFilters.brand.trim().toLowerCase();
        const dateFilter = activeFilters.date.trim();
        
        if (titleFilter) {
            filtered = filtered.filter(r => (r.title || '').toLowerCase().includes(titleFilter));
        }
        
        if (productFilter) {
            filtered = filtered.filter(r => {
                const productNames = Array.isArray(r.product_names) ? r.product_names : (r.product_name ? [r.product_name] : []);
                return productNames.some(name => name.toLowerCase().includes(productFilter));
            });
        }
        
        if (brandFilter) {
            filtered = filtered.filter(r => {
                const brandNames = Array.isArray(r.brand_names) ? r.brand_names : (r.brand_name ? [r.brand_name] : []);
                return brandNames.some(name => name.toLowerCase().includes(brandFilter));
            });
        }
        
        if (dateFilter) {
            filtered = filtered.filter(r => {
                try {
                    const reelDate = new Date(r.created_at).toISOString().slice(0, 10);
                    return reelDate === dateFilter;
                } catch {
                    return false;
                }
            });
        }
        
        setFilteredReels(filtered);
        setCurrentPage(1); // Reset to first page when filters change
    }, [approvedReels, activeFilters]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReels = filteredReels.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredReels.length / itemsPerPage);

    const fetchApprovedSellerReels = async () => {
        try {
            setLoading(true);
            const sellersResp = await ApiService.getAllSellers();
            const sellers = Array.isArray(sellersResp?.data) ? sellersResp.data : [];
            const aggregated = [];
            for (const s of sellers) {
                const vendorId = s.vendor_id || s.id || s.application_id;
                if (!vendorId) continue;
                try {
                    const reelsResp = await ApiService.getSellerReelsPublic(vendorId);
                    const reels = Array.isArray(reelsResp?.data) ? reelsResp.data : [];
                    for (const r of reels) {
                        const status = (r.status || '').toLowerCase();
                        if (status === 'approved') {
                            const name = s.name || `${(s.firstname || '').trim()} ${(s.lastname || '').trim()}`.trim();
                            aggregated.push({
                                ...r,
                                vendor_id: vendorId,
                                seller_name: name || `Seller #${vendorId}`
                            });
                        }
                    }
                } catch (e) {
                }
            }
            setApprovedReels(aggregated);
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to fetch approved reels');
            setApprovedReels([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setActiveFilters({ ...uiFilters });
    };

    const handleClearFilters = () => {
        setUiFilters({ title: '', product: '', brand: '', date: '' });
        setActiveFilters({ title: '', product: '', brand: '', date: '' });
    };

    

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };


    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">Seller Approvals</h4>
                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item"><a href="/">Dashboard</a></li>
                                <li className="breadcrumb-item active">Seller Approvals</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Approved Seller Reels</h4>
                        </div>
                        <div className="card-body">
                            {/* Filter Section */}
                            <div className="mb-4 p-3 bg-body-secondary rounded border">
                                <div className="row g-3 align-items-end">
                                    <div className="col-md-3">
                                        <label className="form-label fw-semibold mb-2">Title</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search by title..."
                                            value={uiFilters.title}
                                            onChange={(e) => setUiFilters({ ...uiFilters, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="form-label fw-semibold mb-2">Product</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search by product..."
                                            value={uiFilters.product}
                                            onChange={(e) => setUiFilters({ ...uiFilters, product: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="form-label fw-semibold mb-2">Brand</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search by brand..."
                                            value={uiFilters.brand}
                                            onChange={(e) => setUiFilters({ ...uiFilters, brand: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-2">
                                        <label className="form-label fw-semibold mb-2">Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={uiFilters.date}
                                            onChange={(e) => setUiFilters({ ...uiFilters, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="col-md-3 d-flex gap-2 align-items-end">
                                        <button 
                                            className="btn btn-primary btn-sm"
                                            onClick={handleApplyFilters}
                                        >
                                            <i data-lucide="filter"></i> Filter
                                        </button>
                                        <button 
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={handleClearFilters}
                                        >
                                            <i data-lucide="x"></i> Clear
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {approvedReels.length === 0 ? (
                                <div className="text-center py-5">
                                    <i data-lucide="check-circle" className="text-success mb-3" style={{ fontSize: '48px' }}></i>
                                    <h5>No Approved Reels</h5>
                                    <p className="text-muted">There are no approved seller reels to display.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Reel ID</th>
                                                    <th>Seller</th>
                                                    <th>Title</th>
                                                    <th>Products</th>
                                                    <th>Brands</th>
                                                    <th>Category</th>
                                                    <th>Views</th>
                                                    <th>Likes</th>
                                                    <th>Status</th>
                                                    <th>Created</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentReels.map((r) => (
                                                    <tr key={`${r.vendor_id}-${r.id}`}>
                                                        <td>{r.id}</td>
                                                        <td>{r.seller_name || 'N/A'}</td>
                                                        <td>{r.title || 'Untitled'}</td>
                                                        <td>
                                                            {Array.isArray(r.product_names) && r.product_names.length 
                                                                ? r.product_names.map((name, idx) => `${idx + 1}. ${name}`).join(', ')
                                                                : (r.product_name ? `1. ${r.product_name}` : 'N/A')}
                                                        </td>
                                                        <td>
                                                            {Array.isArray(r.brand_names) && r.brand_names.length 
                                                                ? r.brand_names.join(', ')
                                                                : (r.brand_name || 'N/A')}
                                                        </td>
                                                        <td>{r.category_name || 'N/A'}</td>
                                                        <td>{Number(r.views || r.view_count || 0).toLocaleString()}</td>
                                                        <td>{Number(r.likes || r.like_count || 0).toLocaleString()}</td>
                                                        <td>
                                                            <span className="badge bg-success">approved</span>
                                                        </td>
                                                        <td>{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={filteredReels.length}
                                        itemsPerPage={itemsPerPage}
                                        onPageChange={handlePageChange}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
