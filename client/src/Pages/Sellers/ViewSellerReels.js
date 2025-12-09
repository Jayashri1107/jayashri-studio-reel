import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import { formatDateTime } from '../../Components/Utility';
import ApproveRejectButtons from '../../Components/ApproveRejectButtons';
import VideoModal from '../../Components/VideoModal';

export default function ViewSellerReels() {
    const { sellerId } = useParams();
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [filteredReels, setFilteredReels] = useState([]);
    const [filters, setFilters] = useState({ title: '', status: '', date: '', product: '', category: '', brand: '' });
    const [loading, setLoading] = useState(false);
    const [modalVideo, setModalVideo] = useState(null);
    const [modalReel, setModalReel] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);
    const [sellerName, setSellerName] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const resp = await ApiService.getSellerReelsPublic(sellerId);
                if (resp.success) {
                    const items = Array.isArray(resp.data) ? resp.data : [];
                    setReels(items);
                    setFilteredReels(items);
                    // Try to get seller name from the first reel or use sellerId
                    if (items.length > 0 && items[0].seller_name) {
                        setSellerName(items[0].seller_name);
                    } else {
                        setSellerName(`Seller #${sellerId}`);
                    }
                } else {
                    toast.error('Failed to load seller reels');
                    setReels([]);
                    setFilteredReels([]);
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
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [reels, filteredReels]);

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Seller Reels - {sellerName}</h4>
                        </div>
                        <div>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/sellers/reels')}>
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
                                    value={filters.title}
                                    onChange={(e) => setFilters({ ...filters, title: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label fw-normal">Status</label>
                                <select
                                    className="form-select bg-body text-body"
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
                                <label className="form-label fw-normal">Date Added</label>
                                <input
                                    type="date"
                                    className="form-control bg-body text-body"
                                    value={filters.date}
                                    onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label fw-normal">Product</label>
                                <input
                                    type="text"
                                    className="form-control bg-body text-body"
                                    placeholder="Product"
                                    value={filters.product}
                                    onChange={(e) => setFilters({ ...filters, product: e.target.value })}
                                />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label fw-normal">Category</label>
                                <input
                                    type="text"
                                    className="form-control bg-body text-body"
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
                                            <th>Views</th>
                                            <th>Likes</th>
                                            <th>Status</th>
                                            <th>Created</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredReels.length === 0 ? (
                                            <tr>
                                                <td colSpan="11" className="text-center text-muted py-5">
                                                    No reels found
                                                </td>
                                            </tr>
                                        ) : filteredReels.map(r => (
                                            <tr key={r.id}>
                                                <td>{r.title || 'Untitled'}</td>
                                                <td>
                                                    {r.video_url ? (
                                                        <button className="btn btn-sm btn-outline-success" onClick={() => openVideo(r)}>
                                                            <i data-lucide="play"></i> Play
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
                                                        ? r.product_names.join(', ') 
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
                                                    <span className={`badge ${r.status === 'approved' ? 'bg-success' : (r.status === 'rejected' ? 'bg-danger' : 'bg-warning')}`}>
                                                        {r.status || 'pending'}
                                                    </span>
                                                </td>
                                                <td>{formatDateTime(r.created_at) || '-'}</td>
                                                <td>
                                                    <ApproveRejectButtons
                                                        onApprove={async () => {
                                                            try {
                                                                setUpdatingId(r.id);
                                                                const resp = await ApiService.approveSellerReel(r.id);
                                                                if (resp.success) {
                                                                    const ref = await ApiService.getSellerReelsPublic(sellerId);
                                                                    setReels(Array.isArray(ref.data) ? ref.data : []);
                                                                    toast.success('Reel approved successfully');
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
                                                                const resp = await ApiService.rejectSellerReel(r.id);
                                                                if (resp.success) {
                                                                    const ref = await ApiService.getSellerReelsPublic(sellerId);
                                                                    setReels(Array.isArray(ref.data) ? ref.data : []);
                                                                    toast.success('Reel rejected successfully');
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
                products={modalReel?.product_names || (modalReel?.product_name ? [modalReel.product_name] : [])}
                brands={modalReel?.brand_names || (modalReel?.brand_name ? [modalReel.brand_name] : [])}
                onClose={closeModal}
                size="lg"
            />
        </div>
    );
}

