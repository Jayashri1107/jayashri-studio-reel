import React, { useState, useEffect } from 'react';
import api from '../../Config/axios';
import { toast } from 'react-toastify';
import ApproveRejectButtons from '../../Components/ApproveRejectButtons';

export default function SellerApprovals() {
    const [pendingReels, setPendingReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        fetchPendingReels();
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReels = pendingReels.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(pendingReels.length / itemsPerPage);

    const fetchPendingReels = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/studio/reels/approved-seller-reels');
            if (response.data.success) {
                setPendingReels(response.data.data || []);
            } else {
                toast.error('Failed to fetch pending reels');
            }
        } catch (error) {
            console.error('Error fetching pending reels:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch pending reels');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (reelId) => {
        try {
            setActionLoading({ ...actionLoading, [reelId]: true });
            const response = await api.post(`/api/studio/reels/seller-reels/${reelId}/approve`);
            if (response.data.success) {
                toast.success('Reel approved successfully');
                fetchPendingReels(); // Refresh list
            } else {
                toast.error(response.data.message || 'Failed to approve reel');
            }
        } catch (error) {
            console.error('Error approving reel:', error);
            toast.error(error.response?.data?.message || 'Failed to approve reel');
        } finally {
            setActionLoading({ ...actionLoading, [reelId]: false });
        }
    };

    const handleReject = async (reelId) => {
        if (!window.confirm('Are you sure you want to reject this reel?')) {
            return;
        }

        try {
            setActionLoading({ ...actionLoading, [reelId]: true });
            const response = await api.post(`/api/studio/reels/seller-reels/${reelId}/reject`);
            if (response.data.success) {
                toast.success('Reel rejected successfully');
                fetchPendingReels(); // Refresh list
            } else {
                toast.error(response.data.message || 'Failed to reject reel');
            }
        } catch (error) {
            console.error('Error rejecting reel:', error);
            toast.error(error.response?.data?.message || 'Failed to reject reel');
        } finally {
            setActionLoading({ ...actionLoading, [reelId]: false });
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

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-sm-flex align-items-center justify-content-between">
                        <h4 className="mb-sm-0 font-size-18">Seller Reel Approvals</h4>
                        <div className="page-title-right">
                            <ol className="breadcrumb m-0">
                                <li className="breadcrumb-item"><a href="/">Dashboard</a></li>
                                <li className="breadcrumb-item active">Seller Reel Approvals</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Approved Seller Reels</h4>
                        </div>
                        <div className="card-body">
                            {pendingReels.length === 0 ? (
                                <div className="text-center py-5">
                                    <i data-lucide="check-circle" className="text-success mb-3" style={{ fontSize: '48px' }}></i>
                                    <h5>No Approved Reels</h5>
                                    <p className="text-muted">No approved seller reels found.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Reel ID</th>
                                                    <th>Title</th>
                                                    <th>Seller Name</th>
                                                    <th>Seller Email</th>
                                                    <th>Date Added</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {currentReels.map((reel) => (
                                                    <tr key={reel.reel_id}>
                                                        <td>{reel.reel_id}</td>
                                                        <td>{reel.title}</td>
                                                        <td>{reel.seller_name}</td>
                                                        <td>{reel.seller_email}</td>
                                                        <td>{reel.date_added ? new Date(reel.date_added).toLocaleDateString() : 'N/A'}</td>
                                                        <td>
                                                            
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
                                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, pendingReels.length)} of {pendingReels.length} entries
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
