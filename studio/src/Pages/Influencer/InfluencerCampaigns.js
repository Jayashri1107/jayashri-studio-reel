import React, { useState, useEffect } from 'react';

export default function InfluencerCampaigns() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Simulate loading campaigns
        setTimeout(() => {
            setCampaigns([
                {
                    id: 1,
                    name: 'Summer Fashion Campaign',
                    brand: 'Fashion Forward',
                    status: 'active',
                    startDate: '2023-06-01',
                    endDate: '2023-08-31',
                    budget: 5000
                },
                {
                    id: 2,
                    name: 'Tech Gadget Review',
                    brand: 'Tech Innovations',
                    status: 'pending',
                    startDate: '2023-07-01',
                    endDate: '2023-09-30',
                    budget: 3000
                },
                {
                    id: 3,
                    name: 'Beauty Product Launch',
                    brand: 'Beauty Essentials',
                    status: 'completed',
                    startDate: '2023-05-01',
                    endDate: '2023-06-30',
                    budget: 2500
                }
            ]);
            setLoading(false);
        }, 500);
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'active':
                return <span className="badge bg-success">Active</span>;
            case 'pending':
                return <span className="badge bg-warning">Pending</span>;
            case 'completed':
                return <span className="badge bg-secondary">Completed</span>;
            default:
                return <span className="badge bg-secondary">Unknown</span>;
        }
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box d-flex align-items-center justify-content-between">
                    <h4 className="page-title mb-0">My Campaigns</h4>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <h5 className="card-title mb-0">Campaign Management</h5>
                        <button className="btn btn-success">
                            <i className="ri-add-line me-1"></i> Apply for Campaign
                        </button>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : campaigns.length === 0 ? (
                            <div className="text-center py-5">
                                <h5>No campaigns found</h5>
                                <p className="text-muted">Apply for campaigns to collaborate with brands.</p>
                                <button className="btn btn-success">
                                    <i className="ri-add-line me-1"></i> Apply for Campaign
                                </button>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th>Campaign</th>
                                            <th>Brand</th>
                                            <th>Status</th>
                                            <th>Start Date</th>
                                            <th>End Date</th>
                                            <th>Budget</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaigns.map((campaign) => (
                                            <tr key={campaign.id}>
                                                <td>{campaign.name}</td>
                                                <td>{campaign.brand}</td>
                                                <td>{getStatusBadge(campaign.status)}</td>
                                                <td>{campaign.startDate}</td>
                                                <td>{campaign.endDate}</td>
                                                <td>${campaign.budget}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-soft-info me-1">
                                                        <i className="ri-eye-line"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-soft-warning">
                                                        <i className="ri-edit-line"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}