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
        videoDuration: 0,
        video_url: '', // Store the video URL for display when editing
        thumbnail_url: '', // Store the thumbnail URL for display when editing
        associationType: '', // 'product' or 'brand'
        selectedBrand: '',
        selectedProducts: [] // Use array to store multiple products (max 3)
    });
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [brands, setBrands] = useState([]);
    const [sellerProducts, setSellerProducts] = useState([]);
    const [brandProducts, setBrandProducts] = useState([]);
    // Added state variables for searchable dropdowns
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    // Removed relatedProducts state
    const [reels, setReels] = useState([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [editingReelId, setEditingReelId] = useState(null);
    const [viewingReel, setViewingReel] = useState(null); // For viewing reel details
    const [productNames, setProductNames] = useState({}); // For storing product names
    const [filters, setFilters] = useState({
        title: '',
        category: '',
        date: '',
        status: '' // Add status filter
    });
    const hasActiveFilters = !!(filters.title || filters.category || filters.date || filters.status);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

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

    useEffect(() => {
        setCurrentPage(1);
    }, [reels, filters]);
    
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
            // Get the vendor ID from the authenticated user
            const user = JSON.parse(localStorage.getItem('studioUser'));
            const vendorId = user?.vendor_id;
            
            if (!vendorId) {
                console.log('Vendor ID not found in user session');
                setLoading(false);
                return;
            }
            
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

    const loadReelsWithFilters = async () => {
        try {
            setLoading(true);
            // For sellers, we need to pass the vendor ID
            // Get the vendor ID from the authenticated user
            const user = JSON.parse(localStorage.getItem('studioUser'));
            const vendorId = user?.vendor_id;
            
            if (!vendorId) {
                console.log('Vendor ID not found in user session');
                setLoading(false);
                return;
            }
            
            // Pass filters to the API service
            const response = await ApiService.getSellerReels(vendorId, filters);
            console.log('Received filtered reels response:', response);
            if (response.success) {
                console.log('Setting reels with filtered data:', response.data);
                setReels(response.data);
            } else {
                // Don't show error for reels loading, it's not critical
                console.log('Failed to load reels: ' + response.message);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading reels with filters:', error);
            // Don't show error for reels loading, it's not critical
            setLoading(false);
        }
    };

    const handleFilter = async () => {
        console.log('Filtering reels with:', filters);
        // Also log the individual filter values
        console.log('Status filter value:', filters.status);
        await loadReelsWithFilters();
    };

    const handleClearFilter = async () => {
        setFilters({
            title: '',
            category: '',
            date: '',
            status: ''
        });
        await loadReels(); // Reload all reels
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
        // For sellers, we load their own products using their vendor ID
        try {
            setLoading(true);
            // Get the vendor ID from the authenticated user
            const user = JSON.parse(localStorage.getItem('studioUser'));
            const vendorId = user?.vendor_id;
            
            if (!vendorId) {
                console.log('Vendor ID not found in user session');
                toast.error('Unable to load products: User not authenticated');
                setSellerProducts([]);
                setFilteredProducts([]);
                setLoading(false);
                return;
            }
            
            const response = await ApiService.getSellerProducts(vendorId);
            console.log('Seller products response:', response); // Debug log
            if (response.success) {
                setSellerProducts(response.data);
                setFilteredProducts(response.data);
            } else {
                toast.error('Failed to load products: ' + response.message);
                setSellerProducts([]); // Clear products on error
                setFilteredProducts([]); // Clear filtered products on error
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Failed to load products: ' + error.message);
            setSellerProducts([]); // Clear products on error
            setFilteredProducts([]); // Clear filtered products on error
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
                setFilteredProducts(response.data);
            } else {
                toast.error('Failed to load brand products: ' + response.message);
                setBrandProducts([]); // Clear products on error
                setFilteredProducts([]); // Clear filtered products on error
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading brand products:', error);
            toast.error('Failed to load brand products: ' + error.message);
            setBrandProducts([]); // Clear products on error
            setFilteredProducts([]); // Clear filtered products on error
            setLoading(false);
        }
    };

    // Function for fetching reel data for editing (removed related products loading)
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
                    selectedProducts: reelData.product_ids && reelData.product_ids.length > 0 ? reelData.product_ids : []
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
                
                // Removed related products loading
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

    // Removed loadRelatedProducts function

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUploadData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Removed related products loading when a product is selected
    };

    const handleFileChange = (e, fieldName) => {
        const file = e.target.files[0];
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
    };

    const handleAssociationTypeChange = (type) => {
        setUploadData(prev => ({
            ...prev,
            associationType: type,
            selectedBrand: '',
            selectedProducts: [] // Reset product selection
        }));
        
        // Clear products when changing association type
        setBrandProducts([]);
        // Removed clearing of related products
        
        // Load seller products if product type is selected
        if (type === 'product') {
            loadSellerProducts();
        }
    };

    const handleBrandChange = (brandId) => {
        setUploadData(prev => ({
            ...prev,
            selectedBrand: brandId,
            selectedProducts: [] // Reset product selection
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

    // Product search handler
    const handleProductSearch = (searchTerm) => {
        setProductSearchTerm(searchTerm);
        setShowProductDropdown(true);
        
        const productsToFilter = uploadData.associationType === 'brand' ? brandProducts : sellerProducts;
        if (searchTerm === '') {
            setFilteredProducts(productsToFilter);
        } else {
            const filtered = productsToFilter.filter(product => 
                product.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    };

    // Handle product selection from searchable dropdown
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
        setProductSearchTerm('');
        setShowProductDropdown(false);
    };

    // Handle focus on product search input
    const handleProductSearchFocus = () => {
        setShowProductDropdown(true);
        const productsToFilter = uploadData.associationType === 'brand' ? brandProducts : sellerProducts;
        setFilteredProducts(productsToFilter);
    };

    // Function to remove a selected product
    const handleProductRemove = (productId) => {
        setUploadData(prev => ({
            ...prev,
            selectedProducts: prev.selectedProducts.filter(id => id !== productId)
        }));
    };

    // Removed handleRelatedProductSelection function

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!uploadData.title || !uploadData.category || 
            !uploadData.associationType || 
            (uploadData.associationType === 'brand' && !uploadData.selectedBrand) ||
            !uploadData.selectedProducts || uploadData.selectedProducts.length === 0 ||
            uploadData.selectedProducts.length > 3) {
            toast.error('Please fill in all required fields');
            return;
        }
        if (uploadData.category === 'other' && !newCategoryName.trim()) {
            toast.error('Please enter a category name');
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
                    formData.append('associationType', uploadData.associationType || 'product');
                    if (uploadData.category === 'other' && newCategoryName.trim()) {
                        formData.append('otherCategoryName', newCategoryName.trim());
                    }
                    
                    if (uploadData.associationType === 'product') {
                        // Get vendor ID from authenticated user
                        const user = JSON.parse(localStorage.getItem('studioUser'));
                        const vendorId = user?.vendor_id || '';
                        formData.append('selectedSeller', vendorId);
                    } else if (uploadData.associationType === 'brand' && uploadData.selectedBrand) {
                        formData.append('selectedBrand', uploadData.selectedBrand || '');
                    }
                    
                    // Send selected products as repeated fields for robust backend parsing
                    if (uploadData.selectedProducts && uploadData.selectedProducts.length > 0) {
                        uploadData.selectedProducts.forEach((id) => {
                            formData.append('selectedProducts', parseInt(id));
                        });
                    }
                    
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
                        associationType: uploadData.associationType || 'product',
                        selectedSeller: uploadData.associationType === 'product' ? (JSON.parse(localStorage.getItem('studioUser'))?.vendor_id || '') : '',
                        selectedBrand: uploadData.selectedBrand,
                        selectedProducts: uploadData.selectedProducts ? uploadData.selectedProducts.map(id => parseInt(id)) : [],
                        otherCategoryName: uploadData.category === 'other' ? newCategoryName.trim() : undefined
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
                formData.append('associationType', uploadData.associationType || 'product');
                if (uploadData.category === 'other' && newCategoryName.trim()) {
                    formData.append('otherCategoryName', newCategoryName.trim());
                }
                // For sellers, we need to specify selectedSeller as their own vendor ID
                if (uploadData.associationType === 'product') {
                    // Get vendor ID from authenticated user
                    const user = JSON.parse(localStorage.getItem('studioUser'));
                    const vendorId = user?.vendor_id || '';
                    formData.append('selectedSeller', vendorId);
                } else if (uploadData.associationType === 'brand' && uploadData.selectedBrand) {
                    formData.append('selectedBrand', uploadData.selectedBrand || '');
                }
                if (uploadData.selectedProducts && uploadData.selectedProducts.length > 0) {
                    uploadData.selectedProducts.forEach((id) => {
                        formData.append('selectedProducts', parseInt(id));
                    });
                }
                
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
                
                console.log('Sending form data:', {
                    title: uploadData.title,
                    category: uploadData.category,
                    associationType: uploadData.associationType,
                    selectedBrand: uploadData.selectedBrand,
                    selectedProducts: uploadData.selectedProducts
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
            videoDuration: 0,
            video_url: '',
            thumbnail_url: '',
            associationType: '',
            selectedBrand: '',
            selectedProducts: []
        });
        setSellerProducts([]);
        setBrandProducts([]);
        // Reset searchable dropdown states
        setFilteredProducts([]);
        setProductSearchTerm('');
        setShowProductDropdown(false);
        // Removed resetting of related products
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
                // Load product names if there are product IDs
                if (response.data.product_ids && response.data.product_ids.length > 0) {
                    await loadProductNames(response.data.product_ids);
                }
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

    const loadProductNames = async (productIds) => {
        try {
            const response = await ApiService.getProductNamesByIds(productIds);
            
            if (response.success) {
                setProductNames(response.data);
            } else {
                toast.error('Failed to load product names: ' + response.message);
            }
        } catch (error) {
            console.error('Error loading product names:', error);
            toast.error('Failed to load product names: ' + error.message);
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
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="page-title-box d-flex align-items-center justify-content-between py-3">
                            <h4 className="mb-0">Reel Details</h4>
                            <button className="btn btn-secondary" onClick={handleCancel}>
                                <i className="mdi mdi-arrow-left me-1"></i>Back
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header bg-primary text-white">
                                <h5 className="mb-0">{viewingReel.title}</h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    {/* Reel Information Section */}
                                    <div className="col-lg-6 mb-4">
                                        <div className="card h-100">
                                            <div className="card-header">
                                                <h6 className="mb-0">Reel Information</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="table-responsive">
                                                    <table className="table table-bordered">
                                                        <tbody>
                                                            <tr>
                                                                <td className="fw-bold">Title</td>
                                                                <td>{viewingReel.title}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fw-bold">Description</td>
                                                                <td>{viewingReel.description || 'No description provided'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fw-bold">Category</td>
                                                                <td>{viewingReel.category_name || 'Not categorized'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fw-bold">Status</td>
                                                                <td>
                                                                    <span className={`badge ${viewingReel.status === 'approved' ? 'bg-success' : viewingReel.status === 'pending' ? 'bg-warning' : 'bg-danger'}`}>
                                                                        {viewingReel.status?.charAt(0).toUpperCase() + viewingReel.status?.slice(1) || 'Unknown'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fw-bold">Uploaded On</td>
                                                                <td>{new Date(viewingReel.created_at).toLocaleDateString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'long',
                                                                    day: 'numeric'
                                                                })}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fw-bold">Association</td>
                                                                <td>{viewingReel.brand_id ? `Brand: ${brands.find(b => b.id == viewingReel.brand_id)?.name || viewingReel.brand_id}` : 'Product'}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fw-bold">Views</td>
                                                                <td>{viewingReel.views || 0}</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="fw-bold">Likes</td>
                                                                <td>{viewingReel.likes || 0}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Video Preview Section - Moved to Right Side */}
                                    <div className="col-lg-6 mb-4">
                                        <div className="card h-100">
                                            <div className="card-header">
                                                <h6 className="mb-0">Video Preview</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="ratio ratio-16x9 bg-dark rounded">
                                                    {viewingReel.video_url && viewingReel.video_url !== 'null' && viewingReel.video_url !== 'undefined' ? (
                                                        <div>
                                                            <video 
                                                                src={viewingReel.video_url} 
                                                                controls 
                                                                className="rounded"
                                                                poster={viewingReel.thumbnail || ''}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                playsInline
                                                                preload="metadata"
                                                                onError={(e) => {
                                                                    console.error('Video error:', e);
                                                                    console.log('Video URL that failed:', viewingReel.video_url);
                                                                }}
                                                                onLoadedData={(e) => {
                                                                    console.log('Video loaded successfully');
                                                                }}
                                                            >
                                                                <source src={viewingReel.video_url} type="video/mp4" />
                                                                Your browser does not support the video tag.
                                                            </video>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex align-items-center justify-content-center h-100">
                                                            <p className="m-0 text-white">No video available</p>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Thumbnail Preview */}
                                                {viewingReel.thumbnail && (
                                                    <div className="mt-3">
                                                        <h6 className="mb-2">Thumbnail</h6>
                                                        <div className="border rounded p-2 text-center">
                                                            <img 
                                                                src={viewingReel.thumbnail} 
                                                                alt="Thumbnail" 
                                                                className="img-fluid"
                                                                style={{ maxHeight: '150px' }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Associated Products Section */}
                                    <div className="col-12">
                                        <div className="card">
                                            <div className="card-header">
                                                <h6 className="mb-0">Associated Products ({viewingReel.product_ids?.length || 0})</h6>
                                            </div>
                                            <div className="card-body">
                                                {viewingReel.product_ids && viewingReel.product_ids.length > 0 ? (
                                                    <div className="table-responsive">
                                                        <table className="table table-striped table-bordered">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th scope="col">#</th>
                                                                    <th scope="col">Product ID</th>
                                                                    <th scope="col">Product Name</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {viewingReel.product_ids.map((productId, index) => (
                                                                    <tr key={index}>
                                                                        <th scope="row">{index + 1}</th>
                                                                        <td>{productId}</td>
                                                                        <td>{productNames[productId] || `Product #${productId}`}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="alert alert-info">
                                                        <i className="mdi mdi-information-outline me-1"></i>
                                                        No products associated with this reel
                                                    </div>
                                                )}
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

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="page-title-box d-flex align-items-center justify-content-between py-3">
                        <h4 className="mb-0">{editingReelId ? 'Edit Reel' : 'Upload Reels'}</h4>
                    </div>
                </div>

                <div className="col-12">
                    <div className="card">
                        <div className="card-header" style={{ backgroundColor: 'transparent' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">My Reels</h5>
                                {!editingReelId && !showUploadForm && (
                                    <button 
                                        className="btn btn-light"
                                        onClick={() => setShowUploadForm(true)}
                                    >
                                        <i className="mdi mdi-plus me-1"></i>
                                        Upload New Reel
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="card-body">
                            {showUploadForm || editingReelId ? (
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-8">
                                            <div className="mb-3">
                                                <label htmlFor="title" className="form-label">
                                                    Title
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
                                                    Category
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
                                                <option value="other">Other</option>
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
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

                                        {/* Association Type Selection - Appears after category is selected */}
                                        {uploadData.category && (
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Associate With
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
                                                    Select Brand
                                                </label>
                                                <small className="form-text text-muted mb-1">
                                                    Only one brand can be selected. After selecting a brand, you can choose up to 3 products from that brand.
                                                </small>
                                                <select
                                                    className="form-select"
                                                    value={uploadData.selectedBrand}
                                                    onChange={(e) => handleBrandChange(e.target.value)}
                                                    disabled={loading}
                                                >
                                                    <option value="">Select a brand</option>
                                                    {brands.map(brand => (
                                                        <option key={brand.id} value={brand.id}>
                                                            {brand.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {uploadData.selectedBrand && (
                                                    <div className="mt-2">
                                                        <span className="badge bg-primary">
                                                            Selected Brand: {brands.find(b => b.id == uploadData.selectedBrand)?.name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Product Selection - Appears based on association type */}
                                        {(uploadData.associationType === 'product' && sellerProducts.length > 0) || 
                                         (uploadData.associationType === 'brand' && uploadData.selectedBrand && brandProducts.length > 0) ? (
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Select Product
                                                </label>
                                                <div className="position-relative">
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Search products from selected brand (max 3)..."
                                                        value={productSearchTerm}
                                                        onChange={(e) => handleProductSearch(e.target.value)}
                                                        onFocus={handleProductSearchFocus}
                                                        onBlur={() => {
                                                            // Delay hiding dropdown to allow for clicks
                                                            setTimeout(() => setShowProductDropdown(false), 200);
                                                        }}
                                                        disabled={loading}
                                                    />
                                                    {showProductDropdown && (
                                                        <div className="position-absolute w-100 mt-1" style={{zIndex: 1000, maxHeight: '200px', overflowY: 'auto'}}>
                                                            <ul className="list-group">
                                                                {filteredProducts
                                                                    .filter(product => !uploadData.selectedProducts.includes(product.product_id || product.id))
                                                                    .map(product => (
                                                                        <li 
                                                                            key={product.product_id || product.id} 
                                                                            className="list-group-item list-group-item-action"
                                                                            style={{ cursor: 'pointer' }}
                                                                            onMouseDown={() => handleProductSelect(product)} // Use onMouseDown to prevent blur
                                                                        >
                                                                            {product.name} ({product.model})
                                                                        </li>
                                                                    ))}
                                                                {filteredProducts.length === 0 && (
                                                                    <li className="list-group-item text-muted">
                                                                        No products found
                                                                    </li>
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                                <small className="form-text text-muted">
                                                    Search products from the selected brand and click on them to select. You can select up to 3 products.
                                                </small>
                                                {/* Selected Products Display */}
                                                {uploadData.selectedProducts.length > 0 && (
                                                    <div className="mb-2">
                                                        <div className="d-flex flex-wrap gap-2">
                                                            {uploadData.selectedProducts.map((productId) => (
                                                                <span key={productId} className="badge bg-primary d-flex align-items-center">
                                                                    {uploadData.associationType === 'product' 
                                                                        ? sellerProducts.find(p => p.product_id == productId)?.name || 'Unknown'
                                                                        : brandProducts.find(p => p.id == productId)?.name || 'Unknown'
                                                                    }
                                                                    <button 
                                                                        type="button" 
                                                                        className="btn-close btn-close-white ms-2" 
                                                                        aria-label="Remove"
                                                                        onClick={() => handleProductRemove(productId)}
                                                                        style={{fontSize: '0.5rem'}}
                                                                    ></button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
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

                                        {/* Removed Related Products Section */}
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
                                                {editingReelId ? 'Replace Video' : 'Video'}
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

                                <div className="d-flex gap-2">
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
                            <>
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <form className="mb-3 p-3 border rounded">
                                            <div className="row g-3 align-items-end">
                                                <div className="col-md-3">
                                                    <label className="form-label">Title</label>
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        placeholder="Filter by title"
                                                        value={filters.title || ''}
                                                        onChange={(e) => setFilters({...filters, title: e.target.value})}
                                                    />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label">Category</label>
                                                    <select
                                                        className="form-select"
                                                        value={filters.category || ''}
                                                        onChange={(e) => setFilters({...filters, category: e.target.value})}
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
                                                    <label className="form-label">Created Date</label>
                                                    <input
                                                        type="date"
                                                        className="form-control"
                                                        value={filters.date || ''}
                                                        onChange={(e) => setFilters({...filters, date: e.target.value})}
                                                    />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="form-label">Status</label>
                                                    <select
                                                        className="form-select"
                                                        value={filters.status || ''}
                                                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                                                    >
                                                        <option value="">All Status</option>
                                                        <option value="approved">Approved</option>
                                                        <option value="pending">Pending</option>
                                                        <option value="rejected">Rejected</option>
                                                    </select>
                                                </div>
                                                <div className="col-md-2 d-flex align-items-end">
                                                    <div className="d-flex gap-2 w-100">
                                                        <button 
                                                            type="button"
                                                            className="btn btn-outline-secondary btn-sm flex-fill"
                                                            onClick={handleClearFilter}
                                                        >
                                                            Clear
                                                        </button>
                                                        <button 
                                                            type="button"
                                                            className="btn btn-primary btn-sm flex-fill"
                                                            onClick={handleFilter}
                                                        >
                                                            Filter
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
                                                                <td>
                                                                    <span className="badge bg-primary">
                                                                        {reel.product_ids && Array.isArray(reel.product_ids) ? reel.product_ids.length : 0}
                                                                    </span>
                                                                </td>
                                                                <td>{new Date(reel.created_at).toLocaleDateString()}</td>
                                                                <td>
                                                                    <div className="d-flex gap-1 justify-content-end">
                                                                        <button 
                                                                            className="btn btn-outline-primary btn-sm"
                                                                            onClick={() => handleViewReel(reel)}
                                                                            title="View"
                                                                        >
                                                                            <i className="ri-eye-line"></i>
                                                                        </button>
                                                                        <button 
                                                                            className="btn btn-outline-warning btn-sm"
                                                                            onClick={() => handleEditReel(reel)}
                                                                            title="Edit"
                                                                        >
                                                                            <i className="ri-edit-line"></i>
                                                                        </button>
                                                                        <button 
                                                                            className="btn btn-outline-danger btn-sm"
                                                                            onClick={() => handleDeleteReel(reel.id)}
                                                                            title="Delete"
                                                                        >
                                                                            <i className="ri-delete-bin-line"></i>
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
}
