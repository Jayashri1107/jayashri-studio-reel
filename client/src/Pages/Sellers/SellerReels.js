import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function SellerReels() {
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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
                    console.log('Seller data:', s); // Add logging
                    // Try different ways to get the vendorId
                    const vendorId = s.vendor_id || s.id || s.application_id;
                    console.log('Using vendorId:', vendorId); // Add logging
                    if (!vendorId) {
                        console.error('Could not determine vendorId for seller:', s);
                        summaries.push({ id: `s-unknown`, seller_name: 'Unknown Seller', seller_id: 'unknown', reel_count: 0, views: 0, likes: 0, followers: 0, status: s.status || 'approved' });
                        continue;
                    }
                    const name = (s.name ?? `${(s.firstname || '').trim()} ${(s.lastname || '').trim()}`.trim()) || `Seller #${vendorId}`;
                    let views = 0, likes = 0, followers = 0, count = 0;
                    try {
                        const r = await ApiService.getSellerReelsPublic(vendorId);
                        console.log('Seller reels response for vendorId', vendorId, ':', r); // Add logging
                        if (r.success && Array.isArray(r.data)) {
                            count = r.data.length;
                            console.log(`Found ${count} reels for vendorId ${vendorId}`); // Add logging
                            for (const rr of r.data) {
                                views += Number(rr.views || rr.view_count || 0);
                                likes += Number(rr.likes || rr.like_count || 0);
                                followers += Number(rr.followers || rr.follower_count || 0);
                            }
                        } else {
                            console.log('No reels data found for vendorId', vendorId); // Add logging
                        }
                    } catch (error) {
                        console.error('Error fetching seller reels for vendorId', vendorId, ':', error); // Add error logging
                        // Check if it's a 404 error (seller not found)
                        if (error.response && error.response.status === 404) {
                            console.log('Seller not found in oc_sellers table for vendorId:', vendorId);
                            // This is expected if the seller exists in oc_vendor but not in oc_sellers
                        } else {
                            console.log('Other error occurred while fetching seller reels');
                        }
                        // We'll show 0 reels for this seller
                    }
                    summaries.push({ id: `s-${vendorId}`, seller_name: name, seller_id: vendorId, reel_count: count, views, likes, followers, status: s.status || 'approved' });
                }
                setReels(summaries);
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
    }, []);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReels = reels.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(reels.length / itemsPerPage);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [reels]);

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
        navigate(`/sellers/reels/view/${vendorId}`);
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
                            <h4 className="card-title mb-0 text-dark">Seller Reels</h4>
                        </div>
                        <button 
                            className="btn btn-success" 
                            onClick={() => navigate('/sellers/reels/add')}
                        >
                            <i className="ri-add-line me-1"></i> 
                            Add Reel
                        </button>
                    </div>
                    <div className="card-body">
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
                                            <th className="text-dark">Seller</th>
                                            <th className="text-dark">Reel Count</th>
                                            <th className="text-dark">Views</th>
                                            <th className="text-dark">Likes</th>
                                            <th className="text-dark">Followers</th>
                                            <th className="text-dark">Status</th>
                                            <th className="text-dark">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentReels.length === 0 ? (
                                            <tr>
                                                <td colSpan="7" className="text-center text-danger">
                                                    {error || 'No reels found'}
                                                </td>
                                            </tr>
                                        ) : currentReels.map((reel) => (
                                            <tr key={reel.id}>
                                                <td className="text-dark">{reel.seller_name || reel.seller_id || '-'}</td>
                                                <td>
                                                    <span className="badge bg-info">{Number(reel.reel_count ?? 0)}</span>
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
                                                <td className="text-nowrap">
                                                    <div className="btn-group btn-group-sm" role="group">
                                                        <button
                                                            className="btn btn-info"
                                                            onClick={() => handleViewDetails(reel)}
                                                            title="View Reels"
                                                        >
                                                            <i data-lucide="eye"></i>
                                                        </button>
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={() => handleDelete(reel.id)}
                                                            title="Delete Reel"
                                                        >
                                                            <i data-lucide="trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {totalPages > 1 && (
                                <div className="mt-4">
                                    {renderPagination()}
                                    <div className="text-center mt-2 text-muted">
                                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, reels.length)} of {reels.length} entries
                                    </div>
                                </div>
                            )}
                        </>
                    </div>
                </div>
            </div>
        </div>
    );
}