import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';


export default function BrandsList() {
    const navigate = useNavigate();
    const [brands, setBrands] = useState([]);
    const [editingBrand, setEditingBrand] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        // TODO: Fetch brands from API
        setBrands([
            {
                id: 1,
                name: 'Brand ABC',
                email: 'contact@brandabc.com',
                video_count: 67,
                status: 'active'
            },
            {
                id: 2,
                name: 'Brand XYZ',
                email: 'contact@brandxyz.com',
                video_count: 89,
                status: 'active'
            }
        ]);
    }, []);

    const handleEdit = (brand) => {
        setEditingBrand({...brand});
        setShowModal(true);
    };

    const handleSave = async () => {
        const cleanedName = editingBrand.name;
        const trimmedEmail = editingBrand.email.trim();

        if (!trimmedEmail) {
            toast.error('Email is required');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
            toast.error('Invalid email format');
            return;
        }

        try {
            // TODO: Update brand via API
            // Use trimmed values
            // await api.put(`/brands/${editingBrand.id}`, { ...editingBrand, name: trimmedName, email: trimmedEmail });
            
            toast.success('Brand updated successfully');
            setShowModal(false);
            setEditingBrand(null);
        } catch (error) {
            toast.error('Failed to update brand');
        }
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Brands Management</h4>
                        </div>
                        <div>
                            <button 
                                className="btn btn-primary"
                                onClick={() => navigate('/brands/reels')}
                            >
                                <i data-lucide="film"></i> View Brand Reels
                            </button>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Video Count</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {brands.map((brand) => (
                                        <tr key={brand.id}>
                                            <td>{brand.name}</td>
                                            <td>{brand.email}</td>
                                            <td>
                                                <span className="badge bg-warning">{brand.video_count || brand.videoCount}</span>
                                            </td>
                                            <td>
                                                <span className={`badge ${brand.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                                                    {brand.status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-light"
                                                    onClick={() => handleEdit(brand)}
                                                >
                                                    <i data-lucide="edit"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showModal && editingBrand && (
                <div className="modal fade show" style={{display: 'block'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Brand</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingBrand(null);
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editingBrand.name}
                                        onChange={(e) => setEditingBrand({...editingBrand, name: e.target.value})}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={editingBrand.email}
                                        onChange={(e) => setEditingBrand({...editingBrand, email: e.target.value})}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Status</label>
                                    <select
                                        className="form-select"
                                        value={editingBrand.status}
                                        onChange={(e) => setEditingBrand({...editingBrand, status: e.target.value})}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingBrand(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}