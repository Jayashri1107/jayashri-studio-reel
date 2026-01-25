import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import { formatDateTime } from '../../Components/Utility';
import ApproveRejectButtons from '../../Components/ApproveRejectButtons';
import VideoModal from '../../Components/VideoModal';
import Pagination from '../../Components/Pagination';

export default function ViewInfluencerReels() {
    const { influencerId } = useParams();
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [filteredReels, setFilteredReels] = useState([]);
    const [filters, setFilters] = useState({ title: '', status: '', date: '', product: '', category: '', brand: '' });
    const [uiFilters, setUiFilters] = useState({ title: '', status: '', date: '', product: '', category: '', brand: '' });
    const [loading, setLoading] = useState(false);
    const [modalVideo, setModalVideo] = useState(null);
    const [modalReel, setModalReel] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const [updatingAction, setUpdatingAction] = useState(null); // 'approve' | 'reject' | null

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const resp = await ApiService.getInfluencerReelsById(influencerId);
                if (resp.success) {
                    const items = Array.isArray(resp.data) ? resp.data : [];
                    setReels(items);
                    setFilteredReels(items);
                } else {
                    toast.error('Failed to load influencer reels');
                    setReels([]);
                    setFilteredReels([]);
                }
            } catch (error) {
                console.error('Error loading influencer reels:', error);
                toast.error('Failed to load influencer reels');
                setReels([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [influencerId]);

    const openVideo = (reel) => {
        if (!reel?.video_url) {
            toast.error('No video available');
            return;
        }
        setModalVideo(reel.video_url);
        setModalReel(reel);
    };

    const closeModal = () => setModalVideo(null);

    // Handle deleting an influencer reel
    const handleDelete = async (reelId) => {
        if (window.confirm('Are you sure you want to delete this reel? This action cannot be undone.')) {
            try {
                setUpdatingId(reelId);
                const response = await ApiService.deleteReel(reelId);
                if (response.success) {
                    // Refresh the reels list after deletion
                    const resp = await ApiService.getInfluencerReelsById(influencerId);
                    if (resp.success) {
                        const items = Array.isArray(resp.data) ? resp.data : [];
                        setReels(items);
                        setFilteredReels(items);
                    }
                    toast.success('Reel deleted successfully');
                } else {
                    toast.error(response?.message || 'Failed to delete reel');
                }
            } catch (error) {
                console.error('Error deleting reel:', error);
                toast.error('Failed to delete reel');
            } finally {
                setUpdatingId(null);
            }
        }
    };

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

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Influencer Reels</h4>
                        </div>
                        <div>
                            <button className="btn btn-outline-secondary" onClick={() => navigate('/influencers/reels')}>
                    <i className="ri-arrow-left-line align-bottom me-1"></i> Back
                </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row mb-3">
                            <div className="col-md-2 mb-3">
                                <label className="form-label fw-normal">Title</label>
                                <input
                                    type="text"
                                    className="form-control bg-body text-body"
                                    placeholder="Title"
                                    value={uiFilters.title}
                                    onChange={(e) => setUiFilters({ ...uiFilters, title: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label fw-normal">Status</label>
                                <select
                                    className="form-select bg-body text-body"
                                    value={uiFilters.status}
                                    onChange={(e) => setUiFilters({ ...uiFilters, status: e.target.value })}
                                >
                                    <option value="">All</option>
                                    <option value="approved">approved</option>
                                    <option value="pending">pending</option>
                                    <option value="rejected">rejected</option>
                                </select>
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label fw-normal">Date Added</label>
                                <input
                                    type="date"
                                    className="form-control bg-body text-body"
                                    value={uiFilters.date}
                                    onChange={(e) => setUiFilters({ ...uiFilters, date: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label fw-normal">Product</label>
                                <input
                                    type="text"
                                    className="form-control bg-body text-body"
                                    placeholder="Product"
                                    value={uiFilters.product}
                                    onChange={(e) => setUiFilters({ ...uiFilters, product: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label fw-normal">Category</label>
                                <input
                                    type="text"
                                    className="form-control bg-body text-body"
                                    placeholder="Category"
                                    value={uiFilters.category}
                                    onChange={(e) => setUiFilters({ ...uiFilters, category: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label fw-normal">Brand</label>
                                <input
                                    type="text"
                                    className="form-control bg-body text-body"
                                    placeholder="Brand"
                                    value={uiFilters.brand}
                                    onChange={(e) => setUiFilters({ ...uiFilters, brand: e.target.value })}
                                />
                            </div>
                            
                        </div>
                        <div className="row mb-3">
                            <div className="col-12 d-flex justify-content-end gap-2">
                                <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={() => setFilters({ ...uiFilters })}
                                >
                                    Apply
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => { setUiFilters({ title: '', status: '', date: '', product: '', category: '', brand: '' }); setFilters({ title: '', status: '', date: '', product: '', category: '', brand: '' }); }}
                                >
                                    Clear
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
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Video</th>
                                            <th>Thumbnail</th>
                                            <th className="text-start">Products</th>
                                            <th>Brands</th>
                                            <th>Category</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReels.slice((currentPage - 1) * pageSize, (currentPage - 1) * pageSize + pageSize).map(r => (
                                            <tr key={r.id}>
                                                <td>{r.title || 'Untitled'}</td>
                                                <td>
                                                    {r.video_url ? (
                                                        <button className="btn btn-sm btn-outline-success" onClick={() => openVideo(r)}>Play</button>
                                                    ) : 'N/A'}
                                                </td>
                                                <td>
                                                    {r.thumbnail ? (
                                                        <div className="thumb-with-actions">
                                                            <img src={r.thumbnail} alt="thumb" style={{ width: 60, height: 60, objectFit: 'cover' }} />
                                                  
                                                        </div>
                                                    ) : 'N/A'}
                                                </td>
                                                <td className="text-start">{Array.isArray(r.product_names) && r.product_names.length ? r.product_names.map((name, index) => `${index + 1}. ${name}`).join(', ') : 'N/A'}</td>
                                                <td>{Array.isArray(r.brand_names) && r.brand_names.length ? r.brand_names.join(', ') : 'N/A'}</td>
                                                <td>{r.category_name || 'N/A'}</td>
                                                <td>
                                                    <span className={`badge ${r.status === 'approved' ? 'bg-success' : (r.status === 'rejected' ? 'bg-danger' : 'bg-warning')}`}>{r.status}</span>
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
                                                                    const resp = await ApiService.approveInfluencerReel(r.id);
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
                                                                    const resp = await ApiService.rejectInfluencerReel(r.id);
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
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDelete(r.id)}
                                                            title="Delete Reel"
                                                            disabled={updatingId === r.id}
                                                        >
                                                            <i data-lucide="trash-2" style={{width: '16px', height: '16px'}}></i>
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
                products={modalReel?.product_names}
                brands={modalReel?.brand_names}
                onClose={closeModal}
                size="md"
            />
        </div>
    );
}
