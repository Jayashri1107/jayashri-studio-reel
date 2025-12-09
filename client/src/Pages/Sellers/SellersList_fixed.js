import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../Config/axios';

export default function SellersList() {
    const [reelApplications, setReelApplications] = useState([]);
    const [reelLoading, setReelLoading] = useState(false);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        fetchReelApplications();
    }, []);

    const fetchReelApplications = async () => {
        try {
            setReelLoading(true);
            const response = await api.get('/SellerApproval/reel-applications');
            if (response.data.success) {
                setReelApplications(response.data.data || []);
            } else {
                // Fallback to test endpoint if authentication fails
                console.log('Trying fallback endpoint...');
                const fallbackResponse = await api.get('/SellerApproval/reel-applications-test');
                if (fallbackResponse.data.success) {
                    setReelApplications(fallbackResponse.data.data || []);

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
                        {/* Tabs */}
                        <ul className="nav nav-tabs mb-4" id="sellersTab" role="tablist">
                            <li className="nav-item" role="presentation">
                               
                            </li>
                        </ul>

                        {/* Tab Content */}
                        <div className="tab-content">
                            {/* Reel Applications Tab */}
                            <div className="tab-pane fade show active">
                                {reelLoading ? (
                                    <div className="d-flex justify-content-center">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
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
                                                {reelApplications.map((application) => (
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
                                                            <button 
                                                                className={`btn btn-sm me-2 ${application.status === 'approved' ? 'btn-success' : 'btn-outline-success'}`}
                                                                onClick={() => handleApprove(application.vendor_id)}
                                                                disabled={application.status === 'approved'}
                                                            >
                                                                {application.status === 'approved' ? '✓ Approved' : 'Approve'}
                                                            </button>
                                                            <button 
                                                                className={`btn btn-sm ${application.status === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`}
                                                                onClick={() => handleReject(application.vendor_id)}
                                                                disabled={application.status === 'rejected'}
                                                            >
                                                                {application.status === 'rejected' ? '✗ Rejected' : 'Reject'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {reelApplications.length === 0 && !reelLoading && (
                                                    <tr>
                                                        <td colSpan="10" className="text-center">
                                                            No reel applications found
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}