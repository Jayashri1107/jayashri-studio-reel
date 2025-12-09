import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../Config/axios';
import ApproveRejectButtons from '../../Components/ApproveRejectButtons';
import AutocompleteInput from '../../Components/AutocompleteInput';

export default function SellersList() {
    const [reelApplications, setReelApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [reelLoading, setReelLoading] = useState(false);
    const [uiFilters, setUiFilters] = useState({ name: '', status: '' });
    const [filters, setFilters] = useState({ name: '', status: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        fetchReelApplications();
    }, []);

    // Apply filters
    useEffect(() => {
        let result = [...reelApplications];
        if (filters.name) {
            const filterText = filters.name.toLowerCase().trim();
            result = result.filter(application => 
                (application.firstname && application.firstname.toLowerCase().includes(filterText)) ||
                (application.lastname && application.lastname.toLowerCase().includes(filterText)) ||
                ((application.firstname + ' ' + application.lastname).toLowerCase().includes(filterText))
            );
        }
        if (filters.status) {
            const filterText = filters.status.toLowerCase().trim();
            result = result.filter(application => 
                application.status && application.status.toLowerCase().includes(filterText)
            );
        }
        setFilteredApplications(result);
        setCurrentPage(1);
    }, [filters, reelApplications]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentApplications = filteredApplications.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

    const fetchReelApplications = async () => {
        try {
            setReelLoading(true);
            const response = await api.get('/SellerApproval/reel-applications');
            if (response.data.success) {
                setReelApplications(response.data.data || []);
                setFilteredApplications(response.data.data || []);
            } else {
                // Fallback to test endpoint if authentication fails
                console.log('Trying fallback endpoint...');
                const fallbackResponse = await api.get('/SellerApproval/reel-applications-test');
                if (fallbackResponse.data.success) {
                    setReelApplications(fallbackResponse.data.data || []);
                    setFilteredApplications(fallbackResponse.data.data || []);

                } else {
                    toast.error('Failed to fetch reel applications');
                }
            }
        } catch (error) {
            console.error('Error fetching reel applications:', error);
            // Fallback to test endpoint if authentication fails
            try {
                console.log('Trying fallback endpoint due to error...');
                const fallbackResponse = await api.get('/SellerApproval/reel-applications-test');
                if (fallbackResponse.data.success) {
                    setReelApplications(fallbackResponse.data.data || []);
                    setFilteredApplications(fallbackResponse.data.data || []);

                } else {
                    toast.error('Failed to fetch reel applications');
                }
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                toast.error('Failed to fetch reel applications');
            }
        } finally {
            setReelLoading(false);
        }
    };

    const handleApprove = async (vendorId) => {
        try {
            const response = await api.post('/SellerApproval/approve', { vendorId });
            if (response.data.success) {
                toast.success('Seller approved successfully');
                // Refresh the list
                fetchReelApplications();
            } else {
                toast.error(response.data.message || 'Failed to approve seller');
            }
        } catch (error) {
            console.error('Error approving seller:', error);
            toast.error('Failed to approve seller');
        }
    };

    const handleReject = async (vendorId) => {
        try {
            const response = await api.post('/SellerApproval/reject', { vendorId });
            if (response.data.success) {
                toast.success('Seller rejected successfully');
                // Refresh the list
                fetchReelApplications();
            } else {
                toast.error(response.data.message || 'Failed to reject seller');
            }
        } catch (error) {
            console.error('Error rejecting seller:', error);
            toast.error('Failed to reject seller');
        }
    };

    const handleApplyFilters = () => {
        setFilters(uiFilters);
    };

    const clearFilters = () => {
        setUiFilters({ name: '', status: '' });
        setFilters({ name: '', status: '' });
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
            <nav aria-label="Sellers pagination">
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

    const getStatusBadgeClass = (status) => {
        switch(status.toLowerCase()) {
            case 'approved':
                return 'bg-success';
            case 'rejected':
                return 'bg-danger';
            case 'pending':
                return 'bg-warning';
            default:
                return 'bg-secondary';
        }
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Reel Applications</h4>
                        </div>
                    </div>
                    <div className="card-body">
                        <form className="mb-3 p-3 border rounded">
                            <div className="row g-3 align-items-end">
                                <div className="col-md-3">
                                    <label className="form-label fw-normal">Name</label>
                                    <input
                                        type="text"
                                        className="form-control bg-body text-body"
                                        placeholder="Filter by name"
                                        value={uiFilters.name}
                                        onChange={(e) => setUiFilters({ ...uiFilters, name: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-normal">Status</label>
                                    <select
                                        className="form-select bg-body text-body"
                                        value={uiFilters.status}
                                        onChange={(e) => setUiFilters({ ...uiFilters, status: e.target.value })}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="approved">Approved</option>
                                        <option value="pending">Pending</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div className="col-md-2 ms-auto d-flex gap-2 justify-content-end">
                                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={clearFilters}>
                                        Clear
                                    </button>
                                    <button type="button" className="btn btn-success btn-sm" onClick={handleApplyFilters}>
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div>
                                {reelLoading ? (
                                    <div className="d-flex justify-content-center">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="table-responsive">
                                            <table className="table table-hover align-middle mb-0">
                                                <thead>
                                                    <tr>
                                                        <th>Application ID</th>
                                                        <th>Vendor ID</th>
                                                        <th>Name</th>
                                                        <th>Email</th>
                                                        <th>Mobile</th>
                                                        <th>Applied At</th>
                                                        <th>Status</th>
                                                        <th>Approved At</th>
                                                        <th>Rejected At</th>
                                                        <th>Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentApplications.length > 0 ? (
                                                        currentApplications.map((application) => (
                                                            <tr key={application.application_id}>
                                                                <td>{application.application_id}</td>
                                                                <td>{application.vendor_id}</td>
                                                                <td>{application.firstname} {application.lastname}</td>
                                                                <td>{application.email}</td>
                                                                <td>{application.mobile || 'N/A'}</td>
                                                                <td>{new Date(application.applied_at).toLocaleDateString()}</td>
                                                                <td>
                                                                    <span className={`badge ${getStatusBadgeClass(application.status)}`}>
                                                                        {application.status}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {application.approved_at ? new Date(application.approved_at).toLocaleDateString() : 'N/A'}
                                                                </td>
                                                                <td>
                                                                    {application.rejected_at ? new Date(application.rejected_at).toLocaleDateString() : 'N/A'}
                                                                </td>
                                                                <td>
                                                                    <ApproveRejectButtons
                                                                        onApprove={() => handleApprove(application.vendor_id)}
                                                                        onReject={() => handleReject(application.vendor_id)}
                                                                        disabledApprove={application.status === 'approved'}
                                                                        disabledReject={application.status === 'rejected'}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="10" className="text-center">
                                                                No reel applications found matching the current filters
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        {totalPages > 1 && (
                                            <div className="mt-4">
                                                {renderPagination()}
                                                <div className="text-center mt-2 text-muted">
                                                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredApplications.length)} of {filteredApplications.length} entries
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
