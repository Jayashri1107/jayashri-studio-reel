import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import api from '../../Config/axios';
import { formatDateTime } from '../../Components/Utility';
import ApproveRejectButtons from '../../Components/ApproveRejectButtons';
import VideoModal from '../../Components/VideoModal';
import { useUser } from '../../Context/UserContext';
import Pagination from '../../Components/Pagination';

export default function ViewSellerReels() {
    const { sellerId } = useParams();
    const navigate = useNavigate();
    const { user, userGroup, hasPermission } = useUser();
    const [reels, setReels] = useState([]);
    const [filteredReels, setFilteredReels] = useState([]);
    const [filters, setFilters] = useState({ title: '', status: '', date: '', product: '', category: '', brand: '' });
    const [loading, setLoading] = useState(false);
    const [modalVideo, setModalVideo] = useState(null);
    const [modalReel, setModalReel] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [updatingAction, setUpdatingAction] = useState(null); // 'approve' | 'reject' | null
    const [sellerName, setSellerName] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                let foundSellerName = false;
                
                // Fetch seller name from multiple sources
                try {
                    // First try: Get from SellerApproval endpoint
                    const sellersResp = await ApiService.getAllSellers();
                    if (sellersResp.success && Array.isArray(sellersResp.data)) {
                        // Try multiple matching strategies
                        const seller = sellersResp.data.find(s => {
                            const vendorId = s.vendor_id || s.id || s.application_id;
                            return String(vendorId) === String(sellerId);
                        });
                        
                        if (seller) {
                            // Try different name fields
                            const name = seller.name || 
                                       seller.seller_name ||
                                       `${(seller.first_name || seller.firstname || '').trim()} ${(seller.last_name || seller.lastname || '').trim()}`.trim();
                            if (name && !name.startsWith('Seller #') && name.trim()) {
                                setSellerName(name);
                                foundSellerName = true;
                            }
                        }
                    }
                    
                    // Second try: Get from studio reels API (oc_vendor table)
                    if (!foundSellerName) {
                        try {
                            const studioSellersResp = await api.get('/api/studio/reels/sellers');
                            if (studioSellersResp.data?.success && Array.isArray(studioSellersResp.data.data)) {
                                const seller = studioSellersResp.data.data.find(s => 
                                    String(s.vendor_id) === String(sellerId)
                                );
                                if (seller) {
                                    const name = `${(seller.first_name || seller.firstname || '').trim()} ${(seller.last_name || seller.lastname || '').trim()}`.trim();
                                    if (name && name.trim()) {
                                        setSellerName(name);
                                        foundSellerName = true;
                                    }
                                }
                            }
                        } catch (studioErr) {
                            console.error('Error fetching seller from studio API:', studioErr);
                        }
                    }
                } catch (err) {
                    console.error('Error fetching seller name from sellers list:', err);
                }
                
                // Fetch reels - this might also contain seller info
                const resp = await ApiService.getSellerReelsPublic(sellerId);
                if (resp.success) {
                    const items = Array.isArray(resp.data) ? resp.data : [];
                    setReels(items);
                    setFilteredReels(items);
                    
                    // If seller name not found yet, try from first reel
                    if (!foundSellerName && items.length > 0) {
                        const firstReel = items[0];
                        if (firstReel.seller_name && !firstReel.seller_name.startsWith('Seller #')) {
                            setSellerName(firstReel.seller_name);
                            foundSellerName = true;
                        }
                    }
                } else {
                    toast.error('Failed to load seller reels');
                    setReels([]);
                    setFilteredReels([]);
                }
                
                // Final fallback
                if (!foundSellerName) {
                    setSellerName(`Seller #${sellerId}`);
                }
            } catch (error) {
                console.error('Error loading seller reels:', error);
                toast.error('Failed to load seller reels');
                setReels([]);
                setFilteredReels([]);
                setSellerName(`Seller #${sellerId}`);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [sellerId]);

    const openVideo = (reel) => {
        if (!reel?.video_url) {
            toast.error('No video available');
            return;
        }
        setModalVideo(reel.video_url);
        setModalReel(reel);
    };

    const closeModal = () => setModalVideo(null);

    useEffect(() => {
        let list = reels;
        const t = filters.title.trim().toLowerCase();
        const s = filters.status.trim().toLowerCase();
        const d = filters.date.trim();
        const p = filters.product.trim().toLowerCase();
        const c = filters.category.trim().toLowerCase();
        const b = filters.brand.trim().toLowerCase();
        if (t) list = list.filter(r => (r.title || '').toLowerCase().includes(t));
        if (s) list = list.filter(r => (r.status || '').toLowerCase().includes(s));
        if (d) list = list.filter(r => (r.created_at || '').slice(0, 10) === d);
        if (p) list = list.filter(r => Array.isArray(r.product_names) && r.product_names.some(name => String(name).toLowerCase().includes(p)));
        if (c) list = list.filter(r => (r.category_name || '').toLowerCase().includes(c));
        if (b) list = list.filter(r => Array.isArray(r.brand_names) && r.brand_names.some(name => String(name).toLowerCase().includes(b)));
        setFilteredReels(list);
    }, [filters, reels]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, reels]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [reels, filteredReels]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this reel?')) {
            try {
                const response = await ApiService.deleteSellerReel(id);
                if (response.success) {
                    toast.success('Reel deleted successfully');
                    const ref = await ApiService.getSellerReelsPublic(sellerId);
                    setReels(Array.isArray(ref.data) ? ref.data : []);
                } else {
                    toast.error(response.message || 'Failed to delete reel');
                }
            } catch (error) {
                console.error('Error deleting reel:', error);
                toast.error('Failed to delete reel');
            }
        }
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Seller Reels - {sellerName}</h4>
                        </div>
                        <div>
                            <button className="btn btn-secondary" onClick={() => navigate('/studio/seller/reels')}>
                                <i className="ri-arrow-left-line"></i>Back
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row g-3 mb-3">
                            <div className="col-md-2">
                                <label className="form-label fw-semibold">Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Title"
                                    value={filters.title}
                                    onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-semibold">Status</label>
                                <select
                                    className="form-control"
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="">All</option>
                                    <option value="approved">Approved</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-semibold">Date Added</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filters.date}
                                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-semibold">Product</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Product"
                                    value={filters.product}
                                    onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-semibold">Category</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Category"
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label fw-semibold">Brand</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Brand"
                                    value={filters.brand}
                                    onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="row mb-3">
                            <div className="col-12 d-flex justify-content-end gap-2">
                                <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={() => setFilters({ ...filters })}
                                >
                                    <i className="ri-filter-2-line me-1"></i> Apply
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => setFilters({ title: '', status: '', date: '', product: '', category: '', brand: '' })}
                                >
                                    <i className="ri-refresh-line me-1"></i> Clear
                                </button>
                            </div>
                        </div>
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ minWidth: '150px' }}>Title</th>
                                            <th style={{ width: '100px' }}>Video</th>
                                            <th style={{ width: '100px' }}>Thumbnail</th>
                                            <th style={{ minWidth: '250px' }}>Products</th>
                                            <th style={{ minWidth: '150px' }}>Brands</th>
                                            <th style={{ minWidth: '120px' }}>Category</th>
                                            <th style={{ width: '100px' }}>Views</th>
                                            <th style={{ width: '100px' }}>Likes</th>
                                            <th style={{ width: '100px' }}>Status</th>
                                            <th style={{ width: '150px' }}>Created</th>
                                            <th style={{ width: '150px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReels.length === 0 ? (
                                            <tr>
                                                <td colSpan="11" className="text-center text-muted py-5">
                                                    {reels.length === 0 ? 'No reels found' : 'No record found'}
                                                </td>
                                            </tr>
                                        ) : filteredReels.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize).map(r => (
                                            <tr key={r.id}>
                                                <td className="text-truncate" style={{ maxWidth: '150px' }} title={r.title || 'Untitled'}>
                                                    {r.title || 'Untitled'}
                                                </td>
                                                <td>
                                                    {r.video_url ? (
                                                        <button className="btn btn-sm btn-outline-success" onClick={() => openVideo(r)}>
                                                            <i data-lucide="play" style={{ width: '16px', height: '16px' }}></i>
                                                        </button>
                                                    ) : 'N/A'}
                                                </td>
                                                <td>
                                                    {r.thumbnail ? (
                                                        <img src={r.thumbnail} alt="thumb" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '4px' }} />
                                                    ) : 'N/A'}
                                                </td>
                                                <td>
                                                    {Array.isArray(r.product_names) && r.product_names.length 
                                                        ? (
                                                            <div className="d-flex flex-column gap-1">
                                                                {r.product_names.map((name, index) => (
                                                                    <span key={index} className="text-dark">
                                                                        {index + 1}. {name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )
                                                        : (r.product_name || 'N/A')}
                                                </td>
                                                <td>
                                                    {Array.isArray(r.brand_names) && r.brand_names.length 
                                                        ? r.brand_names.join(', ') 
                                                        : (r.brand_name || 'N/A')}
                                                </td>
                                                <td>{r.category_name || 'N/A'}</td>
                                                <td>
                                                    <span className="badge bg-secondary">
                                                        {Number(r.views || r.view_count || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-primary">
                                                        {Number(r.likes || r.like_count || 0).toLocaleString()}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${r.status === 'approved' ? 'bg-success' : (r.status === 'rejected' ? 'bg-danger' : 'bg-warning text-dark')}`}>
                                                        {r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : 'Pending'}
                                                    </span>
                                                </td>
                                                <td>{formatDateTime(r.created_at) || '-'}</td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <ApproveRejectButtons
                                                            onApprove={async () => {
                                                                setUpdatingId(r.id);
                                                                setUpdatingAction('approve');
                                                                const nowIso = new Date().toISOString();
                                                                const prev = reels;
                                                                const updated = prev.map((x) =>
                                                                    String(x.id) === String(r.id)
                                                                        ? { ...x, status: 'approved', approved_at: x.approved_at || nowIso }
                                                                        : x
                                                                );
                                                                setReels(updated);
                                                                try {
                                                                    const resp = await ApiService.approveSellerReel(r.id);
                                                                    if (resp.success) {
                                                                        toast.success('Reel approved successfully');
                                                                    } else {
                                                                        toast.error(resp?.message || 'Approve failed');
                                                                        setReels(prev);
                                                                    }
                                                                } catch (e) {
                                                                    toast.error('Approve failed');
                                                                    setReels(prev);
                                                                } finally {
                                                                    setUpdatingId(null);
                                                                    setUpdatingAction(null);
                                                                }
                                                            }}
                                                            onReject={async () => {
                                                                setUpdatingId(r.id);
                                                                setUpdatingAction('reject');
                                                                const nowIso = new Date().toISOString();
                                                                const prev = reels;
                                                                const updated = prev.map((x) =>
                                                                    String(x.id) === String(r.id)
                                                                        ? { ...x, status: 'rejected', rejected_at: x.rejected_at || nowIso }
                                                                        : x
                                                                );
                                                                setReels(updated);
                                                                try {
                                                                    const resp = await ApiService.rejectSellerReel(r.id);
                                                                    if (resp.success) {
                                                                        toast.success('Reel rejected successfully');
                                                                    } else {
                                                                        toast.error(resp?.message || 'Reject failed');
                                                                        setReels(prev);
                                                                    }
                                                                } catch (e) {
                                                                    toast.error('Reject failed');
                                                                    setReels(prev);
                                                                } finally {
                                                                    setUpdatingId(null);
                                                                    setUpdatingAction(null);
                                                                }
                                                            }}
                                                            disabledApprove={
                                                                r.status === 'approved' ||
                                                                (updatingId === r.id && updatingAction === 'reject')
                                                            }
                                                            disabledReject={
                                                                r.status === 'rejected' ||
                                                                (updatingId === r.id && updatingAction === 'approve')
                                                            }
                                                            loadingApprove={updatingId === r.id && updatingAction === 'approve'}
                                                            loadingReject={updatingId === r.id && updatingAction === 'reject'}
                                                        />
                                                        <button 
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleDelete(r.id)}
                                                            title="Delete Reel"
                                                        >
                                                            <i data-lucide="trash-2" style={{ width: '16px', height: '16px' }}></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={Math.max(1, Math.ceil(filteredReels.length / pageSize))}
                                    totalItems={filteredReels.length}
                                    itemsPerPage={pageSize}
                                    onPageChange={(page) => setCurrentPage(page)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <VideoModal
                show={Boolean(modalVideo)}
                videoUrl={modalVideo}
                products={modalReel?.product_names || (modalReel?.product_name ? [modalReel.product_name] : [])}
                brands={modalReel?.brand_names || (modalReel?.brand_name ? [modalReel.brand_name] : [])}
                onClose={closeModal}
                size="lg"
            />
        </div>
    );
}

