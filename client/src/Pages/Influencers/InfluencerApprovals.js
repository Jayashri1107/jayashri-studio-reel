import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import VideoModal from '../../Components/VideoModal';
import AutocompleteInput from '../../Components/AutocompleteInput';

export default function InfluencerApprovals() {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVideo, setModalVideo] = useState(null);
    const [modalReel, setModalReel] = useState(null);
    const [filters, setFilters] = useState({ title: '', products: '', brands: '', status: '', date: '' });
    const [uiFilters, setUiFilters] = useState({ title: '', products: '', brands: '', status: '', date: '' });
    const [filteredReels, setFilteredReels] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const resp = await ApiService.getInfluencerReelsAdmin();
                if (resp.success) {
                    // getInfluencerReelsAdmin already returns only approved reels
                    const approvedReels = Array.isArray(resp.data) ? resp.data : [];
                    setReels(approvedReels);
                } else {
                    toast.error('Failed to load influencer reels');
                    setReels([]);
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
    }, []);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [reels, filteredReels, loading]);

    useEffect(() => {
        setFilteredReels(reels);
    }, [reels]);

    useEffect(() => {
        let list = reels;
        const t = filters.title.trim().toLowerCase();
        const p = filters.products.trim().toLowerCase();
        const b = filters.brands.trim().toLowerCase();
        const s = filters.status.trim().toLowerCase();
        const d = filters.date.trim();
        if (t) list = list.filter(r => (r.title || '').toLowerCase().includes(t));
        if (p) list = list.filter(r => {
            const names = Array.isArray(r.product_names) ? r.product_names : [];
            return names.some(name => (name || '').toLowerCase().includes(p));
        });
        if (b) list = list.filter(r => {
            const names = Array.isArray(r.brand_names) ? r.brand_names : [];
            return names.some(name => (name || '').toLowerCase().includes(b));
        });
        if (s) list = list.filter(r => (r.status || '').toLowerCase() === s);
        if (d) list = list.filter(r => {
            try {
                const ds = new Date(r.created_at).toISOString().slice(0,10);
                return ds === d;
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

    const openVideo = (reel) => {
        if (!reel?.video_url) {
            toast.error('No video available');
            return;
        }
        setModalVideo(reel.video_url);
        setModalReel(reel);
    };
    const closeModal = () => setModalVideo(null);

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

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Approved Influencer Reels</h4>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row mb-3">
                            <div className="col-md-3">
                                <AutocompleteInput
                                    label="Title"
                                    placeholder="Title"
                                    value={uiFilters.title}
                                    onChange={(v) => setUiFilters({ ...uiFilters, title: v })}
                                    suggestions={Array.from(new Set(reels.map(r => r.title).filter(Boolean)))}
                                />
                            </div>
                            <div className="col-md-3">
                                <AutocompleteInput
                                    label="Products"
                                    placeholder="Products"
                                    value={uiFilters.products}
                                    onChange={(v) => setUiFilters({ ...uiFilters, products: v })}
                                    suggestions={Array.from(new Set(reels.flatMap(r => Array.isArray(r.product_names) ? r.product_names : []).filter(Boolean)))}
                                />
                            </div>
                            <div className="col-md-2">
                                <AutocompleteInput
                                    label="Brands"
                                    placeholder="Brands"
                                    value={uiFilters.brands}
                                    onChange={(v) => setUiFilters({ ...uiFilters, brands: v })}
                                    suggestions={Array.from(new Set(reels.flatMap(r => Array.isArray(r.brand_names) ? r.brand_names : []).filter(Boolean)))}
                                />
                            </div>
                            <div className="col-md-2">
                                <AutocompleteInput
                                    label="Status"
                                    placeholder="All Statuses"
                                    value={uiFilters.status}
                                    onChange={(v) => setUiFilters({ ...uiFilters, status: v })}
                                    suggestions={["approved","pending","rejected"]}
                                    className="form-control bg-body text-body"
                                />
                            </div>
                            <div className="col-md-2 mb-3">
                                <label className="form-label fw-normal">Created</label>
                                <input
                                    type="date"
                                    className="form-control bg-body text-body"
                                    value={uiFilters.date}
                                    onChange={(e) => setUiFilters({ ...uiFilters, date: e.target.value })}
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
                                    onClick={() => { setUiFilters({ title: '', products: '', brands: '', status: '', date: '' }); setFilters({ title: '', products: '', brands: '', status: '', date: '' }); }}
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
                            <>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Video</th>
                                                <th>Thumbnail</th>
                                                <th>Products</th>
                                                <th>Brands</th>
                                                <th>Status</th>
                                                <th>Created</th>
                                                
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentReels.map(r => (
                                                <tr key={r.id}>
                                                    <td>{r.title || 'Untitled'}</td>
                                                    <td>
                                                        {r.video_url ? (
                                                            <button className="btn btn-sm btn-outline-success" onClick={() => openVideo(r)}>Play</button>
                                                        ) : 'N/A'}
                                                    </td>
                                                    <td>
                                                        {r.thumbnail ? (
                                                            <img src={r.thumbnail} alt="thumb" style={{ width: 60, height: 60, objectFit: 'cover' }} />
                                                        ) : 'N/A'}
                                                    </td>
                                                    <td>{Array.isArray(r.product_names) && r.product_names.length ? r.product_names.join(', ') : 'N/A'}</td>
                                                    <td>{Array.isArray(r.brand_names) && r.brand_names.length ? r.brand_names.join(', ') : 'N/A'}</td>
                                                    <td>
                                                        <span className={`badge ${r.status === 'approved' ? 'bg-success' : (r.status === 'rejected' ? 'bg-danger' : 'bg-warning')}`}>{r.status || 'pending'}</span>
                                                    </td>
                                                    <td>{r.created_at || '-'}</td>
                                                    
                                                </tr>
                                            ))}
                                            {reels.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="text-center text-muted">No approved influencer reels</td>
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
