import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import { formatDateTime } from '../../Components/Utility';
import ApproveRejectButtons from '../../Components/ApproveRejectButtons';
import VideoModal from '../../Components/VideoModal';

export default function ViewReel() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [filteredReels, setFilteredReels] = useState([]);
    const [filters, setFilters] = useState({ title: '', status: '', date: '', product: '', category: '', brand: '' });
    const [loading, setLoading] = useState(false);
  const [modalVideo, setModalVideo] = useState(null);
  const [modalReel, setModalReel] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [updatingAction, setUpdatingAction] = useState(null); // 'approve' | 'reject' | null
  const [sellerName, setSellerName] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const resp = await ApiService.getSellerReelsById(id);
                if (resp.success) {
                    const items = Array.isArray(resp.data) ? resp.data : [];
                    setReels(items);
                    setFilteredReels(items);
                } else {
                    toast.error('Failed to load seller reels');
                    setReels([]);
                    setFilteredReels([]);
                }
                // Load seller name to show in header
                try {
                    const sellersResp = await ApiService.getAllSellers();
                    const list = Array.isArray(sellersResp?.data) ? sellersResp.data : [];
                    const match = list.find(s => String(s.vendor_id ?? s.id) === String(id));
                    if (match) {
                        const name = match.name ?? `${(match.firstname || '')} ${(match.lastname || '')}`.trim();
                        if (name) {
                            setSellerName(name);
                        }
                    }
                } catch (_) {
                    // Ignore name load failure; header will fallback to ID
                }
            } catch (error) {
                console.error('Error loading seller reels:', error);
                toast.error('Failed to load seller reels');
                setReels([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

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

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">
                                {sellerName ? `Seller Reels - ${sellerName}` : `Seller Reels - Seller #${id}`}
                            </h4>
                        </div>
                        <div>
                            <button className="btn btn-outline-secondary" onClick={() => navigate('/sellers/reels')}>
                                <i className="ri-arrow-left-line align-bottom me-1"></i> Back
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row mb-3">
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Title"
                                    value={filters.title}
                                    onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Status</label>
                                <select
                                    className="form-select"
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                >
                                    <option value="">All</option>
                                    <option value="approved">approved</option>
                                    <option value="pending">pending</option>
                                    <option value="rejected">rejected</option>
                                </select>
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Date Added</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={filters.date}
                                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Product</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Product"
                                    value={filters.product}
                                    onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Category</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Category"
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label">Brand</label>
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
                                    Filter
                                </button>
                                <button
                                    className="btn btn-outline-secondary"
                                    type="button"
                                    onClick={() => setFilters({ title: '', status: '', date: '', product: '', category: '', brand: '' })}
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
                                            <th>Products</th>
                                            <th>Brands</th>
                                            <th>Category</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReels.map(r => (
                                            <tr key={r.id}>
                                                <td>{r.title || 'Untitled'}</td>
                                                <td>
                                                    {r.video_url ? (
                                                        <button className="btn btn-sm btn-outline-success" onClick={() => openVideo(r)}>Play</button>
                                                    ) : (
                                                        <span className="text-muted">No video</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {r.thumbnail_url ? (
                                                        <img src={r.thumbnail_url} alt="Thumbnail" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                                                    ) : (
                                                        <span className="text-muted">No thumbnail</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {Array.isArray(r.product_names) && r.product_names.length > 0 ? (
                                                        <div>
                                                            {r.product_names.map((name, idx) => (
                                                                <span key={idx} className="badge bg-info me-1">{name}</span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {Array.isArray(r.brand_names) && r.brand_names.length > 0 ? (
                                                        <div>
                                                            {r.brand_names.map((name, idx) => (
                                                                <span key={idx} className="badge bg-warning me-1">{name}</span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted">{r.brand_name || r.brand || '-'}</span>
                                                    )}
                                                </td>
                                                <td>{r.category_name || r.category || '-'}</td>
                                                <td>
                                                    <span className={`badge ${r.status === 'approved' ? 'bg-success' : r.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>
                                                        {r.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td>{formatDateTime(r.created_at || r.date_added)}</td>
                                                <td className="text-nowrap">
                                                    <div className="btn-group btn-group-sm" role="group">
                                                        <button
                                                            className="btn btn-success"
                                                            onClick={() => openVideo(r)}
                                                            title="Play Video"
                                                            disabled={!r.video_url}
                                                        >
                                                            <i data-lucide="play"></i>
                                                        </button>
                        <ApproveRejectButtons
                          onApprove={async () => {
                            setUpdatingId(r.id);
                            setUpdatingAction('approve');
                            try {
                              const resp = await ApiService.approveSellerReel(r.id);
                              if (resp.success) {
                                const ref = await ApiService.getSellerReelsById(id);
                                const items = Array.isArray(ref.data) ? ref.data : [];
                                setReels(items);
                                setFilteredReels(items);
                                toast.success('Reel approved successfully');
                              } else {
                                toast.error(resp.message || 'Failed to approve reel');
                              }
                            } catch (error) {
                              toast.error('Failed to approve reel');
                            } finally {
                              setUpdatingId(null);
                              setUpdatingAction(null);
                            }
                          }}
                          onReject={async () => {
                            setUpdatingId(r.id);
                            setUpdatingAction('reject');
                            try {
                              const resp = await ApiService.rejectSellerReel(r.id);
                              if (resp.success) {
                                const ref = await ApiService.getSellerReelsById(id);
                                const items = Array.isArray(ref.data) ? ref.data : [];
                                setReels(items);
                                setFilteredReels(items);
                                toast.success('Reel rejected successfully');
                              } else {
                                toast.error(resp.message || 'Failed to reject reel');
                              }
                            } catch (error) {
                              toast.error('Failed to reject reel');
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
                          size="sm"
                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {modalVideo && (
                <VideoModal 
                    videoUrl={modalVideo} 
                    onClose={closeModal} 
                    reel={modalReel}
                />
            )}
        </div>
    );
}
