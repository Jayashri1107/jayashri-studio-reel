import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../Config/axios';
import ApproveRejectButtons from '../../Components/ApproveRejectButtons';
import Pagination from '../../Components/Pagination';

export default function InfluencersList() {
    const navigate = useNavigate();
    const [influencers, setInfluencers] = useState([]);
    const [filteredInfluencers, setFilteredInfluencers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ name: '', status: '' });
    const [uiFilters, setUiFilters] = useState({ name: '', status: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [linksModal, setLinksModal] = useState({ open: false, links: [], name: '' });
    const [updatingId, setUpdatingId] = useState(null);
    const [updatingAction, setUpdatingAction] = useState(null); // 'approve' | 'reject' | null

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        fetchInfluencers();
    }, []);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [influencers]);

    // Apply filters
    useEffect(() => {
        let result = [...influencers];
        
        if (filters.name) {
            const filterText = filters.name.toLowerCase().trim();
            result = result.filter(influencer => 
                (influencer.firstname && influencer.firstname.toLowerCase().includes(filterText)) ||
                (influencer.lastname && influencer.lastname.toLowerCase().includes(filterText)) ||
                ((influencer.firstname + ' ' + influencer.lastname).toLowerCase().includes(filterText))
            );
        }
        
        if (filters.status) {
            const filterText = filters.status.toLowerCase().trim();
            result = result.filter(influencer => 
                influencer.status && influencer.status.toLowerCase().includes(filterText)
            );
        }
        
        setFilteredInfluencers(result);
        setCurrentPage(1); // Reset to first page when filters change
    }, [filters, influencers]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentInfluencers = filteredInfluencers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredInfluencers.length / itemsPerPage);

    const fetchInfluencers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/Studio/influencer/applications');
            
            if (response.data.success) {
                // Map database status values to frontend status values
                const mappedInfluencers = response.data.data.map(influencer => ({
                    ...influencer,
                    status: getStatusString(influencer.status)
                }));
                setInfluencers(mappedInfluencers);
                setFilteredInfluencers(mappedInfluencers);
            } else {
                toast.error(response.data.message || 'Failed to fetch influencers');
                // Fallback to mock data
                const mockData = getMockData();
                setInfluencers(mockData);
                setFilteredInfluencers(mockData);
            }
        } catch (error) {
            console.warn('Error fetching influencers:', error);
            // Fallback to mock data when endpoint is not available
            const mockData = getMockData();
            setInfluencers(mockData);
            setFilteredInfluencers(mockData);
        } finally {
            setLoading(false);
        }
    };

    // Convert database status integer to string
    const getStatusString = (status) => {
        switch (status) {
            case 1:
                return 'approved';
            case 2:
                return 'rejected';
            case 0:
            default:
                return 'pending';
        }
    };

    // Convert frontend status string to database integer
    const getStatusInteger = (status) => {
        switch (status) {
            case 'approved':
                return 1;
            case 'rejected':
                return 2;
            case 'pending':
            default:
                return 0;
        }
    };

    const getMockData = () => {
        return [
            {
                id: 1,
                firstname: 'John',
                lastname: 'Influencer',
                email: 'john@influencer.com',
                telephone: '123-456-7890',
                platform: 'Instagram',
                account_link: 'https://instagram.com/john_influencer',
                date_added: '2023-06-15 10:30:00',
                status: 'approved',
                approved_at: '2023-06-16 14:20:00',
                rejected_at: null
            },
            {
                id: 2,
                firstname: 'Jane',
                lastname: 'Creator',
                email: 'jane@creator.com',
                telephone: '098-765-4321',
                platform: 'YouTube',
                account_link: 'https://youtube.com/jane_creator',
                date_added: '2023-06-18 09:15:00',
                status: 'pending',
                approved_at: null,
                rejected_at: null
            },
            {
                id: 3,
                firstname: 'Mike',
                lastname: 'Content',
                email: 'mike@content.com',
                telephone: '555-123-4567',
                platform: 'TikTok',
                account_link: 'https://tiktok.com/@mike_content',
                date_added: '2023-06-10 16:45:00',
                status: 'rejected',
                approved_at: null,
                rejected_at: '2023-06-12 11:30:00'
            }
        ];
    };

    const handleEdit = (influencer) => {
        navigate(`/influencers/edit/${influencer.id}`);
    };

    const handleApprove = async (id) => {
        setUpdatingId(id);
        setUpdatingAction('approve');
        const nowIso = new Date().toISOString();
        const prev = { all: influencers, filtered: filteredInfluencers };
        const updater = (list) =>
            list.map((inf) =>
                String(inf.id) === String(id)
                    ? { ...inf, status: 'approved', approved_at: inf.approved_at || nowIso }
                    : inf
            );
        setInfluencers((list) => updater(list));
        setFilteredInfluencers((list) => updater(list));
        try {
            const response = await api.put(`/Studio/influencer/${id}/approve`);
            if (response.data?.success) {
                toast.success('Influencer approved successfully');
            } else {
                toast.error(response.data?.message || 'Failed to approve influencer');
                setInfluencers(prev.all);
                setFilteredInfluencers(prev.filtered);
            }
        } catch (error) {
            console.warn('Error approving influencer:', error);
            toast.warn('Approve functionality not available in current setup');
            setInfluencers(prev.all);
            setFilteredInfluencers(prev.filtered);
        } finally {
            setUpdatingId(null);
            setUpdatingAction(null);
        }
    };

    const handleReject = async (id) => {
        setUpdatingId(id);
        setUpdatingAction('reject');
        const nowIso = new Date().toISOString();
        const prev = { all: influencers, filtered: filteredInfluencers };
        const updater = (list) =>
            list.map((inf) =>
                String(inf.id) === String(id)
                    ? { ...inf, status: 'rejected', rejected_at: inf.rejected_at || nowIso }
                    : inf
            );
        setInfluencers((list) => updater(list));
        setFilteredInfluencers((list) => updater(list));
        try {
            const response = await api.put(`/Studio/influencer/${id}/reject`);
            if (response.data?.success) {
                toast.success('Influencer rejected successfully');
            } else {
                toast.error(response.data?.message || 'Failed to reject influencer');
                setInfluencers(prev.all);
                setFilteredInfluencers(prev.filtered);
            }
        } catch (error) {
            console.warn('Error rejecting influencer:', error);
            toast.warn('Reject functionality not available in current setup');
            setInfluencers(prev.all);
            setFilteredInfluencers(prev.filtered);
        } finally {
            setUpdatingId(null);
            setUpdatingAction(null);
        }
    };

    const handleFilterChange = (newFilters) => {
        setUiFilters(newFilters);
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


    const getStatusBadge = (status) => {
        switch (status) {
            case 'approved':
                return <span className="badge bg-success">Approved</span>;
            case 'pending':
                return <span className="badge bg-warning">Pending</span>;
            case 'rejected':
                return <span className="badge bg-danger">Rejected</span>;
            default:
                return <span className="badge bg-secondary">Unknown</span>;
        }
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Influencers Management</h4>
                        </div>
                    </div>
                    <div className="card-body">
                        {/* Filter Section */}
                        <div className="mb-4 p-3 bg-body-secondary rounded border">
                            <div className="row g-3 align-items-end">
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold mb-2">Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search by name..."
                                        value={uiFilters.name}
                                        onChange={(e) => handleFilterChange({ ...uiFilters, name: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <label className="form-label fw-semibold mb-2">Status</label>
                                    <select
                                        className="form-select"
                                        value={uiFilters.status}
                                        onChange={(e) => handleFilterChange({ ...uiFilters, status: e.target.value })}
                                    >
                                    <option value="">All Statuses</option>
                                    <option value="approved">Approved</option>
                                    <option value="pending">Pending</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div className="col-md-5 d-flex gap-2 align-items-end justify-content-end">
                                <button className="btn btn-primary" onClick={handleApplyFilters}>
                                    <i data-lucide="filter" className="me-1" style={{width: '16px', height: '16px'}}></i>
                                    Filter
                                </button>
                                <button className="btn btn-outline-secondary" onClick={clearFilters}>
                                    <i data-lucide="x" className="me-1" style={{width: '16px', height: '16px'}}></i>
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
                                                <th>ID</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Platform</th>
                                                <th>Their Link</th>
                                                <th>Applied At</th>
                                                <th>Status</th>
                                                <th>Approved At</th>
                                                <th>Rejected At</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentInfluencers.length > 0 ? (
                                                currentInfluencers.map((influencer) => (
                                                    <tr key={influencer.id}>
                                                        <td>{influencer.id}</td>
                                                        <td>{influencer.firstname} {influencer.lastname}</td>
                                                        <td>{influencer.email}</td>
                                                        <td>{influencer.platform}</td>
                                                        <td>
                                                            <button
                                                                className="btn btn-link p-0"
                                                                onClick={() => openLinksModal(influencer.account_link, `${influencer.firstname} ${influencer.lastname}`)}
                                                            >
                                                                View Profile
                                                            </button>
                                                        </td>
                                                        <td>{new Date(influencer.date_added).toLocaleDateString()}</td>
                                                        <td>{getStatusBadge(influencer.status)}</td>
                                                        <td>{influencer.approved_at ? new Date(influencer.approved_at).toLocaleDateString() : '-'}</td>
                                                        <td>{influencer.rejected_at ? new Date(influencer.rejected_at).toLocaleDateString() : '-'}</td>
                                                        <td>
                                                            <div className="d-flex gap-2">
                                                                <button
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={() => handleEdit(influencer)}
                                                                    title="Edit Influencer"
                                                                >
                                                                    <i data-lucide="edit" style={{width: '16px', height: '16px'}}></i>
                                                                </button>
                                                                <ApproveRejectButtons
                                                                    onApprove={() => handleApprove(influencer.id)}
                                                                    onReject={() => handleReject(influencer.id)}
                                                                    disabledApprove={
                                                                        influencer.status === 'approved' ||
                                                                        (updatingId === influencer.id && updatingAction === 'reject')
                                                                    }
                                                                    disabledReject={
                                                                        influencer.status === 'rejected' ||
                                                                        (updatingId === influencer.id && updatingAction === 'approve')
                                                                    }
                                                                    loadingApprove={updatingId === influencer.id && updatingAction === 'approve'}
                                                                    loadingReject={updatingId === influencer.id && updatingAction === 'reject'}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="10" className="text-center py-4">
                                                        No influencers found matching the current filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={filteredInfluencers.length}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={handlePageChange}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
            {linksModal.open && (
                <div className="modal-portal-overlay">
                    <div className="modal-portal modal-portal-sm">
                        <div className="modal-portal-header">
                            <h5 className="mb-0">{linksModal.name}</h5>
                            <button className="btn btn-sm btn-outline-secondary" onClick={closeLinksModal} aria-label="Close">
                                ×
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
        </div>
    );
}
