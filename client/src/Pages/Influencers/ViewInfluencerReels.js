import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import { formatDateTime } from '../../Components/Utility';
import ApproveRejectButtons from '../../Components/ApproveRejectButtons';
import VideoModal from '../../Components/VideoModal';

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
                            <h4 className="card-title mb-0">Influencer Reels</h4>
                        </div>
                        <div>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/influencers/reels')}>
                                <i data-lucide="arrow-left"></i>
                                &nbsp;Back
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
                                                    ) : 'N/A'}
                                                </td>
                                                <td>
                                                    {r.thumbnail ? (
                                                        <div className="thumb-with-actions">
                                                            <img src={r.thumbnail} alt="thumb" style={{ width: 60, height: 60, objectFit: 'cover' }} />
                                                  
                                                        </div>
                                                    ) : 'N/A'}
                                                </td>
                                                <td>{Array.isArray(r.product_names) && r.product_names.length ? r.product_names.join(', ') : 'N/A'}</td>
                                                <td>{Array.isArray(r.brand_names) && r.brand_names.length ? r.brand_names.join(', ') : 'N/A'}</td>
                                                <td>{r.category_name || 'N/A'}</td>
                                                <td>
                                                    <span className={`badge ${r.status === 'approved' ? 'bg-success' : (r.status === 'rejected' ? 'bg-danger' : 'bg-warning')}`}>{r.status}</span>
                                                </td>
                                                <td>{formatDateTime(r.created_at) || '-'}</td>
                                                <td>
                                                    <ApproveRejectButtons
                                                        onApprove={async () => {
                                                            try {
                                                                setUpdatingId(r.id);
                                                                const resp = await ApiService.approveInfluencerReel(r.id);
                                                                if (resp.success) {
                                                                    const ref = await ApiService.getInfluencerReelsById(influencerId);
                                                                    setReels(Array.isArray(ref.data) ? ref.data : []);
                                                                } else {
                                                                    toast.error(resp?.message || 'Approve failed');
                                                                }
                                                            } catch (e) {
                                                                toast.error('Approve failed');
                                                            } finally {
                                                                setUpdatingId(null);
                                                            }
                                                        }}
                                                        onReject={async () => {
                                                            try {
                                                                setUpdatingId(r.id);
                                                                const resp = await ApiService.rejectInfluencerReel(r.id);
                                                                if (resp.success) {
                                                                    const ref = await ApiService.getInfluencerReelsById(influencerId);
                                                                    setReels(Array.isArray(ref.data) ? ref.data : []);
                                                                } else {
                                                                    toast.error(resp?.message || 'Reject failed');
                                                                }
                                                            } catch (e) {
                                                                toast.error('Reject failed');
                                                            } finally {
                                                                setUpdatingId(null);
                                                            }
                                                        }}
                                                        disabledApprove={updatingId === r.id}
                                                        disabledReject={updatingId === r.id}
                                                    />
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

            <VideoModal
                show={Boolean(modalVideo)}
                videoUrl={modalVideo}
                products={modalReel?.product_names}
                brands={modalReel?.brand_names}
                onClose={closeModal}
                size="sm"
            />
        </div>
    );
}
