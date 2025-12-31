import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

export default function VideosList() {
    const [searchParams] = useSearchParams();
    const [videos, setVideos] = useState([]);
    const [filters, setFilters] = useState({
        status: searchParams.get('status') || 'all',
        type: searchParams.get('type') || 'all',
        search: ''
    });

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        // TODO: Fetch videos from API
        setVideos([
            {
                id: 1,
                title: 'Product Demo #123',
                type: 'seller',
                productBrand: 'Product ABC',
                status: 'approved',
                impressions: 12450,
                likes: 1234,
                views: 8901,
                uploadedBy: 'Seller 1',
                uploadedAt: '2024-01-15',
                thumbnail: '/assets/images/users/avatar-1.jpg'
            },
            {
                id: 2,
                title: 'Brand Campaign #456',
                type: 'brand',
                productBrand: 'Brand XYZ',
                status: 'pending',
                impressions: 0,
                likes: 0,
                views: 0,
                uploadedBy: 'Brand Manager',
                uploadedAt: '2024-01-14',
                thumbnail: '/assets/images/users/avatar-2.jpg'
            }
        ]);
    }, []);

    const getStatusBadge = (status) => {
        const badges = {
            approved: 'bg-success',
            pending: 'bg-warning',
            rejected: 'bg-danger'
        };
        return badges[status] || 'bg-secondary';
    };

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
                            <h4 className="card-title mb-0">Videos Management</h4>
                        </div>
                        <div>
                            <Link to="/videos/upload" className="btn btn-primary">
                                <i data-lucide="upload" className="me-2"></i> Upload Video
                            </Link>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row mb-3">
                            <div className="col-md-3">
                                <select 
                                    className="form-select"
                                    value={filters.status}
                                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div className="col-md-3">
                                <select 
                                    className="form-select"
                                    value={filters.type}
                                    onChange={(e) => setFilters({...filters, type: e.target.value})}
                                >
                                    <option value="all">All Types</option>
                                    <option value="seller">Seller</option>
                                    <option value="brand">Brand</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search videos..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Video</th>
                                        <th>Type</th>
                                        <th>Product/Brand</th>
                                        <th>Uploaded By</th>
                                        <th>Status</th>
                                        <th>Impressions</th>
                                        <th>Likes</th>
                                        <th>Views</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {videos.map((video) => (
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
                                                        <small className="text-muted">{video.uploadedAt}</small>
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
                                            <td>
                                                <span className={`badge ${getStatusBadge(video.status)}`}>
                                                    {video.status.charAt(0).toUpperCase() + video.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{video.impressions.toLocaleString()}</td>
                                            <td>{video.likes.toLocaleString()}</td>
                                            <td>{video.views.toLocaleString()}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Link to={`/videos/${video.id}`} className="btn btn-sm btn-light">
                                                        <i data-lucide="eye"></i>
                                                    </Link>
                                                    {video.status === 'pending' && (
                                                        <Link to={`/videos/approval/${video.id}`} className="btn btn-sm btn-warning">
                                                            <i data-lucide="check-square"></i>
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

