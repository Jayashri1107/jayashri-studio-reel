import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import AutocompleteInput from '../../Components/AutocompleteInput';
import Pagination from '../../Components/Pagination';

export default function SellerReels() {
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [filtered, setFiltered] = useState([]);
    
    const [filters, setFilters] = useState(() => {
        const saved = sessionStorage.getItem('seller_reels_filters');
        return saved ? JSON.parse(saved) : { sellerName: '', status: '' };
    });
    
    const [tempFilters, setTempFilters] = useState(() => {
        const saved = sessionStorage.getItem('seller_reels_filters');
        return saved ? JSON.parse(saved) : { sellerName: '', status: '' };
    });

    const [error, setError] = useState('');
    
    const [currentPage, setCurrentPage] = useState(() => {
        const saved = sessionStorage.getItem('seller_reels_page');
        return saved ? parseInt(saved, 10) : 1;
    });
    
    const itemsPerPage = 5;

    useEffect(() => {
        sessionStorage.setItem('seller_reels_filters', JSON.stringify(filters));
    }, [filters]);

    useEffect(() => {
        sessionStorage.setItem('seller_reels_page', currentPage);
    }, [currentPage]);

    const loadReels = async () => {
        try {
            if (window.lucide) {
                window.lucide.createIcons();
            }
            
            // Directly load seller reels instead of admin reels
            const sellersResp = await ApiService.getAllSellers();
            if (sellersResp.success && Array.isArray(sellersResp.data)) {
                const sellers = sellersResp.data;
                const summaries = [];
                for (const s of sellers) {
                    // Try different ways to get the vendorId
                    const vendorId = s.vendor_id || s.id || s.application_id;
                    if (!vendorId) {
                        summaries.push({ id: `s-unknown`, seller_name: 'Unknown Seller', seller_id: 'unknown', reel_count: 0, views: 0, likes: 0, followers: 0, status: s.status || 'approved' });
                        continue;
                    }
                    const name = (s.name ?? `${(s.firstname || '').trim()} ${(s.lastname || '').trim()}`.trim()) || `Seller #${vendorId}`;
                    let views = 0, likes = 0, followers = 0, count = 0;
                    try {
                        const r = await ApiService.getSellerReelsPublic(vendorId);
                        if (r.success && Array.isArray(r.data)) {
                            count = r.data.length;
                            for (const rr of r.data) {
                                views += Number(rr.views || rr.view_count || 0);
                                likes += Number(rr.likes || rr.like_count || 0);
                                followers += Number(rr.followers || rr.follower_count || 0);
                            }
                        }
                    } catch (error) {
                        // Silent fail for individual seller reel fetch errors
                    }
                    summaries.push({ id: `s-${vendorId}`, seller_name: name, seller_id: vendorId, reel_count: count, views, likes, followers, status: s.status || 'approved' });
                }
                setReels(summaries);
                setFiltered(summaries);
                setError('');
            } else {
                setReels([]);
                const msg = sellersResp.message || 'Failed to load sellers';
                setError(msg);
                toast.error(msg);
            }
        } catch (error) {
            console.error('Error loading seller reels:', error);
            setError('Failed to load reels');
            setReels([]);
            toast.error('Failed to load reels');
        }
    };

    useEffect(() => {
        loadReels();
        
        // Initialize icons on mount
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    // Apply filters only when filters state changes (triggered by Filter button)
    useEffect(() => {
        let list = reels;
        const sellerName = filters.sellerName.trim().toLowerCase();
        const status = filters.status.trim().toLowerCase();
        
        if (sellerName) {
            list = list.filter(r => (r.seller_name || '').toLowerCase().includes(sellerName));
        }
        
        if (status) {
            list = list.filter(r => {
                const reelStatus = (r.status || 'pending').toLowerCase();
                return reelStatus === status;
            });
        }
        
        setFiltered(list);
        setCurrentPage(1); // Reset to first page when filters change
    }, [filters, reels]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReels = filtered.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const handleFilter = () => {
        // Apply the temporary filters
        setFilters({ ...tempFilters });
    };

    const handleClear = () => {
        // Clear both temp and applied filters
        setTempFilters({ sellerName: '', status: '' });
        setFilters({ sellerName: '', status: '' });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }, 100);
        
        return () => clearTimeout(timer);
    }, [reels, filtered, currentPage]);

    // Handle deleting a reel
    const handleDelete = async (id) => {
        // Extract the actual seller ID from our custom ID format (s-{vendorId})
        const sellerId = id.startsWith('s-') ? id.substring(2) : id;
        
        // Since we're only showing seller summaries, we can't delete individual reels here
        // We could redirect to the seller's reels page where they can delete individual reels
        toast.info('Please view the seller\'s reels to delete individual reels');
        // Alternatively, if we want to implement deletion of all seller reels, we would need
        // a new API endpoint for that functionality
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleViewDetails = (seller) => {
        const vendorId = seller.seller_id || seller.id;
        navigate(`/studio/seller/profile/${vendorId}`);
    };


    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Seller Reels</h4>
                        </div>
                        <button 
                            className="btn btn-primary" 
                            onClick={() => navigate('/studio/seller/upload')}
                        >
                            <i className="ri-add-line align-middle me-1"></i> Add Reel
                        </button>
                    </div>
                    <div className="card-body">
                        <div className="row mb-3 align-items-end">
                            <div className="col-md-4">
                                <AutocompleteInput
                                    label="Seller Name"
                                    placeholder="Seller Name"
                                    value={tempFilters.sellerName}
                                    onChange={(v) => setTempFilters({ ...tempFilters, sellerName: v })}
                                    suggestions={Array.from(new Set(reels.map(r => r.seller_name).filter(Boolean)))}
                                />
                            </div>
                            <div className="col-md-3">
                                <AutocompleteInput
                                    label="Status"
                                    placeholder="All Statuses"
                                    value={tempFilters.status}
                                    onChange={(v) => setTempFilters({ ...tempFilters, status: v })}
                                    suggestions={['approved', 'pending', 'rejected']}
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
                        <>
                            {error && (
                                <div className="alert alert-danger d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2">
                                        <i data-lucide="alert-circle"></i>
                                        <span>{error}</span>
                                    </div>
                                    <button className="btn btn-sm btn-outline-light" onClick={loadReels}>Retry</button>
                                </div>
                            )}
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Seller</th>
                                            <th>Reel Count</th>
                                            <th>Pending</th>
                                            <th>Views</th>
                                            <th>Likes</th>
                                            <th>Followers</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentReels.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="text-center text-danger">
                                                    {error || 'No reels found'}
                                                </td>
                                            </tr>
                                        ) : currentReels.map((reel) => (
                                            <tr key={reel.id}>
                                                <td>{reel.seller_name || reel.seller_id || '-'}</td>
                                                <td>
                                                    <span className="badge bg-info">{Number(reel.reel_count ?? 0)}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${reel.pending_count > 0 ? 'bg-warning text-dark' : 'bg-success'}`}>
                                                        {Number(reel.pending_count ?? 0)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-secondary">{Number(reel.views ?? reel.view_count ?? 0).toLocaleString()}</span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-primary">{Number(reel.likes ?? reel.like_count ?? 0)}</span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-warning">{Number(reel.followers ?? reel.follower_count ?? 0)}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${reel.status === 'approved' ? 'bg-success' : reel.status === 'rejected' ? 'bg-danger' : 'bg-warning'}`}>{reel.status || 'pending'}</span>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => handleViewDetails(reel)}
                                                            title="View Reels"
                                                        >
                                                            <i data-lucide="eye" style={{width: '16px', height: '16px'}}></i>
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
                    </div>
                </div>
            </div>
        </div>
    );
}
