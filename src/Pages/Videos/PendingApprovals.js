import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function PendingApprovals() {
    const [pendingVideos, setPendingVideos] = useState([]);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        // TODO: Fetch pending videos from API
        setPendingVideos([
            {
                id: 1,
                title: 'Product Demo #123',
                type: 'seller',
                productBrand: 'Product ABC',
                uploadedBy: 'Seller 1',
                uploadedAt: '2024-01-15',
                thumbnail: '/assets/images/users/avatar-1.jpg'
            },
            {
                id: 2,
                title: 'Brand Campaign #456',
                type: 'brand',
                productBrand: 'Brand XYZ',
                uploadedBy: 'Brand Manager',
                uploadedAt: '2024-01-14',
                thumbnail: '/assets/images/users/avatar-2.jpg'
            }
        ]);
    }, []);

    const getTypeBadge = (type) => {
        const badges = {
            seller: 'bg-info',
            brand: 'bg-warning'
        };
        return badges[type] || 'bg-secondary';
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Pending Video Approvals</h4>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Video</th>
                                        <th>Type</th>
                                        <th>Product/Brand</th>
                                        <th>Uploaded By</th>
                                        <th>Uploaded At</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingVideos.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center">
                                                <p className="text-muted mb-0">No pending approvals</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingVideos.map((video) => (
                                            <tr key={video.id}>
                                                <td>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar-sm me-2">
                                                            <img 
                                                                src={video.thumbnail} 
                                                                alt={video.title}
                                                                className="avatar-sm rounded"
                                                            />
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-0">{video.title}</h6>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge ${getTypeBadge(video.type)}`}>
                                                        {video.type.charAt(0).toUpperCase() + video.type.slice(1)}
                                                    </span>
                                                </td>
                                                <td>{video.productBrand}</td>
                                                <td>{video.uploadedBy}</td>
                                                <td>{video.uploadedAt}</td>
                                                <td>
                                                    <Link 
                                                        to={`/videos/approval/${video.id}`} 
                                                        className="btn btn-sm btn-warning"
                                                    >
                                                        <i data-lucide="check-square" className="me-1"></i> Review
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

