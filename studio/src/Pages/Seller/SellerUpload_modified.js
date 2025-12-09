import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function SellerUpload() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get the reel ID from the route parameter
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        category: '',
        video: null,
        thumbnail: null,
        video_url: '', // Store the video URL for display when editing
        thumbnail_url: '', // Store the thumbnail URL for display when editing
        associationType: '', // 'product' or 'brand'
        selectedBrand: '',
        selectedProduct: '' // Changed from array to single value
    });
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [sellerProducts, setSellerProducts] = useState([]);
    const [brandProducts, setBrandProducts] = useState([]);
    const [reels, setReels] = useState([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [editingReelId, setEditingReelId] = useState(null);
    const [viewingReel, setViewingReel] = useState(null); // For viewing reel details

    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Initialize Remix Icons if available
        if (window.RemixIcon) {
            window.RemixIcon.init();
        }
        
        // Load initial data
        loadCategories();
        loadReels();
        loadBrands(); // Load brands for the brand selection
        
        // Handle route changes
        if (id) {
            // We're editing a reel
            setEditingReelId(id);
            setShowUploadForm(true);
            loadReelForEdit(id);
        } else {
            // We're on the upload page (not editing) - show list by default
            setEditingReelId(null);
            setViewingReel(null);
            setShowUploadForm(false);
            // Reset form data only if we were previously editing
            if (editingReelId) {
                resetForm();
            }
        }
    }, [id]);
    
    // Re-initialize icons when reels data changes
    useEffect(() => {
        const timer = setTimeout(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
            if (window.RemixIcon) {
                window.RemixIcon.init();
            }
        }, 100);
        
        return () => clearTimeout(timer);
    }, [reels, showUploadForm]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getCategories();
            if (response.success) {
                setCategories(response.data);
            } else {
                toast.error('Failed to load categories: ' + response.message);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading categories:', error);
            toast.error('Failed to load categories: ' + error.message);
            setLoading(false);
        }
    };

    const loadReels = async () => {
        try {
            setLoading(true);
            // For sellers, we need to pass the vendor ID
            // In a real implementation, you would get this from the authenticated user
            const vendorId = 1; // This should come from the authenticated user
            const response = await ApiService.getSellerReels(vendorId);
            if (response.success) {
                setReels(response.data);
            } else {
                // Don't show error for reels loading, it's not critical
                console.log('Failed to load reels: ' + response.message);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading reels:', error);
            // Don't show error for reels loading, it's not critical
            setLoading(false);
        }
    };

    const loadBrands = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getBrands();
            if (response.success) {
                setBrands(response.data);
            } else {
                toast.error('Failed to load brands: ' + response.message);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading brands:', error);
            toast.error('Failed to load brands: ' + error.message);
            setLoading(false);
        }
    };

    const loadSellerProducts = async () => {
        // For sellers, we would load their own products
        // In a real implementation, this would fetch from a specific endpoint
        // For now, we'll use the same seller products endpoint with a default vendor ID
        // In a real app, you would get the vendor ID from the authenticated user
        try {
            setLoading(true);
            // We need to get the actual vendor ID for the logged-in seller
            // For now, we'll use vendor ID 1 as a placeholder
            // In a real implementation, you would get this from the user's session
            const vendorId = 1; // This should come from the authenticated user
            const response = await ApiService.getSellerProducts(vendorId);
            console.log('Seller products response:', response); // Debug log
            if (response.success) {
                setSellerProducts(response.data);
            } else {
                toast.error('Failed to load products: ' + response.message);
                setSellerProducts([]); // Clear products on error
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Failed to load products: ' + error.message);
            setSellerProducts([]); // Clear products on error
            setLoading(false);
        }
    };

    const loadBrandProducts = async (brandId) => {
        try {
            setLoading(true);
            const response = await ApiService.getBrandProducts(brandId);
            console.log('Brand products response:', response); // Debug log
            if (response.success) {
                setBrandProducts(response.data);
            } else {
                toast.error('Failed to load brand products: ' + response.message);
                setBrandProducts([]); // Clear products on error
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading brand products:', error);
            toast.error('Failed to load brand products: ' + error.message);
            setBrandProducts([]); // Clear products on error
            setLoading(false);
        }
    };

    // Function for fetching reel data for editing
    const loadReelForEdit = async (reelId) => {
        try {
            setLoading(true);
            const response = await ApiService.getReelById(reelId);
            
            if (response.success) {
                const reelData = response.data;
                
                // Set the form data with the reel information
                setUploadData({
                    title: reelData.title || '',
                    description: reelData.description || '',
                    category: reelData.category_id || '',
                    video: null, // We don't need to preload the video file
                    thumbnail: null, // We don't need to preload the thumbnail
                    video_url: reelData.video_url || '', // Store the video URL for display
                    thumbnail_url: reelData.thumbnail || '', // Store the thumbnail URL for display
                    associationType: reelData.brand_id ? 'brand' : 'product', // For sellers, it's either brand or product
                    selectedBrand: reelData.brand_id || '',
                    selectedProduct: reelData.product_ids && reelData.product_ids.length > 0 ? reelData.product_ids[0] : ''
                });
                
                console.log('Reel loaded for edit:', reelData);
                
                // Load related data based on association type
                if (reelData.brand_id) {
                    // Load brand products
                    await loadBrandProducts(reelData.brand_id);
                } else {
                    // Load seller products
                    await loadSellerProducts();
                }
            } else {
                toast.error('Failed to load reel: ' + response.message);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading reel for edit:', error);
            toast.error('Failed to load reel: ' + error.message);
            setLoading(false);
        }
    };

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

    const handleAssociationTypeChange = (type) => {
        setUploadData(prev => ({
            ...prev,
            associationType: type,
            selectedBrand: '',
            selectedProduct: '' // Reset product selection
        }));
        
        // Clear products when changing association type
        setBrandProducts([]);
        
        // Load seller products if product type is selected
        if (type === 'product') {
            loadSellerProducts();
        }
    };

    const handleBrandChange = (brandId) => {
        setUploadData(prev => ({
            ...prev,
            selectedBrand: brandId,
            selectedProduct: '' // Reset product selection
        }));
        
        // Clear brand products when selecting a brand
        setBrandProducts([]);
        
        // Load brand products
        if (brandId) {
            loadBrandProducts(brandId);
        } else {
            setBrandProducts([]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!uploadData.title || !uploadData.category || 
            !uploadData.associationType || 
            (uploadData.associationType === 'brand' && !uploadData.selectedBrand) ||
            !uploadData.selectedProduct) {
            toast.error('Please fill in all required fields');
            return;
        }

        // Check if we have a video file when creating a new reel
        if (!editingReelId && !uploadData.video) {
            toast.error('Please select a video file');
            return;
        }

        setLoading(true);
        
        try {
            if (editingReelId) {
                // Edit existing reel
                if (uploadData.video || uploadData.thumbnail) {
                    // Files selected, use FormData
                    const formData = new FormData();
                    formData.append('title', uploadData.title || '');
                    formData.append('description', uploadData.description || '');
                    formData.append('category', uploadData.category || '');
                    formData.append('associationType', uploadData.associationType === 'product' ? 'seller' : 'brand');
                    
                    if (uploadData.associationType === 'product') {
                        // Use vendor ID 1 as placeholder - in real implementation, get from authenticated user
                        formData.append('selectedSeller', '1');
                    } else if (uploadData.associationType === 'brand' && uploadData.selectedBrand) {
                        formData.append('selectedBrand', uploadData.selectedBrand || '');
                    }
                    
                    // Send selected product as array for consistency with backend
                    if (uploadData.selectedProduct) {
                        formData.append('selectedProducts', JSON.stringify([parseInt(uploadData.selectedProduct)]));
                    }
                    
                    if (uploadData.video) {
                        formData.append('video', uploadData.video);
                    }
                    
                    if (uploadData.thumbnail) {
                        formData.append('thumbnail', uploadData.thumbnail);
                    }
                    
                    const response = await ApiService.editReelWithFiles(editingReelId, formData);
                    
                    if (response.success) {
                        toast.success('Reel updated successfully!');
                        // Refresh the reels list
                        await loadReels();
                        // Reset form and navigate back to list
                        setShowUploadForm(false);
                        resetForm();
                        navigate('/studio/seller/upload');
                    } else {
                        toast.error('Update failed: ' + response.message);
                    }
                } else {
                    // No files selected, use regular JSON data
                    const reelData = {
                        title: uploadData.title,
                        description: uploadData.description,
                        category: uploadData.category,
                        associationType: uploadData.associationType === 'product' ? 'seller' : 'brand',
                        selectedSeller: uploadData.associationType === 'product' ? '1' : '',
                        selectedBrand: uploadData.selectedBrand,
                        selectedProducts: uploadData.selectedProduct ? [parseInt(uploadData.selectedProduct)] : []
                    };
                    
                    const response = await ApiService.editReel(editingReelId, reelData);
                    
                    if (response.success) {
                        toast.success('Reel updated successfully!');
                        // Refresh the reels list
                        await loadReels();
                        // Reset form and navigate back to list
                        setShowUploadForm(false);
                        resetForm();
                        navigate('/studio/seller/upload');
                    } else {
                        toast.error('Update failed: ' + response.message);
                    }
                }
            } else {
                // Upload new reel
                // Prepare form data for upload
                const formData = new FormData();
                formData.append('title', uploadData.title || '');
                formData.append('description', uploadData.description || '');
                formData.append('category', uploadData.category || '');
                formData.append('associationType', uploadData.associationType === 'product' ? 'seller' : 'brand');
                // For sellers, we need to specify selectedSeller as their own vendor ID
                if (uploadData.associationType === 'product') {
                    // Use vendor ID 1 as placeholder - in real implementation, get from authenticated user
                    formData.append('selectedSeller', '1');
                } else if (uploadData.associationType === 'brand' && uploadData.selectedBrand) {
                    formData.append('selectedBrand', uploadData.selectedBrand || '');
                }
                // Send selected product as array for consistency with backend
                if (uploadData.selectedProduct) {
                    formData.append('selectedProducts', JSON.stringify([parseInt(uploadData.selectedProduct)]));
                }
                
                if (uploadData.video) {
                    formData.append('video', uploadData.video);
                }
                
                if (uploadData.thumbnail) {
                    formData.append('thumbnail', uploadData.thumbnail);
                }
                
                console.log('Sending form data:', {
                    title: uploadData.title,
                    category: uploadData.category,
                    associationType: uploadData.associationType,
                    selectedBrand: uploadData.selectedBrand,
                    selectedProduct: uploadData.selectedProduct
                });
                
                const response = await ApiService.uploadSellerReel(formData);
                
                if (response.success) {
                    toast.success('Reel uploaded successfully!');
                    // Refresh the reels list
                    await loadReels();
                    setShowUploadForm(false);
                    resetForm();
                } else {
                    toast.error('Upload failed: ' + response.message);
                }
            }
            setLoading(false);
        } catch (error) {
            console.error('Upload/Edit error:', error);
            toast.error('Operation failed: ' + error.message);
            setLoading(false);
        }
    };

    const resetForm = () => {
        setUploadData({
            title: '',
            description: '',
            category: '',
            video: null,
            thumbnail: null,
            video_url: '',
            thumbnail_url: '',
            associationType: '',
            selectedBrand: '',
            selectedProduct: ''
        });
        setSellerProducts([]);
        setBrandProducts([]);
        setEditingReelId(null);
        setViewingReel(null);
    };

    const handleCancel = () => {
        // If we're editing, navigate back to the base URL
        if (editingReelId) {
            navigate('/studio/seller/upload');
        } else if (viewingReel) {
            // If we're viewing, go back to the list
            setViewingReel(null);
        } else {
            // Otherwise, just toggle the form visibility
            setShowUploadForm(false);
            resetForm();
        }
    };

    const handleEditReel = (reel) => {
        // Navigate to the edit URL instead of loading data in the same view
        navigate(`/studio/seller/upload/${reel.id}`);
    };

    const handleViewReel = async (reel) => {
        try {
            setLoading(true);
            const response = await ApiService.getReelById(reel.id);
            
            if (response.success) {
                setViewingReel(response.data);
            } else {
                toast.error('Failed to load reel details: ' + response.message);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading reel for view:', error);
            toast.error('Failed to load reel details: ' + error.message);
            setLoading(false);
        }
    };

    const handleDeleteReel = async (reelId) => {
        if (window.confirm('Are you sure you want to delete this reel? This action cannot be undone.')) {
            try {
                setLoading(true);
                const response = await ApiService.deleteReel(reelId);
                
                if (response.success) {
                    toast.success('Reel deleted successfully!');
                    // Refresh the reels list
                    await loadReels();
                    // If we were viewing this reel, close the view
                    if (viewingReel && viewingReel.id === reelId) {
                        setViewingReel(null);
                    }
                } else {
                    toast.error('Delete failed: ' + response.message);
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Delete error:', error);
                toast.error('Delete failed: ' + error.message);
                setLoading(false);
            }
        }
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

    // Render view reel details page
    if (viewingReel) {
        return (
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-flex align-items-center justify-content-between">
                        <h4 className="page-title mb-0">Reel Details</h4>
                    </div>
                </div>

                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <h5 className="card-title mb-0">Reel Information</h5>
                            <button 
                                className="btn btn-secondary" 
                                onClick={handleCancel}
                            >
                                <i className="ri-arrow-left-line me-1"></i> Back to List
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-8">
                                    <div className="mb-4">
                                        <h5>{viewingReel.title}</h5>
                                        <p className="text-muted">{viewingReel.description || 'No description provided'}</p>
                                    </div>
                                    
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Category</label>
                                                <p>{viewingReel.category_name || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Status</label>
                                                <p>{getStatusBadge(viewingReel.status)}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Upload Date</label>
                                                <p>{new Date(viewingReel.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Association</label>
                                                <p>{viewingReel.brand_id ? 'Brand' : 'Product'}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Views</label>
                                                <p>{viewingReel.views || 0}</p>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">Likes</label>
                                                <p>{viewingReel.likes || 0}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="col-md-4">
                                    {viewingReel.thumbnail && (
                                        <div className="mb-3">
                                            <label className="form-label fw-bold">Thumbnail</label>
                                            <div className="border rounded p-2 text-center">
                                                <img 
                                                    src={viewingReel.thumbnail} 
                                                    alt="Thumbnail" 
                                                    className="img-fluid"
                                                    style={{ maxHeight: '200px' }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                    
                                    {viewingReel.video_url && (
                                        <div className="mt-3">
                                            <label className="form-label fw-bold">Video</label>
                                            <div className="border rounded p-2">
                                                <video 
                                                    src={viewingReel.video_url} 
                                                    controls 
                                                    className="w-100"
                                                    style={{ maxHeight: '400px' }}
                                                />
                                            </div>
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

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-flex align-items-center justify-content-between py-3">
                        <h4 className="mb-0">{editingReelId ? 'Edit Reel' : 'Upload Reels'}</h4>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header" style={{ backgroundColor: 'transparent' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">My Reels</h5>
                                <button 
                                    className="btn btn-light"
                                    onClick={() => setShowUploadForm(!showUploadForm)}
                                >
                                    <i className={`mdi mdi-${showUploadForm ? 'close' : 'plus'} me-1`}></i>
                                    {showUploadForm ? 'Cancel' : editingReelId ? 'Back to Reels' : 'Upload New Reel'}
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            {showUploadForm || editingReelId ? (
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

                                            {/* Association Type Selection - Appears after category is selected */}
                                            {uploadData.category && (
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Associate With <span className="text-danger">*</span>
                                                    </label>
                                                    <div className="d-flex gap-3">
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="associationType"
                                                                id="associateProduct"
                                                                value="product"
                                                                checked={uploadData.associationType === 'product'}
                                                                onChange={() => handleAssociationTypeChange('product')}
                                                                disabled={loading}
                                                            />
                                                            <label className="form-check-label" htmlFor="associateProduct">
                                                                Product
                                                            </label>
                                                        </div>
                                                        <div className="form-check">
                                                            <input
                                                                className="form-check-input"
                                                                type="radio"
                                                                name="associationType"
                                                                id="associateBrand"
                                                                value="brand"
                                                                checked={uploadData.associationType === 'brand'}
                                                                onChange={() => handleAssociationTypeChange('brand')}
                                                                disabled={loading}
                                                            />
                                                            <label className="form-check-label" htmlFor="associateBrand">
                                                                Brand
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Brand Selection - Appears when brand association is selected */}
                                            {uploadData.associationType === 'brand' && (
                                                <div className="mb-3">
                                                    <label htmlFor="selectedBrand" className="form-label">
                                                        Select Brand <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        id="selectedBrand"
                                                        name="selectedBrand"
                                                        value={uploadData.selectedBrand}
                                                        onChange={(e) => handleBrandChange(e.target.value)}
                                                        disabled={loading}
                                                        required
                                                    >
                                                        <option value="">Select a brand</option>
                                                        {brands.map(brand => (
                                                            <option key={brand.id} value={brand.id}>
                                                                {brand.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {/* Product Selection - Appears based on association type */}
                                            {(uploadData.associationType === 'product' && sellerProducts.length > 0) || 
                                             (uploadData.associationType === 'brand' && uploadData.selectedBrand && brandProducts.length > 0) ? (
                                                <div className="mb-3">
                                                    <label className="form-label">
                                                        Select Product <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        name="selectedProduct"
                                                        value={uploadData.selectedProduct}
                                                        onChange={handleInputChange}
                                                        disabled={loading}
                                                        required
                                                    >
                                                        <option value="">Select a product</option>
                                                        {uploadData.associationType === 'product' 
                                                            ? sellerProducts.map(product => (
                                                                <option 
                                                                    key={product.product_id} 
                                                                    value={product.product_id}
                                                                >
                                                                    {product.name} ({product.model})
                                                                </option>
                                                            ))
                                                            : brandProducts.map(product => (
                                                                <option 
                                                                    key={product.id} 
                                                                    value={product.id}
                                                                >
                                                                    {product.name} ({product.model})
                                                                </option>
                                                            ))
                                                        }
                                                    </select>
                                                </div>
                                            ) : uploadData.associationType === 'product' && uploadData.category ? (
                                                <div className="mb-3">
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-outline-primary"
                                                        onClick={loadSellerProducts}
                                                        disabled={loading}
                                                    >
                                                        {loading ? 'Loading...' : 'Load My Products'}
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="col-md-4">
                                            {/* Video Preview - Only shown when editing */}
                                            {editingReelId && uploadData.video_url && (
                                                <div className="mb-3">
                                                    <label className="form-label">Current Video</label>
                                                    <div className="border rounded p-2">
                                                        <div className="alert alert-info">
                                                            <strong>Video Path:</strong> {uploadData.video_url}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Video Upload - Always shown when creating, optional when editing */}
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    {editingReelId ? 'Replace Video' : 'Video'} {editingReelId ? '' : <span className="text-danger">*</span>}
                                                </label>
                                                <div className="input-group">
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept="video/*"
                                                        onChange={(e) => handleFileChange(e, 'video')}
                                                        disabled={loading}
                                                        required={!editingReelId} // Only required when creating
                                                    />
                                                </div>
                                                <div className="form-text">
                                                    MP4, MOV, AVI formats allowed. Max size: 100MB
                                                </div>
                                            </div>

                                            {/* Thumbnail Preview - Only shown when editing */}
                                            {editingReelId && uploadData.thumbnail_url && (
                                                <div className="mb-3">
                                                    <label className="form-label">Current Thumbnail</label>
                                                    <div className="border rounded p-2 text-center">
                                                        <img 
                                                            src={uploadData.thumbnail_url} 
                                                            alt="Thumbnail" 
                                                            className="img-fluid"
                                                            style={{ maxHeight: '150px' }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Thumbnail Upload - Always shown when creating, optional when editing */}
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    {editingReelId ? 'Replace Thumbnail' : 'Thumbnail'}
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

                                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                        <button 
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleCancel}
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
                                                    {editingReelId ? 'Updating...' : 'Uploading...'}
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-upload-line me-1"></i> 
                                                    {editingReelId ? 'Update Reel' : 'Upload Reel'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-centered table-nowrap mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Title</th>
                                                <th>Category</th>
                                                <th>Status</th>
                                                <th>Views</th>
                                                <th>Likes</th>
                                                <th>Date</th>
                                                <th className="text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reels.map((reel) => (
                                                <tr key={reel.id}>
                                                    <td>
                                                        <h6 className="mb-0">{reel.title}</h6>
                                                    </td>
                                                    <td>{reel.category_name}</td>
                                                    <td>{getStatusBadge(reel.status)}</td>
                                                    <td>{reel.views}</td>
                                                    <td>{reel.likes}</td>
                                                    <td>{new Date(reel.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <div className="d-flex gap-1 justify-content-end">
                                                            <button 
                                                                className="btn btn-outline-primary btn-sm"
                                                                onClick={() => handleViewReel(reel)}
                                                                title="View"
                                                            >
                                                                <i data-lucide="eye"></i>
                                                            </button>
                                                            <button 
                                                                className="btn btn-outline-warning btn-sm"
                                                                onClick={() => handleEditReel(reel)}
                                                                title="Edit"
                                                            >
                                                                <i data-lucide="pencil"></i>
                                                            </button>
                                                            <button 
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={() => handleDeleteReel(reel.id)}
                                                                title="Delete"
                                                            >
                                                                <i data-lucide="trash-2"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    {reels.length === 0 && !loading && (
                                        <div className="text-center py-5">
                                            <h5>No reels found</h5>
                                            <p className="text-muted">Upload your first reel to get started.</p>
                                            <button 
                                                className="btn btn-success" 
                                                onClick={() => setShowUploadForm(true)}
                                            >
                                                <i className="ri-upload-line me-1"></i> Upload Reel
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {loading && (
                                <div className="text-center mt-3">
                                    <div className="spinner-border" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}