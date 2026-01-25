import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function VideoApproval() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        // TODO: Fetch video details from API
        setVideo({
            id: id || 1,
            title: 'Product Demo Video',
            type: 'seller',
            product_brand: 'Product ABC',
            status: 'pending',
            uploaded_by: 'Seller 1',
            uploaded_at: '2024-01-15',
            video_url: 'https://example.com/video.mp4',
            thumbnail: '/assets/images/users/avatar-1.jpg',
            description: 'This is a product demonstration video showing the features and benefits.'
        });
    }, [id]);

    const handleApproval = async (action) => {
        setLoading(true);
        try {
            // TODO: Call API to approve/reject video
            // await axios.post(`/api/videos/${id}/${action}`, { comment });
            
            toast.success(`Video ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
            navigate('/videos');
        } catch (error) {
            toast.error(`Failed to ${action} video`);
        } finally {
            setLoading(false);
        }
    };

    if (!video) {
        return <div>Loading...</div>;
    }

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Video Approval</h4>
                        </div>
                        <button 
                            className="btn btn-sm btn-light"
                            onClick={() => navigate('/videos')}
                        >
                            <i data-lucide="arrow-left" className="me-2"></i> Back
                        </button>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-8">
                                <div className="mb-4">
                                    <h5>{video.title}</h5>
                                    <p className="text-muted">{video.description}</p>
                                </div>

                                <div className="mb-4">
                                    <div className="ratio ratio-16x9">
                                        <video controls className="rounded">
                                            <source src={video.video_url || video.videoUrl} type="video/mp4" />
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                </div>

                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <p><strong>Type:</strong> <span className="badge bg-info">{video.type}</span></p>
                                        <p><strong>Product/Brand:</strong> {video.product_brand || video.productBrand}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>Uploaded By:</strong> {video.uploaded_by || video.uploadedBy}</p>
                                        <p><strong>Uploaded At:</strong> {video.uploaded_at || video.uploadedAt}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="col-md-4">
                                <div className="card border">
                                    <div className="card-body">
                                        <h5 className="mb-3">Approval Actions</h5>
                                        
                                        <div className="mb-3">
                                            <label className="form-label">Comments/Remarks</label>
                                            <textarea
                                                className="form-control"
                                                rows="4"
                                                placeholder="Add comments or remarks..."
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                            />
                                        </div>

                                        <div className="d-grid gap-2">
                                            <button
                                                className="btn btn-success"
                                                onClick={() => handleApproval('approve')}
                                                disabled={loading}
                                            >
                                                <i data-lucide="check-circle" className="me-2"></i>
                                                Approve Video
                                            </button>
                                            <button
                                                className="btn btn-danger"
                                                onClick={() => handleApproval('reject')}
                                                disabled={loading}
                                            >
                                                <i data-lucide="x-circle" className="me-2"></i>
                                                Reject Video
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

