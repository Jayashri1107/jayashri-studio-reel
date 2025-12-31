import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import { useNavigate } from 'react-router-dom';
import InfluencerReelsFilters from '../../Components/InfluencerReelsFilters';
import Pagination from '../../Components/Pagination';

// Modified by Vaishnavi
export default function InfluencerReels() {
    const [reels, setReels] = useState([]);
    const [filteredReels, setFilteredReels] = useState([]);
    const [filters, setFilters] = useState({ influencer: '', status: '', date: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [linksModal, setLinksModal] = useState({ open: false, links: [], name: '' });
    const itemsPerPage = 5;
    const navigate = useNavigate();

    const loadReels = async () => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        try {
            setLoading(true);
            setError('');
            // Fetch approved influencers with reel counts
            const resp = await ApiService.getApprovedInfluencersWithReelCounts();
            if (resp && resp.success) {
                const rows = Array.isArray(resp.data) ? resp.data : [];
                // Map the data to match the expected format
                const mapped = rows.map(r => ({
                    id: r.influencer_id,
                    influencer: r.influencer_name || `${r.firstname || ''} ${r.lastname || ''}`.trim() || 'Unknown',
                    platform: r.platform || '',
                    account: r.account_link || '',
                    influencerId: r.influencer_id,
                    reelCountTotal: Number(r.total_reel_count || r.reel_count || 0),
                    views: Number(r.total_views || 0),
                    likes: Number(r.total_likes || 0),
                    comments: Number(r.total_comments || 0),
                    status: 'approved',
                    email: r.email || ''
                }));
                
                setReels(mapped);
                setFilteredReels(mapped); // Initially show all influencers
                setError('');
            } else {
                const errorMsg = resp?.message || 'Failed to load approved influencers';
                setError(errorMsg);
                setReels([]);
                setFilteredReels([]);
                // Only show toast for actual errors, not empty results
                if (errorMsg && !errorMsg.includes('No')) {
                    toast.error(errorMsg);
                }
            }
        } catch (error) {
            console.error('Error loading approved influencers:', error);
            const errorMsg = error?.response?.data?.message || error?.message || 'Failed to load approved influencers. Please check your connection and try again.';
            setError(errorMsg);
            // Only show toast for network/server errors
            if (error?.response?.status >= 500 || error?.code === 'NETWORK_ERROR') {
                toast.error(errorMsg);
            }
            setReels([]);
            setFilteredReels([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReels();
    }, []);

    useEffect(() => {
        // Re-initialize icons after any state change, especially after filtering
        const timer = setTimeout(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        }, 150);
        return () => clearTimeout(timer);
    }, [reels, error, loading, filteredReels, currentPage, filters]);

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
        navigate(`/studio/influencer/profile/${influencerId}`);
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

    const openLinksModal = (account, name) => {
        const links = String(account || '')
            .split(/[\n,]+/)
            .map(l => l.trim())
            .filter(Boolean);
        if (!links.length) {
            toast.error('No account links available');
            return;
        }
        setLinksModal({ open: true, links, name: name || 'Account Links' });
    };

    const closeLinksModal = () => {
        setLinksModal({ open: false, links: [], name: '' });
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
                        {error && error.trim() !== '' && (
                            <div className="alert alert-danger d-flex align-items-center justify-content-between mb-3">
                                <div className="d-flex align-items-center gap-2">
                                    <i data-lucide="alert-circle"></i>
                                    <span>{error}</span>
                                </div>
                                <button className="btn btn-sm btn-outline-light" onClick={loadReels}>
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
                                            <th>Total Reels</th>
                                            <th>Views</th>
                                            <th>Likes</th>
                                            <th>Comments</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentReels.length === 0 ? (
                                            <tr>
                                                <td colSpan="9" className="text-center text-muted py-4">
                                                    {reels.length === 0 
                                                        ? (error ? 'No approved influencers found or error occurred.' : 'No approved influencers found.')
                                                        : 'No record found'}
                                                </td>
                                            </tr>
                                        ) : (
                                            currentReels.map((influencer) => (
                                            <tr key={influencer.influencerId || influencer.id}>
                                                <td>{influencer.influencer}</td>
                                                <td>{influencer.platform || 'N/A'}</td>
                                                <td>
                                                    {influencer.account ? (
                                                        <button
                                                            className="btn btn-link p-0"
                                                            onClick={() => openLinksModal(influencer.account, influencer.influencer)}
                                                        >
                                                            View
                                                        </button>
                                                    ) : (
                                                        'N/A'
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="badge bg-info">{influencer.reelCountTotal || 0}</span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-secondary">{influencer.views.toLocaleString()}</span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-primary">{influencer.likes.toLocaleString()}</span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-warning">{influencer.comments.toLocaleString()}</span>
                                                </td>
                                                <td>
                                                    <span className="badge bg-success">
                                                        {influencer.status || 'approved'}
                                                    </span>
                                                </td>
                                                    <td style={{ minWidth: '100px' }}>
                                                        <div className="d-flex gap-2 align-items-center">
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary" 
                                                            onClick={() => handleView(influencer.influencerId)}
                                                            title="View Reels"
                                                                type="button"
                                                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                                <i data-lucide="eye" style={{width: '16px', height: '16px', display: 'inline-block'}}></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            ))
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
        </div>
        {linksModal.open && (
            <div className="modal-portal-overlay">
                <div className="modal-portal modal-portal-sm">
                    <div className="modal-portal-header">
                        <h5 className="mb-0">{linksModal.name}</h5>
                        <button className="btn btn-sm btn-outline-secondary" onClick={closeLinksModal}>
                            <i className="ri-close-line align-bottom me-1"></i> Close
                        </button>
                    </div>
                    <div className="modal-portal-body">
                        <div className="table-responsive">
                            <table className="table table-bordered table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Platform</th>
                                        <th>Link</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linksModal.links.map((link, idx) => {
                                        // Detect platform from URL
                                        let platform = 'Other';
                                        if (link.toLowerCase().includes('instagram.com')) {
                                            platform = 'Instagram';
                                        } else if (link.toLowerCase().includes('youtube.com') || link.toLowerCase().includes('youtu.be')) {
                                            platform = 'YouTube';
                                        } else if (link.toLowerCase().includes('facebook.com')) {
                                            platform = 'Facebook';
                                        } else if (link.toLowerCase().includes('twitter.com') || link.toLowerCase().includes('x.com')) {
                                            platform = 'Twitter/X';
                                        } else if (link.toLowerCase().includes('tiktok.com')) {
                                            platform = 'TikTok';
                                        }
                                        
                                        return (
                                            <tr key={idx}>
                                                <td><strong>{platform}</strong></td>
                                                <td>
                                                    <span className="text-break d-inline-block" style={{ maxWidth: '300px' }}>
                                                        {link}
                                                    </span>
                                                </td>
                                                <td>
                                <a className="btn btn-sm btn-primary" href={link} target="_blank" rel="noopener noreferrer">
                                    Open
                                </a>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            </div>
                    </div>
                </div>
            </div>
        )}
        
        </>
    );
}
