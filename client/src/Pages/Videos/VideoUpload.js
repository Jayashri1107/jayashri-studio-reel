import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function VideoUpload() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        type: 'seller',
        sellerId: '',
        brandId: '',
        productId: '',
        categoryId: '',
        description: '',
        videoFile: null
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 100 * 1024 * 1024) { // 100MB limit
                toast.error('File size must be less than 100MB');
                return;
            }
            setFormData({ ...formData, videoFile: file });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUploading(true);
        
        try {
            // TODO: Upload to Azure and save to database
            // const formDataToSend = new FormData();
            // Object.keys(formData).forEach(key => {
            //     if (formData[key]) formDataToSend.append(key, formData[key]);
            // });
            // await axios.post('/api/videos/upload', formDataToSend);
            
            toast.success('Video uploaded successfully');
            navigate('/videos');
        } catch (error) {
            toast.error('Failed to upload video');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Upload Video</h4>
                        </div>
                        <button 
                            className="btn btn-sm btn-light"
                            onClick={() => navigate('/videos')}
                        >
                            <i data-lucide="arrow-left" className="me-2"></i> Back
                        </button>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Video Title <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    />
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Video Type <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select"
                                        required
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                    >
                                        <option value="seller">Seller</option>
                                        <option value="brand">Brand</option>
                                    </select>
                                </div>

                                {formData.type === 'seller' && (
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Seller <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            required
                                            value={formData.sellerId}
                                            onChange={(e) => setFormData({...formData, sellerId: e.target.value})}
                                        >
                                            <option value="">Select Seller</option>
                                            <option value="1">Seller 1</option>
                                            <option value="2">Seller 2</option>
                                        </select>
                                    </div>
                                )}

                                {formData.type === 'brand' && (
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Brand <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select"
                                            required
                                            value={formData.brandId}
                                            onChange={(e) => setFormData({...formData, brandId: e.target.value})}
                                        >
                                            <option value="">Select Brand</option>
                                            <option value="1">Brand 1</option>
                                            <option value="2">Brand 2</option>
                                        </select>
                                    </div>
                                )}

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Product</label>
                                    <select
                                        className="form-select"
                                        value={formData.productId}
                                        onChange={(e) => setFormData({...formData, productId: e.target.value})}
                                    >
                                        <option value="">Select Product</option>
                                        <option value="1">Product 1</option>
                                        <option value="2">Product 2</option>
                                    </select>
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Category <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select"
                                        required
                                        value={formData.categoryId}
                                        onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                                    >
                                        <option value="">Select Category</option>
                                        <option value="1">Category 1</option>
                                        <option value="2">Category 2</option>
                                    </select>
                                </div>

                                <div className="col-12 mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    />
                                </div>

                                <div className="col-12 mb-3">
                                    <label className="form-label">Video File <span className="text-danger">*</span></label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept="video/*"
                                        required
                                        onChange={handleFileChange}
                                    />
                                    <small className="text-muted">Max file size: 100MB. Video will be uploaded to Azure storage.</small>
                                </div>

                                <div className="col-12">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary"
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Uploading...' : 'Upload Video'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

