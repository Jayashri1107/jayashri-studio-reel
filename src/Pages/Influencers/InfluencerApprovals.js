import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import VideoModal from '../../Components/VideoModal';
import AutocompleteInput from '../../Components/AutocompleteInput';
import Pagination from '../../Components/Pagination';

export default function InfluencerApprovals() {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVideo, setModalVideo] = useState(null);
    const [modalReel, setModalReel] = useState(null);
    const [filters, setFilters] = useState({ title: '', products: '', brands: '', date: '' });
    const [uiFilters, setUiFilters] = useState({ title: '', products: '', brands: '', date: '' });
    const [filteredReels, setFilteredReels] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                // Use the approved reels endpoint directly
                const resp = await ApiService.getAllApprovedInfluencerReels();
                if (resp && resp.success) {
                    const approvedReels = Array.isArray(resp.data) ? resp.data : [];
                    // Map the data to include product and brand names if needed
                    const mappedReels = approvedReels.map(reel => {
                        // Handle product_names - could be array or string
                        let productNames = [];
                        if (Array.isArray(reel.product_names)) {
                            productNames = reel.product_names.filter(Boolean);
                        } else if (typeof reel.product_names === 'string' && reel.product_names.trim()) {
                            // Handle comma-separated string (try both ', ' and ',')
                            productNames = reel.product_names
                                .split(/,|\s*,\s*/)
                                .map(n => n.trim())
                                .filter(Boolean);
                        }
                        
                        // Handle brand_names - could be array or string
                        let brandNames = [];
                        if (Array.isArray(reel.brand_names)) {
                            brandNames = reel.brand_names.filter(Boolean);
                        } else if (typeof reel.brand_names === 'string' && reel.brand_names.trim()) {
                            // Handle comma-separated string (try both ', ' and ',')
                            brandNames = reel.brand_names
                                .split(/,|\s*,\s*/)
                                .map(n => n.trim())
                                .filter(Boolean);
                        }
                        
                        // Handle thumbnail URL - backend should already provide full URLs, but handle edge cases
                        let thumbnailUrl = reel.thumbnail || reel.thumbnail_url || null;
                        if (thumbnailUrl) {
                            // If it's already a full URL (http/https), use it as-is
                            if (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://')) {
                                // URL is already complete
                            } else if (thumbnailUrl.startsWith('//')) {
                                // Protocol-relative URL, add https
                                thumbnailUrl = `https:${thumbnailUrl}`;
                            } else {
                                // Relative path, construct full URL
                                const baseUrl = window.location.origin;
                                thumbnailUrl = `${baseUrl}${thumbnailUrl.startsWith('/') ? '' : '/'}${thumbnailUrl}`;
                            }
                        }
                        
                        return {
                        ...reel,
                        id: reel.reel_id || reel.id,
                        status: 'approved',
                            product_names: productNames,
                            brand_names: brandNames,
                            thumbnail: thumbnailUrl,
                        created_at: reel.date_added || reel.created_at
                        };
                    });
                    setReels(mappedReels);
                } else {
                    const errorMsg = resp?.message || 'Failed to load approved influencer reels';
                    // Only show toast for actual errors, not empty results
                    if (errorMsg && !errorMsg.includes('No')) {
                        toast.error(errorMsg);
                    }
                    setReels([]);
                }
            } catch (error) {
                console.error('Error loading approved influencer reels:', error);
                const errorMsg = error?.response?.data?.message || error?.message || 'Failed to load approved influencer reels';
                // Only show toast for network/server errors
                if (error?.response?.status >= 500 || error?.code === 'NETWORK_ERROR') {
                    toast.error(errorMsg);
                }
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
                        <div className="mb-4 p-3 bg-body-secondary rounded border">
                            <div className="row g-3 align-items-end">
                                <div className="col-md-2">
                                    <AutocompleteInput
                                        label="Title"
                                        placeholder="Title"
                                        value={uiFilters.title}
                                        onChange={(v) => setUiFilters({ ...uiFilters, title: v })}
                                        suggestions={Array.from(new Set(reels.map(r => r.title).filter(Boolean)))}
                                    />
                                </div>
                                <div className="col-md-2">
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
                                    <label className="form-label fw-semibold mb-2">Created</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={uiFilters.date}
                                        onChange={(e) => setUiFilters({ ...uiFilters, date: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-2 d-flex gap-2 align-items-end justify-content-end">
                                    <button
                                        className="btn btn-primary"
                                        type="button"
                                        onClick={() => setFilters({ ...uiFilters })}
                                    >
                                        Filter
                                    </button>
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={() => { setUiFilters({ title: '', products: '', brands: '', date: '' }); setFilters({ title: '', products: '', brands: '', date: '' }); }}
                                    >
                                        Clear
                                    </button>
                                </div>
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
                                                            <img 
                                                                src={r.thumbnail} 
                                                                alt="thumb" 
                                                                style={{ 
                                                                    width: 60, 
                                                                    height: 60, 
                                                                    objectFit: 'cover',
                                                                    borderRadius: '4px'
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'inline';
                                                                }}
                                                            />
                                                        ) : (
                                                            <span className="text-body mb-0">N/A</span>
                                                        )}
                                                        {r.thumbnail && <span style={{ display: 'none' }} className="text-muted">N/A</span>}
                                                    </td>
                                                    <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>
                                                        {(() => {
                                                            // Handle both array and string formats
                                                            let products = [];
                                                            if (Array.isArray(r.product_names)) {
                                                                products = r.product_names.filter(Boolean);
                                                            } else if (typeof r.product_names === 'string' && r.product_names.trim()) {
                                                                products = r.product_names.split(/,|\s*,\s*/).map(n => n.trim()).filter(Boolean);
                                                            }
                                                            const text = products.length > 0 
                                                                ? products.map((name, idx) => `${idx + 1}. ${name}`).join(', ')
                                                                : 'N/A';
                                                            return (
                                                                <div>
                                                                    {text}
                                                                </div>
                                                            );
                                                        })()}
                                                    </td>
                                                    <td>
                                                        {(() => {
                                                            // Handle both array and string formats
                                                            let brands = [];
                                                            if (Array.isArray(r.brand_names)) {
                                                                brands = r.brand_names.filter(Boolean);
                                                            } else if (typeof r.brand_names === 'string' && r.brand_names.trim()) {
                                                                brands = r.brand_names.split(/,|\s*,\s*/).map(n => n.trim()).filter(Boolean);
                                                            }
                                                            return brands.length > 0 ? brands.join(', ') : 'N/A';
                                                        })()}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${r.status === 'approved' ? 'bg-success' : (r.status === 'rejected' ? 'bg-danger' : 'bg-warning')}`}>{r.status || 'pending'}</span>
                                                    </td>
                                                    <td>
                                                        {r.created_at ? (
                                                            new Date(r.created_at).toLocaleString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })
                                                        ) : '-'}
                                                    </td>
                                                    
                                                </tr>
                                            ))}
                                            {currentReels.length === 0 && filteredReels.length === 0 && reels.length > 0 && (
                                                <tr>
                                                    <td colSpan="7" className="text-center text-muted">No record found</td>
                                                </tr>
                                            )}
                                            {reels.length === 0 && (
                                                <tr>
                                                    <td colSpan="7" className="text-center text-muted">No approved influencer reels</td>
                                                </tr>
                                            )}
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
