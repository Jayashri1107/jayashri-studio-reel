import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function StudioUpload() {
    const navigate = useNavigate();
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        category: '',
        video: null,
        thumbnail: null
    });
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Simulate loading categories
        setTimeout(() => {
            setCategories([
                { id: 1, name: 'Fashion' },
                { id: 2, name: 'Food' },
                { id: 3, name: 'Fitness' },
                { id: 4, name: 'Travel' },
                { id: 5, name: 'Technology' }
            ]);
        }, 300);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUploadData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
        if (file) {
            setUploadData(prev => ({
                ...prev,
                [fieldName]: file
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!uploadData.title || !uploadData.category || !uploadData.video) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        
        try {
            // Simulate upload process
            setTimeout(() => {
                toast.success('Reel uploaded successfully!');
                navigate('/studio/reels');
            }, 2000);
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Upload failed: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="page-title-box d-flex align-items-center justify-content-between">
                    <h4 className="page-title mb-0">Upload Reel</h4>
                </div>
            </div>

            <div className="col-12">
                <div className="card">
                    <div className="card-header">
                        <h5 className="card-title mb-0">Reel Details</h5>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-md-8">
                                    <div className="mb-3">
                                        <label htmlFor="title" className="form-label">
                                            Title <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="title"
                                            name="title"
                                            placeholder="Enter reel title"
                                            value={uploadData.title}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="description" className="form-label">
                                            Description
                                        </label>
                                        <textarea
                                            className="form-control"
                                            id="description"
                                            name="description"
                                            rows="4"
                                            placeholder="Enter reel description"
                                            value={uploadData.description}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        ></textarea>
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="category" className="form-label">
                                            Category <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            id="category"
                                            name="category"
                                            value={uploadData.category}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                            required
                                        >
                                            <option value="">Select a category</option>
                                            {categories.map(category => (
                                                <option key={category.id} value={category.id}>
                                                    {category.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Video <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept="video/*"
                                                onChange={(e) => handleFileChange(e, 'video')}
                                                disabled={loading}
                                                required
                                            />
                                        </div>
                                        <div className="form-text">
                                            MP4, MOV, AVI formats allowed. Max size: 100MB
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">
                                            Thumbnail
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept="image/*"
                                                onChange={(e) => handleFileChange(e, 'thumbnail')}
                                                disabled={loading}
                                            />
                                        </div>
                                        <div className="form-text">
                                            JPG, PNG formats allowed. Recommended size: 1280x720
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex gap-2">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => navigate('/studio/reels')}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-success"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri-upload-line me-1"></i> Upload Reel
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}