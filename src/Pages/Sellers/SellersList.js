import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../Config/axios';
import ApproveRejectButtons from '../../Components/ApproveRejectButtons';
import AutocompleteInput from '../../Components/AutocompleteInput';
import Pagination from '../../Components/Pagination';

export default function SellersList() {
    const [reelApplications, setReelApplications] = useState([]);
    const [filteredApplications, setFilteredApplications] = useState([]);
    const [reelLoading, setReelLoading] = useState(false);
    const [uiFilters, setUiFilters] = useState({ name: '', status: '' });
    const [filters, setFilters] = useState({ name: '', status: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [updatingId, setUpdatingId] = useState(null);
    const [updatingAction, setUpdatingAction] = useState(null); // 'approve' | 'reject' | null

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
            const response = await api.get('/sellerapproval/reel-applications');
            if (response.data && response.data.success) {
                setReelApplications(response.data.data || []);
                setFilteredApplications(response.data.data || []);
            } else {
                // If response doesn't have success flag, check if data exists
                if (response.data && Array.isArray(response.data)) {
                    setReelApplications(response.data);
                    setFilteredApplications(response.data);
                } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    setReelApplications(response.data.data);
                    setFilteredApplications(response.data.data);
                } else {
                    console.warn('Unexpected response format:', response.data);
                    setReelApplications([]);
                    setFilteredApplications([]);
                }
            }
        } catch (error) {
            console.error('Error fetching reel applications:', error);
            const status = error.response?.status;
            const errorMessage = error.response?.data?.message || error.message;
            
            // Handle 401 Unauthorized - redirect to login
            if (status === 401) {
                console.warn('Unauthorized access. Please login again.');
                // Don't show toast for 401, let the axios interceptor handle it
                setReelApplications([]);
                setFilteredApplications([]);
                return;
            }
            
            // Handle 500 errors - show user-friendly message
            if (status === 500) {
                toast.error('Server error. Please try again later or contact support.');
                setReelApplications([]);
                setFilteredApplications([]);
                return;
            }
            
            // For other errors, show generic message
            if (status !== 401) {
                toast.error(errorMessage || 'Failed to fetch reel applications. Please check your connection.');
            }
            setReelApplications([]);
            setFilteredApplications([]);
        } finally {
            setReelLoading(false);
        }
    };

    const handleApprove = async (vendorId) => {
        setUpdatingId(vendorId);
        setUpdatingAction('approve');
        const nowIso = new Date().toISOString();
        const prev = { apps: reelApplications, filtered: filteredApplications };
        const updater = (list) =>
            list.map((a) =>
                String(a.vendor_id) === String(vendorId)
                    ? { ...a, status: 'approved', approved_at: a.approved_at || nowIso }
                    : a
            );
        setReelApplications((list) => updater(list));
        setFilteredApplications((list) => updater(list));
        try {
            const response = await api.post('/sellerapproval/approve', { vendorId });
            if (response.data?.success) {
                toast.success('Seller approved successfully');
            } else {
                toast.error(response.data?.message || 'Failed to approve seller');
                setReelApplications(prev.apps);
                setFilteredApplications(prev.filtered);
            }
        } catch (error) {
            console.error('Error approving seller:', error);
            toast.error('Failed to approve seller');
            setReelApplications(prev.apps);
            setFilteredApplications(prev.filtered);
        } finally {
            setUpdatingId(null);
            setUpdatingAction(null);
        }
    };

    const handleReject = async (vendorId) => {
        setUpdatingId(vendorId);
        setUpdatingAction('reject');
        const nowIso = new Date().toISOString();
        const prev = { apps: reelApplications, filtered: filteredApplications };
        const updater = (list) =>
            list.map((a) =>
                String(a.vendor_id) === String(vendorId)
                    ? { ...a, status: 'rejected', rejected_at: a.rejected_at || nowIso }
                    : a
            );
        setReelApplications((list) => updater(list));
        setFilteredApplications((list) => updater(list));
        try {
            const response = await api.post('/sellerapproval/reject', { vendorId });
            if (response.data?.success) {
                toast.success('Seller rejected successfully');
            } else {
                toast.error(response.data?.message || 'Failed to reject seller');
                setReelApplications(prev.apps);
                setFilteredApplications(prev.filtered);
            }
        } catch (error) {
            console.error('Error rejecting seller:', error);
            toast.error('Failed to reject seller');
            setReelApplications(prev.apps);
            setFilteredApplications(prev.filtered);
        } finally {
            setUpdatingId(null);
            setUpdatingAction(null);
        }
    };

    // Removed approvedClicked tracking to keep buttons visible consistently

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
                        <div className="mb-4 p-3 bg-body-secondary rounded border">
                            <div className="row g-3 align-items-end">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold mb-2">Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Filter by name"
                                        value={uiFilters.name}
                                        onChange={(e) => setUiFilters({ ...uiFilters, name: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold mb-2">Status</label>
                                    <select
                                        className="form-select"
                                        value={uiFilters.status}
                                        onChange={(e) => setUiFilters({ ...uiFilters, status: e.target.value })}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="approved">Approved</option>
                                        <option value="pending">Pending</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                                <div className="col-md-5 d-flex gap-2 align-items-end justify-content-end">
                                    <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
                                        <i data-lucide="x" className="me-1" style={{width: '16px', height: '16px'}}></i>
                                        Clear
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={handleApplyFilters}>
                                        <i data-lucide="filter" className="me-1" style={{width: '16px', height: '16px'}}></i>
                                        Filter
                                    </button>
                                </div>
                            </div>
                        </div>

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
                                            <table className="table table-hover align-middle mb-0 text-nowrap">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Application ID</th>
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
                                                                        disabledApprove={
                                                                            application.status === 'approved' ||
                                                                            (updatingId === application.vendor_id && updatingAction === 'reject')
                                                                        }
                                                                        disabledReject={
                                                                            application.status === 'rejected' ||
                                                                            (updatingId === application.vendor_id && updatingAction === 'approve')
                                                                        }
                                                                        loadingApprove={updatingId === application.vendor_id && updatingAction === 'approve'}
                                                                        loadingReject={updatingId === application.vendor_id && updatingAction === 'reject'}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="9" className="text-center">
                                                                No reel applications found matching the current filters
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            totalItems={filteredApplications.length}
                                            itemsPerPage={itemsPerPage}
                                            onPageChange={handlePageChange}
                                        />
                                    </>
                                )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
