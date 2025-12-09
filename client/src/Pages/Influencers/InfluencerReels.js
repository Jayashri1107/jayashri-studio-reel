import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import { useNavigate } from 'react-router-dom';
import InfluencerReelsFilters from '../../Components/InfluencerReelsFilters';

// Modified by Vaishnavi
export default function InfluencerReels() {
    const [reels, setReels] = useState([]);
    const [filteredReels, setFilteredReels] = useState([]);
    const [filters, setFilters] = useState({ influencer: '', status: '', date: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const itemsPerPage = 5;
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
            try {
                setLoading(true);
                setError('');
                const resp = await ApiService.getInfluencerReelsAdmin();
                if (resp && resp.success) {
                    const rows = Array.isArray(resp.data) ? resp.data : [];
                    // Fixed platform and account mapping - Vaishnavi
                    const mapped = rows.map(r => ({
                        id: r.id,
                        influencer: r.influencer_name || 'Unknown',
                        platform: r.platform || '',
                        account: r.account_link || '',
                        video: r.video_url || '',
                        influencerId: r.influencer_id,
                        views: Number(r.views || 0),
                        likes: Number(r.likes || 0),
                        comments: Number(r.comments || 0),
                        status: r.status || 'pending',
                        dateAdded: r.created_at || null
                    }));
                    const precedence = { approved: 3, pending: 2, rejected: 1 };
                    const byInfluencer = new Map();
                    for (const r of mapped) {
                        if ((r.status || '').toLowerCase() !== 'approved') continue;
                        const key = r.influencerId || r.id;
                        if (!byInfluencer.has(key)) {
                            byInfluencer.set(key, { ...r });
                        } else {
                            const g = byInfluencer.get(key);
                            g.views += r.views;
                            g.likes += r.likes;
                            g.comments += r.comments;
                            const ps = precedence[r.status] || 0;
                            const pg = precedence[g.status] || 0;
                            if (ps > pg) {
                                g.status = r.status;
                            }
                        }
                    }
                    const result = Array.from(byInfluencer.values());
                    setReels(result);
                    setFilteredReels(result); // Initially show all reels
                    setError('');
                } else {
                    const errorMsg = resp?.message || 'Failed to load influencer reels';
                    setError(errorMsg);
                    setReels([]);
                    setFilteredReels([]);
                    toast.error(errorMsg);
                }
            } catch (error) {
                console.error('Error loading influencer reels:', error);
                const errorMsg = error?.response?.data?.message || error?.message || 'Failed to load influencer reels. Please check your connection and try again.';
                setError(errorMsg);
                toast.error(errorMsg);
                setReels([]);
                setFilteredReels([]);
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
    }, [reels, error, loading]);

    // Apply filters to reels
    useEffect(() => {
        let result = [...reels]; // Create a copy to avoid mutating state
        
        // Filter by influencer name
        if (filters.influencer) {
            const filterText = filters.influencer.toLowerCase().trim();
            result = result.filter(reel => 
                reel.influencer && reel.influencer.toLowerCase().includes(filterText)
            );
        }
        
        // Filter by status
        if (filters.status) {
            const filterText = filters.status.toLowerCase().trim();
            result = result.filter(reel => 
                reel.status && reel.status.toLowerCase().includes(filterText)
            );
        }
        
        // Filter by date
        if (filters.date) {
            result = result.filter(reel => {
                if (!reel.dateAdded) return false;
                try {
                    const reelDate = new Date(reel.dateAdded).toISOString().split('T')[0];
                    return reelDate === filters.date;
                } catch (e) {
                    return false;
                }
            });
        }
        
        setFilteredReels(result);
        setCurrentPage(1); // Reset to first page when filters change
    }, [filters, reels]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReels = filteredReels.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredReels.length / itemsPerPage);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const handleView = (influencerId) => {
        navigate(`/influencers/reels/view/${influencerId}`);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this reel?')) {
            try {
                const resp = await ApiService.deleteReel(id);
                if (resp && resp.success) {
                    setReels(reels.filter(reel => reel.id !== id));
                    setFilteredReels(filteredReels.filter(reel => reel.id !== id));
                    toast.success('Reel deleted successfully');
                } else {
                    toast.error(resp?.message || 'Failed to delete reel');
                }
            } catch (error) {
                toast.error('Failed to delete reel');
            }
        }
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

    return (
        <>
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Influencer Reels</h4>
                        </div>
                    </div>
                    <div className="card-body">
                        {error && (
                            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center gap-2">
                                    <i data-lucide="alert-circle"></i>
                                    <span>{error}</span>
                                </div>
                                <button className="btn btn-sm btn-outline-light" onClick={() => window.location.reload()}>
                                    <i data-lucide="refresh-cw"></i> Retry
                                </button>
                            </div>
                        )}
                        <InfluencerReelsFilters 
                            reels={reels} 
                            onFilterChange={handleFilterChange} 
                        />
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
                                            <th>Influencer</th>
                                            <th>Platform</th>
                                            <th>Account</th>
                                            <th>Views</th>
                                            <th>Likes</th>
                                            <th>Comments</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentReels.map((reel) => (
                                            <tr key={reel.influencerId || reel.id}>
                                                <td>{reel.influencer}</td>
                                                <td>{reel.platform || 'N/A'}</td>
                                                <td>
                                                    {reel.account ? (
                                                        <a href={reel.account} target="_blank" rel="noopener noreferrer">View</a>
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="badge bg-info">{reel.views.toLocaleString()}</span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-primary">{reel.likes}</span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-warning">{reel.comments}</span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${reel.status === 'approved' ? 'bg-success' : (reel.status === 'rejected' ? 'bg-danger' : 'bg-warning')}`}>
                                                        {reel.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-success me-2" onClick={() => handleView(reel.influencerId)}>
                                                        <i data-lucide="eye"></i>
                                                    </button>
                                                    
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(reel.id)}>
                                                        <i data-lucide="trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredReels.length === 0 && !loading && (
                                    <div className="text-center py-4">
                                        <p className="text-muted">
                                            {error ? 'No influencer reels found or error occurred.' : 'No influencer reels found matching the current filters.'}
                                        </p>
                                    </div>
                                )}
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
        
        </>
    );
}
