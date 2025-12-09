import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function SellerFollowers() {
    const navigate = useNavigate();
    const [followers, setFollowers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadFollowers();
    }, []);

    const loadFollowers = async () => {
        try {
            setLoading(true);
            
            // In a real implementation, this would fetch actual followers data
            // For now, we'll simulate with dummy data
            setTimeout(() => {
                const dummyFollowers = [
                    { id: 1, name: 'Alex Johnson', username: '@alexj', followers: 12500, following: 560, posts: 42, joined: '2023-05-15' },
                    { id: 2, name: 'Sarah Williams', username: '@sarahw', followers: 8900, following: 340, posts: 28, joined: '2023-06-22' },
                    { id: 3, name: 'Mike Chen', username: '@mikec', followers: 15600, following: 780, posts: 65, joined: '2023-04-10' },
                    { id: 4, name: 'Emma Davis', username: '@emmad', followers: 7200, following: 210, posts: 19, joined: '2023-07-30' },
                    { id: 5, name: 'James Wilson', username: '@jamesw', followers: 22400, following: 1200, posts: 87, joined: '2023-03-18' },
                    { id: 6, name: 'Lisa Anderson', username: '@lisaanderson', followers: 5600, following: 420, posts: 31, joined: '2023-08-05' },
                    { id: 7, name: 'Robert Taylor', username: '@rob_taylor', followers: 9800, following: 650, posts: 52, joined: '2023-02-28' },
                    { id: 8, name: 'Jennifer Lee', username: '@jenlee', followers: 14200, following: 890, posts: 76, joined: '2023-01-12' }
                ];
                setFollowers(dummyFollowers);
                setLoading(false);
            }, 1000);
            
            // TODO: Implement actual API call to fetch followers
            /*
            const response = await ApiService.getSellerFollowers();
            if (response.success) {
                setFollowers(response.data);
            } else {
                toast.error('Failed to load followers: ' + response.message);
            }
            */
        } catch (error) {
            console.error('Error loading followers:', error);
            toast.error('Failed to load followers: ' + error.message);
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate('/studio/seller/profile');
    };

    if (loading) {
        return (
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box d-flex align-items-center justify-content-between py-3">
                            <h4 className="mb-0">Followers</h4>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body text-center">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-2">Loading your followers...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-flex align-items-center justify-content-between py-3">
                        <h4 className="mb-0">Followers ({followers.length})</h4>
                        <button className="btn btn-secondary" onClick={handleBack}>
                            <i className="mdi mdi-arrow-left me-1"></i>Back to Profile
                        </button>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Your Followers</h5>
                        </div>
                        <div className="card-body">
                            {followers.length === 0 ? (
                                <div className="text-center py-5">
                                    <i className="ri-group-line ri-3x text-muted mb-3"></i>
                                    <h5>No followers yet</h5>
                                    <p className="text-muted">Your followers will appear here</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-centered table-nowrap mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>User</th>
                                                <th>Username</th>
                                                <th>Followers</th>
                                                <th>Following</th>
                                                <th>Posts</th>
                                                <th>Joined Date</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {followers.map((follower) => (
                                                <tr key={follower.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-shrink-0 me-3">
                                                                <div className="avatar-xs rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center">
                                                                    <i className="ri-user-line"></i>
                                                                </div>
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <h6 className="mb-0">{follower.name}</h6>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{follower.username}</td>
                                                    <td>{follower.followers.toLocaleString()}</td>
                                                    <td>{follower.following.toLocaleString()}</td>
                                                    <td>{follower.posts}</td>
                                                    <td>{new Date(follower.joined).toLocaleDateString()}</td>
                                                    <td>
                                                        <button className="btn btn-sm btn-outline-primary">
                                                            <i className="ri-chat-1-line me-1"></i>Message
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
        </div>
    );
}