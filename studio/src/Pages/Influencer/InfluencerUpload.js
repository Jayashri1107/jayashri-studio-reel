import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function InfluencerUpload() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get the reel ID from the route parameter
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        category: '',
        video: null,
        thumbnail: null,
        videoDuration: 0,
        associationType: 'product', // 'product' or 'brand'
        selectedBrand: '',
        selectedProducts: []
    });
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [brandProducts, setBrandProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [reels, setReels] = useState([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [editingReelId, setEditingReelId] = useState(null);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    
    // Filter states
    const [filters, setFilters] = useState({
        title: '',
        category: '',
        status: '',
        created: ''
    });

    useEffect(() => {
        console.log('Component mounted, initializing data loading...');
        
        // Load initial data
        loadCategories();
        loadReels();
        loadProducts(); // Load all products on mount
        loadBrands(); // Load brands on mount
        
        // Handle route changes
        if (id) {
            // We're editing a reel
            setEditingReelId(id);
            setShowUploadForm(true);
            loadReelForEdit(id);
        } else {
            // We're on the upload page (not editing) - show list by default
            setEditingReelId(null);
            setShowUploadForm(false);
            // Reset form data only if we were previously editing
            if (editingReelId) {
                resetForm();
            }
        }
    }, [id]);

    useEffect(() => {
        console.log('Upload data updated:', uploadData);
    }, [uploadData]);

    useEffect(() => {
        console.log('Brands updated:', brands.length);
    }, [brands]);

    useEffect(() => {
        console.log('Brand products updated:', brandProducts.length);
    }, [brandProducts]);

    useEffect(() => {
        console.log('All products updated:', allProducts.length);
    }, [allProducts]);

    useEffect(() => {
        console.log('Filtered products updated:', filteredProducts.length);
    }, [filteredProducts]);
    
    // Initialize Lucide icons after render
    useEffect(() => {
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Re-initialize icons when reels data changes
        const timer = setTimeout(() => {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }, 100);
        
        return () => clearTimeout(timer);
    }, [reels, showUploadForm]);

    const loadCategories = async () => {
        try {
            console.log('Loading categories...');
            setLoading(true);
            const response = await ApiService.getCategories();
            console.log('Categories response:', response);
            if (response.success) {
                setCategories(response.data);
                console.log('Categories loaded:', response.data);
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
            const response = await ApiService.getInfluencerReels();
            if (response.success) {
                setReels(response.data);
                // Reinitialize icons after loading reels
                setTimeout(() => {
                    if (window.lucide) {
                        window.lucide.createIcons();
                    }
                }, 100);
            } else {
                toast.error('Failed to load reels: ' + response.message);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading reels:', error);
            toast.error('Failed to load reels: ' + error.message);
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getAllProducts();
            if (response.success) {
                setAllProducts(response.data);
            } else {
                toast.error('Failed to load products: ' + response.message);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Failed to load products: ' + error.message);
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

    const loadBrandProducts = async (brandId) => {
        try {
            setLoading(true);
            const response = await ApiService.getBrandProducts(brandId);
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

    // Function for fetching related products
    const loadReelForEdit = async (reelId) => {
        try {
            setLoading(true);
            const response = await ApiService.getReelById(reelId);
            
            if (response.success) {
                const reelData = response.data;
                
                // Process product IDs - they come as a comma-separated string from the backend
                let productIds = [];
                if (reelData.product_ids) {
                    if (Array.isArray(reelData.product_ids)) {
                        productIds = reelData.product_ids;
                    } else if (typeof reelData.product_ids === 'string') {
                        productIds = reelData.product_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                    }
                }
                
                // Determine association type based on available data
                let associationType = 'product';
                if (reelData.seller_id) {
                    associationType = 'seller';
                } else if (reelData.brand_id) {
                    associationType = 'brand';
                }
                
                // Now set the form data with the reel information
                setUploadData({
                    title: reelData.title || '',
                    description: reelData.description || '',
                    category: reelData.category_id || '',
                    video: null, // We don't need to preload the video file
                    thumbnail: null, // We don't need to preload the thumbnail
                    video_url: reelData.video_url || '', // Store the video URL for display
                    thumbnail_url: reelData.thumbnail || '', // Store the thumbnail URL for display
                    associationType: associationType,
                    selectedBrand: reelData.brand_id || '', // Use brand_id for brand association
                    selectedProducts: productIds
                });
                
                console.log('Reel loaded for edit:', reelData);
                console.log('Selected products:', productIds);
                console.log('Association type:', associationType);
                console.log('Selected brand:', reelData.brand_id || '');
                
                // If we're editing a brand-associated reel, load the brand products
                if (associationType === 'brand' && reelData.brand_id) {
                    await loadBrandProducts(reelData.brand_id);
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
        console.log('File selected for field', fieldName, ':', file);
        if (!file) return;

        if (fieldName === 'video') {
            const url = URL.createObjectURL(file);
            const vid = document.createElement('video');
            vid.preload = 'metadata';
            vid.src = url;
            vid.onloadedmetadata = () => {
                URL.revokeObjectURL(url);
                const duration = vid.duration || 0;
                if (duration > 30.0) {
                    toast.error('Video must be 30 seconds or less');
                    e.target.value = '';
                    return;
                }
                setUploadData(prev => ({
                    ...prev,
                    video: file,
                    videoDuration: duration
                }));
                console.log('Video duration (s):', duration);
            };
            vid.onerror = () => {
                URL.revokeObjectURL(url);
                toast.error('Unable to read video metadata');
            };
            return;
        }

        setUploadData(prev => ({
            ...prev,
            [fieldName]: file
        }));
        console.log('Upload data after file selection:', { ...uploadData, [fieldName]: file });
    };

    const handleAssociationTypeChange = (type) => {
        setUploadData(prev => ({
            ...prev,
            associationType: type,
            selectedBrand: '',
            selectedProducts: []
        }));
        
        // Clear products when changing association type
        setBrandProducts([]);
        setSearchTerm('');
        setFilteredProducts([]);
        setShowProductDropdown(false);
        
        // Load appropriate data based on selection
        if (type === 'brand') {
            loadBrands();
        }
    };

    const handleBrandChange = (brandId) => {
        setUploadData(prev => ({
            ...prev,
            selectedBrand: brandId,
            selectedProducts: []
        }));
        
        // Clear products when selecting a brand
        setBrandProducts([]);
        setSearchTerm('');
        setFilteredProducts([]);
        setShowProductDropdown(false);
        
        // Load brand products
        if (brandId) {
            loadBrandProducts(brandId);
        }
    };

    const handleProductSearch = (searchTerm) => {
        setSearchTerm(searchTerm);
        setShowProductDropdown(true);
        
        const productsToFilter = uploadData.associationType === 'brand' ? brandProducts : allProducts;
        if (searchTerm === '') {
            // Show all products when search is empty
            setFilteredProducts(productsToFilter);
        } else {
            const filtered = productsToFilter.filter(product => 
                product.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    };

    // New function to handle product selection from searchable dropdown
    const handleProductSelect = (product) => {
        const productId = product.product_id || product.id;
        
        // Check if product is already selected
        const isAlreadySelected = uploadData.selectedProducts.includes(productId);
        
        if (isAlreadySelected) {
            // Remove product from selection
            setUploadData(prev => ({
                ...prev,
                selectedProducts: prev.selectedProducts.filter(id => id !== productId)
            }));
        } else {
            // Add product to selection (max 3)
            if (uploadData.selectedProducts.length >= 3) {
                toast.warn('You can select maximum 3 products');
                return;
            }
            
            setUploadData(prev => ({
                ...prev,
                selectedProducts: [...prev.selectedProducts, productId]
            }));
        }
        
        // Clear search term after selection
        setSearchTerm('');
        setShowProductDropdown(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Log all form data before validation
        console.log('Form data before validation:', uploadData);
        
        // More robust validation with detailed logging
        const validationDetails = {
            title: !!uploadData.title,
            category: !!uploadData.category,
            video: !!uploadData.video,
            associationType: !!uploadData.associationType,
            brandOrProduct: (uploadData.associationType === 'product') || 
                          (uploadData.associationType === 'brand' && !!uploadData.selectedBrand),
            selectedProducts: uploadData.selectedProducts && uploadData.selectedProducts.length > 0,
            productCount: uploadData.selectedProducts ? uploadData.selectedProducts.length : 0
        };
        
        console.log('Validation details:', validationDetails);
        
        const isFormValid = 
            uploadData.title && 
            uploadData.category && 
            (editingReelId || uploadData.video) && // Video is not required when editing
            uploadData.associationType && 
            ((uploadData.associationType === 'product') || 
             (uploadData.associationType === 'brand' && uploadData.selectedBrand)) &&
            uploadData.selectedProducts && 
            uploadData.selectedProducts.length > 0 &&
            uploadData.selectedProducts.length <= 3;
        
        if (!isFormValid) {
            console.log('Form validation failed:', validationDetails);
            toast.error('Please fill in all required fields correctly');
            return;
        }

        if (uploadData.category === 'other' && !newCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }

        setLoading(true);
        
        try {
            if (editingReelId) {
                // Edit existing reel (with optional file upload)
                if (uploadData.video || uploadData.thumbnail) {
                    // If files are selected, use FormData
                    const formData = new FormData();
                    formData.append('title', uploadData.title || '');
                    formData.append('description', uploadData.description || '');
                    formData.append('category', uploadData.category || '');
                    if (uploadData.category === 'other' && newCategoryName.trim()) {
                        formData.append('otherCategoryName', newCategoryName.trim());
                    }
                    formData.append('selectedProducts', JSON.stringify(uploadData.selectedProducts));
                    
                    // Add files if they exist
                    if (uploadData.video) {
                        if (uploadData.videoDuration > 30) {
                            toast.error('Video must be 30 seconds or less');
                            setLoading(false);
                            return;
                        }
                        formData.append('video', uploadData.video);
                        formData.append('videoDuration', String(uploadData.videoDuration || 0));
                    }
                    
                    if (uploadData.thumbnail) {
                        formData.append('thumbnail', uploadData.thumbnail);
                    }
                    
                    const response = await ApiService.editReelWithFiles(editingReelId, formData);
                    
                    if (response.success) {
                        toast.success('Reel updated successfully!');
                        // Refresh the reels list
                        await loadReels();
                        // Reset form
                        setShowUploadForm(false);
                        resetForm();
                    } else {
                        toast.error('Update failed: ' + response.message);
                    }
                } else {
                    // No files selected, use regular JSON data
                    const reelData = {
                        title: uploadData.title,
                        description: uploadData.description,
                        category: uploadData.category,
                        otherCategoryName: uploadData.category === 'other' ? newCategoryName.trim() : undefined,
                        associationType: uploadData.associationType,
                        selectedBrand: uploadData.selectedBrand,
                        selectedProducts: uploadData.selectedProducts
                    };
                    
                    const response = await ApiService.editReel(editingReelId, reelData);
                    
                    if (response.success) {
                        toast.success('Reel updated successfully!');
                        // Refresh the reels list
                        await loadReels();
                        // Reset form
                        setShowUploadForm(false);
                        resetForm();
                    } else {
                        toast.error('Update failed: ' + response.message);
                    }
                }
            } else {
        // Upload new reel
        // Prepare form data for upload
        const formData = new FormData();
                console.log('=== CREATING FORM DATA ===');
                console.log('Upload data:', uploadData);
                
                // Add all fields to formData
                formData.append('title', uploadData.title || '');
                formData.append('description', uploadData.description || '');
                formData.append('category', uploadData.category || '');
                if (uploadData.category === 'other' && newCategoryName.trim()) {
                    formData.append('otherCategoryName', newCategoryName.trim());
                }
                formData.append('associationType', uploadData.associationType || '');
                formData.append('selectedBrand', uploadData.selectedBrand || '');
                formData.append('selectedProducts', JSON.stringify(uploadData.selectedProducts));
                
                // Add files if they exist
                if (uploadData.video) {
                    if (uploadData.videoDuration > 30) {
                        toast.error('Video must be 30 seconds or less');
                        setLoading(false);
                        return;
                    }
                    formData.append('video', uploadData.video);
                    formData.append('videoDuration', String(uploadData.videoDuration || 0));
                    console.log('Video file appended to formData');
                }
                
                if (uploadData.thumbnail) {
                    formData.append('thumbnail', uploadData.thumbnail);
                    console.log('Thumbnail file appended to formData');
                } else {
                    console.log('No thumbnail file to append');
                }
                
                console.log('FormData contents:');
                for (let [key, value] of formData.entries()) {
                    console.log(key, value);
                }
                
                console.log('Sending upload request with data:', uploadData);
                
                const response = await ApiService.uploadReel(formData);
                
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
            console.error('Upload error:', error);
            // Show more specific error message
            const errorMessage = error.message || 'Unknown error occurred';
            toast.error('Upload failed: ' + errorMessage);
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
            videoDuration: 0,
            video_url: '',
            thumbnail_url: '',
            associationType: 'product',
            selectedBrand: '',
            selectedProducts: []
        });
        setNewCategoryName('');
        setAllProducts([]);
        setBrandProducts([]);
        setFilteredProducts([]);
        setSearchTerm('');
        setShowProductDropdown(false);
        setEditingReelId(null);
        // Reload products after reset
        loadProducts();
        loadBrands();
    };

    const handleCancel = () => {
        // If we're editing, navigate back to the base URL
        if (editingReelId) {
            navigate('/studio/influencer/upload');
        } else {
            // Otherwise, just toggle the form visibility
            setShowUploadForm(false);
            resetForm();
        }
    };

    const handleUploadNewReel = () => {
        setShowUploadForm(true);
        resetForm();
    };

    const handleViewReel = (reel) => {
        // Navigate to the reel details page
        navigate(`/studio/influencer/upload/${reel.id}/details`);
    };

    const handleEditReel = (reel) => {
        // Navigate to the edit URL instead of loading data in the same view
        navigate(`/studio/influencer/upload/${reel.id}`);
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

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    // Function to get product name by ID
    const getProductName = (productId) => {
        const product = [...allProducts, ...brandProducts].find(p => 
            String(p.product_id || p.id) === String(productId)
        );
        return product ? product.name : `Product ID: ${productId}`;
    };

    // Function to remove a selected product
    const removeSelectedProduct = (productId) => {
        setUploadData(prev => ({
            ...prev,
            selectedProducts: prev.selectedProducts.filter(id => id !== productId)
        }));
    };

    // Function to handle focus on search input
    const handleSearchFocus = () => {
        setShowProductDropdown(true);
        // Show all products when focusing on search input
        const productsToFilter = uploadData.associationType === 'brand' ? brandProducts : allProducts;
        setFilteredProducts(productsToFilter);
    };
    
    // Filter handling functions
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const applyFilters = async () => {
        try {
            setLoading(true);
            // Pass filters as query parameters to the API
            const response = await ApiService.getInfluencerReels(filters);
            if (response.success) {
                setReels(response.data);
            } else {
                toast.error('Failed to filter reels: ' + response.message);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error filtering reels:', error);
            toast.error('Failed to filter reels: ' + error.message);
            setLoading(false);
        }
    };
    
    const clearFilters = () => {
        setFilters({
            title: '',
            category: '',
            status: '',
            created: ''
        });
        // Reload all reels
        loadReels();
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [reels, filters]);
    
    const handleFilterSubmit = (e) => {
        e.preventDefault();
        applyFilters();
    };

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
                                    onClick={showUploadForm ? handleCancel : handleUploadNewReel}
                                >
                                    <i className={`mdi mdi-${showUploadForm ? 'close' : 'plus'} me-1`}></i>
                                    {showUploadForm ? 'Cancel' : editingReelId ? 'Back to Reels' : 'Upload New Reel'}
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            {showUploadForm ? (
                                <form onSubmit={handleSubmit} className="mb-4">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="title"
                                                    value={uploadData.title}
                                                    onChange={handleInputChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Category</label>
                                                <select
                                                    className="form-select"
                                                    name="category"
                                                    value={uploadData.category}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">Select Category</option>
                                                    <option value="other">Other</option>
                                                    {categories.map(category => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {uploadData.category === 'other' && (
                                        <div className="mb-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Enter new category name"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                disabled={loading}
                                            />
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            value={uploadData.description}
                                            onChange={handleInputChange}
                                            rows="3"
                                        ></textarea>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Video</label>
                                                {editingReelId ? (
                                                    <div>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            accept="video/*"
                                                            onChange={(e) => handleFileChange(e, 'video')}
                                                        />
                                                        {uploadData.video_url && (
                                                            <small className="form-text text-muted">
                                                                Current video: {uploadData.video_url}
                                                            </small>
                                                        )}
                                                        <small className="form-text text-muted">Leave empty to keep current video, or select a new video to replace it.</small>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept="video/*"
                                                        onChange={(e) => handleFileChange(e, 'video')}
                                                        required
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Thumbnail</label>
                                                {editingReelId ? (
                                                    <div>
                                                        <input
                                                            type="file"
                                                            className="form-control"
                                                            accept="image/*"
                                                            onChange={(e) => handleFileChange(e, 'thumbnail')}
                                                        />
                                                        {uploadData.thumbnail_url && (
                                                            <small className="form-text text-muted">
                                                                Current thumbnail: {uploadData.thumbnail_url}
                                                            </small>
                                                        )}
                                                        {uploadData.thumbnail_url && (
                                                            <div>
                                                                <img src={uploadData.thumbnail_url} alt="Current thumbnail" style={{maxWidth: '100px', maxHeight: '100px'}} />
                                                            </div>
                                                        )}
                                                        <small className="form-text text-muted">Leave empty to keep current thumbnail, or select a new thumbnail to replace it.</small>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type="file"
                                                        className="form-control"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileChange(e, 'thumbnail')}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Association Type</label>
                                        <div>
                                            <div className="form-check form-check-inline">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="associationType"
                                                    id="productRadio"
                                                    checked={uploadData.associationType === 'product'}
                                                    onChange={() => handleAssociationTypeChange('product')}
                                                />
                                                <label className="form-check-label" htmlFor="productRadio">
                                                    Product
                                                </label>
                                            </div>
                                            <div className="form-check form-check-inline">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="associationType"
                                                    id="brandRadio"
                                                    checked={uploadData.associationType === 'brand'}
                                                    onChange={() => handleAssociationTypeChange('brand')}
                                                />
                                                <label className="form-check-label" htmlFor="brandRadio">
                                                    Brand
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {uploadData.associationType === 'brand' && (
                                        <div className="mb-3">
                                            <label className="form-label">Select Brand</label>
                                            <select
                                                className="form-select"
                                                value={uploadData.selectedBrand}
                                                onChange={(e) => handleBrandChange(e.target.value)}
                                                required
                                            >
                                                <option value="">Select Brand</option>
                                                {brands.map(brand => (
                                                    <option key={brand.id} value={brand.id}>
                                                        {brand.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label className="form-label">Select Products</label>
                                        {uploadData.associationType === 'brand' && !uploadData.selectedBrand && (
                                            <div className="alert alert-info">
                                                Please select a brand first to see its products.
                                            </div>
                                        )}
                                        {(uploadData.associationType === 'product' || 
                                         (uploadData.associationType === 'brand' && uploadData.selectedBrand)) ? (
                                            <>
                                                {/* Selected Products Display */}
                                                {uploadData.selectedProducts.length > 0 && (
                                                    <div className="mb-2">
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {uploadData.selectedProducts.map((productId) => (
                                                                <span key={productId} className="badge bg-primary d-flex align-items-center">
                                                                    {getProductName(productId)}
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn-close btn-close-white ms-2" 
                                                                        aria-label="Remove"
                                                                        onClick={() => removeSelectedProduct(productId)}
                                                                        style={{fontSize: '0.5rem'}}
                                                                    ></button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {/* Searchable Product Dropdown */}
                                                <div className="position-relative">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Search and select products (max 3)..."
                                                        value={searchTerm}
                                                        onChange={(e) => handleProductSearch(e.target.value)}
                                                        onFocus={handleSearchFocus}
                                                        onBlur={() => {
                                                            // Delay hiding dropdown to allow for clicks
                                                            setTimeout(() => setShowProductDropdown(false), 200);
                                                        }}
                                                    />
                                                    {showProductDropdown && (
                                                        <div className="position-absolute w-100 mt-1" style={{zIndex: 1000, maxHeight: '200px', overflowY: 'auto'}}>
                                                            <ul className="list-group">
                                                                {filteredProducts
                                                                    .filter(product => !uploadData.selectedProducts.includes(product.product_id || product.id))
                                                                    .map(product => (
                                                                        <li 
                                                                            key={product.product_id || product.id} 
                                                                            className="list-group-item list-group-item-action cursor-pointer"
                                                                            onMouseDown={() => handleProductSelect(product)} // Use onMouseDown to prevent blur
                                                                        >
                                                                            {product.name}
                                                                        </li>
                                                                    ))
                                                                }
                                                                {filteredProducts.filter(product => !uploadData.selectedProducts.includes(product.product_id || product.id)).length === 0 && (
                                                                    <li className="list-group-item text-muted">
                                                                        No products found
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <small className="form-text text-muted">
                                                    Search products and click on them to select. You can select up to 3 products.
                                                </small>
                                            </>
                                        ) : null}
                                    </div>

                                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                                        <button 
                                            type="submit" 
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                    <span>Loading...</span>
                                                </>
                                            ) : editingReelId ? (
                                                'Update Reel'
                                            ) : (
                                                'Upload Reel'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    {/* Filter Section - Always visible */}
                                    <form onSubmit={handleFilterSubmit} className="mb-3 p-3 border rounded">
                                        <div className="row g-3 align-items-end">
                                            <div className="col-md-3">
                                                <label className="form-label">Title</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="title"
                                                    value={filters.title}
                                                    onChange={handleFilterChange}
                                                    placeholder="Filter by title"
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <label className="form-label">Category</label>
                                                <select
                                                    className="form-select"
                                                    name="category"
                                                    value={filters.category}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="">All Categories</option>
                                                    {categories.map(category => (
                                                        <option key={category.id} value={category.id}>
                                                            {category.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label">Status</label>
                                                <select
                                                    className="form-select"
                                                    name="status"
                                                    value={filters.status}
                                                    onChange={handleFilterChange}
                                                >
                                                    <option value="">All Statuses</option>
                                                    <option value="approved">Approved</option>
                                                    <option value="pending">Pending</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                            </div>
                                            <div className="col-md-2">
                                                <label className="form-label">Created Date</label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    name="created"
                                                    value={filters.created}
                                                    onChange={handleFilterChange}
                                                />
                                            </div>
                                            <div className="col-md-2 d-flex align-items-end">
                                                <div className="d-flex gap-2 w-100">
                                                    <button 
                                                        type="button" 
                                                        className="btn btn-outline-secondary btn-sm flex-fill"
                                                        onClick={clearFilters}
                                                    >
                                                        Clear
                                                    </button>
                                                    <button 
                                                        type="submit" 
                                                        className="btn btn-primary btn-sm flex-fill"
                                                    >
                                                        Apply
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                    
                                    <div className="table-responsive">
                                        <table className="table table-centered table-nowrap mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Title</th>
                                                    <th>Category</th>
                                                    <th>Status</th>
                                                    <th>Product Count</th>
                                                    <th>Created</th>
                                                    <th className="text-end">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reels.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="text-center py-5">No record found</td>
                                                    </tr>
                                                ) : (
                                                    reels.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((reel) => (
                                                        <tr key={reel.id}>
                                                            <td>
                                                                <h6 className="mb-0">{reel.title}</h6>
                                                            </td>
                                                            <td>{reel.category_name}</td>
                                                            <td>{getStatusBadge(reel.status)}</td>
                                                            <td>{reel.product_count || 0}</td>
                                                            <td>{new Date(reel.created_at).toLocaleDateString()}</td>
                                                            <td>
                                                                <div className="d-flex gap-1 justify-content-end">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-primary btn-sm"
                                                                        onClick={() => handleViewReel(reel)}
                                                                        title="View"
                                                                    >
                                                                        <i data-lucide="eye"></i>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-warning btn-sm"
                                                                        onClick={() => handleEditReel(reel)}
                                                                        title="Edit"
                                                                    >
                                                                        <i data-lucide="pencil"></i>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-danger btn-sm"
                                                                        onClick={() => handleDeleteReel(reel.id)}
                                                                        title="Delete"
                                                                    >
                                                                        <i data-lucide="trash-2"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center mt-3">
                                        <div className="text-muted">{(() => {
                                            const total = reels.length;
                                            const start = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
                                            const end = Math.min(currentPage * pageSize, total);
                                            return `Showing ${start} to ${end} of ${total} entries`;
                                        })()}</div>
                                        <ul className="pagination mb-0">
                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                <button className="page-link" aria-label="Previous" onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
                                                    <i className="ri-arrow-left-s-line"></i>
                                                </button>
                                            </li>
                                            {Array.from({ length: Math.ceil(reels.length / pageSize) || 1 }, (_, i) => i + 1).map(page => (
                                                <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                                                    <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                                                </li>
                                            ))}
                                            <li className={`page-item ${currentPage >= Math.ceil(reels.length / pageSize) ? 'disabled' : ''}`}>
                                                <button className="page-link" aria-label="Next" onClick={() => setCurrentPage(p => Math.min(Math.ceil(reels.length / pageSize) || 1, p + 1))}>
                                                    <i className="ri-arrow-right-s-line"></i>
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </>
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
