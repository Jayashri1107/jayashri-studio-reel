import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import VideoModal from '../../Components/VideoModal';
import './AddBrandReel.css';

export default function AddBrandReel() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const fileInputRef = useRef(null);
    const thumbnailInputRef = useRef(null);
    const productDropdownRef = useRef(null);
    const productInputRef = useRef(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: '',
        brand: '',
        videoFile: null,
        thumbnailFile: null,
        videoDuration: 0,
        selectedProducts: [] // Changed to array of product IDs (strings)
    });
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [titleError, setTitleError] = useState('');
    
    // State for brands dropdown
    const [brands, setBrands] = useState([]);
    const [loadingBrands, setLoadingBrands] = useState(true);
    
    // State for brand products
    const [brandProducts, setBrandProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    
    // State for categories dropdown
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    
    // State for showing new category input
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    
    // Fetch brands and categories when component mounts
    useEffect(() => {
        fetchBrands();
        fetchCategories();
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    // Fetch products when brand is selected
    useEffect(() => {
        if (formData.brand) {
            fetchBrandProducts(formData.brand);
        } else {
            setBrandProducts([]);
            setFormData(prev => ({ ...prev, selectedProducts: [] }));
        }
    }, [formData.brand]);
    
    // Handle clicks outside dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                productDropdownRef.current &&
                productInputRef.current &&
                !productDropdownRef.current.contains(event.target) &&
                !productInputRef.current.contains(event.target)
            ) {
                setShowProductDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);
    
    // Filter products based on search query
    useEffect(() => {
        if (brandProducts.length > 0) {
            if (productSearchQuery.trim()) {
                const filtered = brandProducts.filter(product => {
                    const name = (product.name || product.model || '').toLowerCase();
                    const query = productSearchQuery.toLowerCase();
                    return name.includes(query);
                });
                setFilteredProducts(filtered);
            } else {
                // Show all products when no search query
                setFilteredProducts(brandProducts);
            }
        } else {
            setFilteredProducts([]);
        }
    }, [productSearchQuery, brandProducts]);
    

    // Store product IDs from edit mode to populate later
    const [editProductIds, setEditProductIds] = useState([]);
    const [loadingReelData, setLoadingReelData] = useState(false);
    const [existingVideoUrl, setExistingVideoUrl] = useState(null);
    const [existingThumbnailUrl, setExistingThumbnailUrl] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState(null);
    const [showVideoModal, setShowVideoModal] = useState(false);
    
    // Fetch reel data when in edit mode
    useEffect(() => {
        if (id) {
            setIsEditMode(true);
            
            // Reset state first to prevent stale data
            setFormData({
                title: '',
                description: '',
                category: '',
                brand: '',
                videoFile: null,
                thumbnailFile: null,
                videoDuration: 0,
                selectedProducts: []
            });
            setExistingVideoUrl(null);
            setExistingThumbnailUrl(null);
            setEditProductIds([]);
            
            // Try to get reel from location.state first
            const reel = location.state?.reel;
            if (reel) {
                setFormData(prev => ({
                    ...prev,
                    brand: reel.brand_id || '',
                    title: reel.title || '',
                    description: reel.description || '',
                    category: reel.category_id || ''
                }));
                
                // Store existing video URL if available
                if (reel.video_url) {
                    setExistingVideoUrl(reel.video_url);
                }
                
                // Store existing thumbnail URL if available
                if (reel.thumbnail || reel.thumbnail_url) {
                    setExistingThumbnailUrl(reel.thumbnail || reel.thumbnail_url);
                }
                
                // Store product IDs to populate after products are fetched
                if (reel.product_ids && Array.isArray(reel.product_ids)) {
                    setEditProductIds(reel.product_ids);
                } else if (reel.product_id) {
                    setEditProductIds([reel.product_id]);
                }
            } else {
                // Fetch reel data from API if not in location.state
                fetchReelData();
            }
        }
    }, [id, location.state]);
    
    // Fetch reel data for editing
    const fetchReelData = async () => {
        if (!id) return;
        
        try {
            setLoadingReelData(true);
            const response = await ApiService.getReelById(id);
            
            if (response.success && response.data) {
                const reel = response.data;
                setFormData(prev => ({
                    ...prev,
                    brand: reel.brand_id || '',
                    title: reel.title || '',
                    description: reel.description || '',
                    category: reel.category_id || ''
                }));
                
                // Store existing video URL if available
                if (reel.video_url) {
                    setExistingVideoUrl(reel.video_url);
                }
                
                // Store existing thumbnail URL if available
                if (reel.thumbnail || reel.thumbnail_url) {
                    setExistingThumbnailUrl(reel.thumbnail || reel.thumbnail_url);
                }
                
                // Store product IDs to populate after products are fetched
                if (reel.product_ids && Array.isArray(reel.product_ids)) {
                    setEditProductIds(reel.product_ids);
                } else if (reel.product_id) {
                    setEditProductIds([reel.product_id]);
                }
            } else {
                toast.error('Failed to load reel data');
            }
        } catch (error) {
            console.error('Error fetching reel data:', error);
            toast.error('Failed to load reel data: ' + error.message);
        } finally {
            setLoadingReelData(false);
        }
    };
    
    // Populate selected products when brand products are loaded and we have edit product IDs
    useEffect(() => {
        if (editProductIds.length > 0 && brandProducts.length > 0) {
            const productIdsToAdd = editProductIds
                .map(pid => {
                    const product = brandProducts.find(p => String(p.id || p.product_id) === String(pid));
                    return product ? String(product.id || product.product_id) : null;
                })
                .filter(Boolean);
            
            if (productIdsToAdd.length > 0) {
                setFormData(prev => ({ ...prev, selectedProducts: productIdsToAdd }));
                setEditProductIds([]); // Clear to prevent re-populating
            }
        }
    }, [editProductIds, brandProducts]);

    // Fetch all brands
    const fetchBrands = async () => {
        try {
            console.log('Fetching brands...');
            setLoadingBrands(true);
            const response = await ApiService.getAllBrands();
            
            if (response.success) {
                console.log('Brands fetched successfully:', response.data);
                setBrands(response.data);
            } else {
                console.error('Failed to load brands:', response.message);
                toast.error('Failed to load brands: ' + response.message);
                setBrands([]);
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
            toast.error('Failed to load brands: ' + (error.message || 'Unknown error'));
            setBrands([]);
        } finally {
            setLoadingBrands(false);
        }
    };

    // Fetch products for selected brand
    const fetchBrandProducts = async (brandId) => {
        if (!brandId) {
            setBrandProducts([]);
            setFormData(prev => ({ ...prev, selectedProducts: [] }));
            return;
        }
        
        try {
            setLoadingProducts(true);
            const response = await ApiService.getBrandProducts(brandId);
            
            if (response.success) {
                setBrandProducts(response.data || []);
            } else {
                toast.error('Failed to load products: ' + response.message);
                setBrandProducts([]);
            }
        } catch (error) {
            console.error('Error fetching brand products:', error);
            toast.error('Failed to load products');
            setBrandProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            console.log('Fetching categories...');
            setLoadingCategories(true);
            const response = await ApiService.getAllCategories();
            
            if (response.success) {
                console.log('Categories fetched successfully:', response.data);
                // Filter only active categories (status === 1)
                const activeCategories = Array.isArray(response.data) 
                    ? response.data.filter(cat => cat.status === 1 || cat.status === '1' || cat.status === true) 
                    : [];
                setCategories(activeCategories);
            } else {
                console.error('Failed to load categories:', response.message);
                toast.error('Failed to load categories: ' + response.message);
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories: ' + (error.message || 'Unknown error'));
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    };

    // Handle form input changes
    const cleanTitle = (raw) => {
        let s = String(raw || '');
        s = s.replace(/[^A-Za-z0-9 \-_&@#]/g, '');
        const matches = s.match(/[-_&@#]/g) || [];
        if (matches.length > 1) {
            const firstIdx = s.search(/[-_&@#]/);
            s = s.slice(0, firstIdx + 1) + s.slice(firstIdx + 1).replace(/[-_&@#]/g, '');
        }
        s = s.replace(/^[-_&@#]+/, '').replace(/[-_&@#]+$/, '');
        const midIdx = s.search(/[-_&@#]/);
        if (midIdx !== -1) {
            const prev = s[midIdx - 1];
            const next = s[midIdx + 1];
            if (!/[A-Za-z0-9]/.test(prev || '') || !/[A-Za-z0-9]/.test(next || '')) {
                s = s.slice(0, midIdx) + s.slice(midIdx + 1);
            }
        }
        return s;
    };
    const validateTitleStrict = (raw) => {
        const cleaned = cleanTitle(raw);
        if (!cleaned) return { isValid: false, value: '', message: 'Title is required' };
        if (!/[A-Za-z0-9]/.test(cleaned)) return { isValid: false, value: cleaned, message: 'Title must include letters or numbers' };
        if (/[^A-Za-z0-9 \-_&@#]/.test(raw)) return { isValid: false, value: cleaned, message: 'Only letters, numbers, spaces, and one special (- _ & @ #) allowed' };
        const specials = raw.match(/[-_&@#]/g) || [];
        if (specials.length > 1) return { isValid: false, value: cleaned, message: 'Only one special character allowed' };
        const idx = raw.search(/[-_&@#]/);
        if (idx !== -1) {
            if (idx === 0 || idx === raw.length - 1) return { isValid: false, value: cleaned, message: 'Special character not allowed at start or end' };
            const prev = raw[idx - 1];
            const next = raw[idx + 1];
            if (!/[A-Za-z0-9]/.test(prev) || !/[A-Za-z0-9]/.test(next)) return { isValid: false, value: cleaned, message: 'Special character must be between letters or numbers' };
        }
        return { isValid: true, value: cleaned };
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;
        if (name === 'title') {
            const check = validateTitleStrict(value);
            setFormData(prev => ({ ...prev, title: check.value }));
            setTitleError(check.isValid ? '' : check.message);
            return;
        }
        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));
        
        // If brand is changed, reset product selection
        if (name === 'brand') {
            setFormData(prev => ({ ...prev, selectedProducts: [] }));
            setProductSearchQuery('');
            setShowProductDropdown(false);
        }
        
        // If category is changed to "other", show new category input
        if (name === 'category' && value === 'other') {
            setShowNewCategoryInput(true);
        } else if (name === 'category' && value !== 'other') {
            setShowNewCategoryInput(false);
            setNewCategoryName('');
        }
    };

    // Handle product selection (multiple products support)
    const handleProductSelect = (productId) => {
        const productIdStr = String(productId);
        setFormData(prev => {
            const currentProducts = prev.selectedProducts || [];
            const isSelected = currentProducts.includes(productIdStr);
            
            if (isSelected) {
                // Remove product if already selected
                return {
                    ...prev,
                    selectedProducts: currentProducts.filter(id => id !== productIdStr)
                };
            } else {
                // Add product (max 3)
                if (currentProducts.length >= 3) {
            toast.warn('You can select maximum 3 products');
                    return prev;
                }
                // Clear search query after selection but keep dropdown ready to open
        setProductSearchQuery('');
                // Don't close dropdown immediately - let user continue selecting
                return {
                    ...prev,
                    selectedProducts: [...currentProducts, productIdStr]
                };
            }
        });
    };
    
    // Handle product removal
    const handleProductRemove = (productId) => {
        setFormData(prev => ({
            ...prev,
            selectedProducts: (prev.selectedProducts || []).filter(id => id !== String(productId))
        }));
    };

    // Handle file selection
    const handleFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file size (100MB limit for videos, 5MB for thumbnails)
        if (type === 'videoFile' && file.size > 100 * 1024 * 1024) {
            toast.error('Video file size exceeds 100MB limit');
            e.target.value = '';
            return;
        }
        
        if (type === 'thumbnailFile' && file.size > 1 * 1024 * 1024) {
            toast.error('Thumbnail file size exceeds 1MB limit');
            e.target.value = '';
            return;
        }
        
        // For video files, calculate duration and validate
        if (type === 'videoFile') {
            // Validate file type
            if (!file.type.startsWith('video/')) {
                toast.error('Please select a valid video file');
                e.target.value = '';
                return;
            }
            
            // Calculate video duration
            const url = URL.createObjectURL(file);
            const vid = document.createElement('video');
            vid.preload = 'metadata';
            vid.src = url;
            
            vid.onloadedmetadata = () => {
                URL.revokeObjectURL(url);
                const duration = vid.duration || 0;
                
                // Validate duration (max 30 seconds for reels)
                if (duration > 30.0) {
                    toast.error('Video must be 30 seconds or less');
                    e.target.value = '';
            return;
        }
        
                // Store video duration and file
                setFormData(prev => ({
                    ...prev,
                    videoFile: file,
                    videoDuration: duration
                }));
                
                // Clear existing video URL when new video is selected
                setExistingVideoUrl(null);
                
                toast.success('Video selected successfully!');
            };
            
            vid.onerror = () => {
                URL.revokeObjectURL(url);
                toast.error('Unable to read video metadata');
                e.target.value = '';
            };
        } else {
            // For thumbnails, just store the file and create preview
            if (type === 'thumbnailFile') {
        setFormData(prev => ({
            ...prev,
            [type]: file
        }));
                
                // Clear existing thumbnail URL when new thumbnail is selected
                setExistingThumbnailUrl(null);
                
                // Create preview for new thumbnail
                const reader = new FileReader();
                reader.onloadend = () => {
                    setThumbnailPreview(reader.result);
                };
                reader.readAsDataURL(file);
            } else {
                setFormData(prev => ({
                    ...prev,
                    [type]: file
                }));
            }
        
        toast.info(`${type === 'videoFile' ? 'Video' : 'Thumbnail'} selected: ${file.name}`);
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        const titleCheck = validateTitleStrict(formData.title);
        if (!titleCheck.isValid) {
            setTitleError(titleCheck.message);
            toast.error(titleCheck.message);
            return;
        }
        const cleanedTitle = titleCheck.value;
        if (cleanedTitle.length > 255) {
            toast.error('Title must be 255 characters or fewer');
            return;
        }
        
        if (!formData.category) {
            toast.error('Please select a category');
            return;
        }
        
        if (!formData.brand) {
            toast.error('Please select a brand');
            return;
        }
        
        if (!formData.selectedProducts || formData.selectedProducts.length === 0) {
            toast.error('Please select at least one product');
            return;
        }
        
        if (!isEditMode && !formData.videoFile) {
            toast.error('Please select a video file');
            return;
        }
        
        try {
            setUploading(true);
            // Create FormData object for file uploads
            const uploadData = new FormData();
            
            // Ensure category is not empty - if 'other', still send it
            const categoryValue = formData.category || '';
            uploadData.append('title', cleanedTitle);
            uploadData.append('description', formData.description || '');
            uploadData.append('category', categoryValue);
            // Only append category_id if it's not 'other' and not empty
            if (categoryValue !== 'other' && categoryValue) {
                uploadData.append('category_id', categoryValue);
            }
            uploadData.append('brand_id', formData.brand || '');
            
            // Send multiple product IDs
            if (formData.selectedProducts && formData.selectedProducts.length > 0) {
                const productIds = formData.selectedProducts;
                uploadData.append('product_ids', JSON.stringify(productIds));
                uploadData.append('product_id', productIds[0]); // First product for backward compatibility
                productIds.forEach((productId, index) => {
                    uploadData.append(`product_ids[${index}]`, productId);
                });
            }
            if (formData.category === 'other' && newCategoryName) {
                uploadData.append('other_category_name', newCategoryName);
            }
            if (formData.videoFile) {
                uploadData.append('video', formData.videoFile);
                // Append video duration if available
                if (formData.videoDuration) {
                    uploadData.append('video_duration', String(formData.videoDuration));
                }
            }
            
            if (formData.thumbnailFile) {
                uploadData.append('thumbnail', formData.thumbnailFile);
            }
            
            // Create or edit brand reel
            let response;
            if (isEditMode && id) {
                response = await ApiService.editBrandReel(id, uploadData);
            } else {
                response = await ApiService.uploadBrandReel(uploadData);
            }
            if (response && response.success) {
                toast.success(isEditMode ? 'Brand reel updated successfully!' : 'Brand reel saved successfully!');
                navigate('/brands/reels');
            } else {
                toast.error('Failed to save brand reel: ' + (response?.message || 'Unknown error'));
            }
        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Unknown error';
            console.error('Error saving brand reel:', message);
            toast.error('Failed to save brand reel: ' + message);
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
                            <h4 className="card-title mb-0">{isEditMode ? 'Edit Brand Reel' : 'Add Brand Reel'}</h4>
                        </div>
                        <button 
                            className="btn btn-outline-secondary" 
                            onClick={() => navigate('/brands/reels')}
                        >
                            <i className="ri-arrow-left-line align-bottom me-1"></i> Back
                        </button>
                    </div>
                    <div className="card-body">
                        {loadingReelData ? (
                            <div className="text-center py-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Loading reel data...</span>
                                </div>
                                <p className="text-body mb-0">Loading reel data...</p>
                            </div>
                        ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-md-8">
                                    <div className="card bg-body border-0 shadow-none">
                                        <div className="card-body p-0">
                                            <div className="mb-3">
                                                <label className="form-label fw-normal">Title *</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-body text-body"
                                                    name="title"
                                                    value={formData.title}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter reel title"
                                                    maxLength={255}
                                                    required
                                                />
                                                {titleError && (
                                                    <div className="form-text text-danger">{titleError}</div>
                                                )}
                                            </div>

                                            <div className="row">
                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-normal">Category *</label>
                                                    <select
                                                        className="form-select bg-body text-body"
                                                        name="category"
                                                        value={formData.category}
                                                        onChange={handleInputChange}
                                                        disabled={loadingCategories}
                                                        required
                                                    >
                                                        <option value="">Select Category</option>
                                                        {categories.map(category => (
                                                            <option key={category.id} value={category.id}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                        <option value="other">Other</option>
                                                    </select>
                                                    {loadingCategories && <div className="text-body mb-0">Loading categories...</div>}
                                                    {showNewCategoryInput && (
                                                        <input
                                                            type="text"
                                                            className="form-control bg-body text-body mt-2"
                                                            placeholder="Enter new category name"
                                                            value={newCategoryName}
                                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                                        />
                                                    )}
                                                </div>

                                                <div className="col-md-6 mb-3">
                                                    <label className="form-label fw-normal">Brand *</label>
                                                    <select
                                                        className="form-select bg-body text-body"
                                                        name="brand"
                                                        value={formData.brand}
                                                        onChange={handleInputChange}
                                                        disabled={loadingBrands}
                                                        required
                                                    >
                                                        <option value="">Select a Brand</option>
                                                        {brands.map(brand => (
                                                            <option key={brand.id} value={brand.id}>
                                                                {brand.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {loadingBrands && <div className="text-body mb-0">Loading brands...</div>}
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-normal">Description</label>
                                                <textarea
                                                    className="form-control bg-body text-body"
                                                    name="description"
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter reel description"
                                                    rows="3"
                                                />
                                            </div>

                                            {/* Product Selection - shown when brand is selected */}
                                            {formData.brand && (
                                                <div className="mb-3">
                                                    <label className="form-label fw-normal">
                                                        Products *
                                                        <small className="text-body ms-2">(Select up to 3 products)</small>
                                                    </label>
                                                    
                                                    {/* Selected Products as Tags */}
                                                    {formData.selectedProducts && formData.selectedProducts.length > 0 && (
                                                        <div className="d-flex flex-wrap gap-2 mb-2">
                                                            {formData.selectedProducts.map(productId => {
                                                                const product = brandProducts.find(p => String(p.product_id ?? p.id) === productId);
                                                                const productName = product ? (product.name || product.model || 'Unknown Product') : '';
                                                                return product ? (
                                                                <span 
                                                                        key={productId}
                                                                        className="badge bg-primary d-inline-flex align-items-center gap-2 px-2 py-1"
                                                                        style={{ 
                                                                            fontSize: '0.875rem',
                                                                            maxWidth: '100%',
                                                                            whiteSpace: 'normal',
                                                                            textAlign: 'left'
                                                                        }}
                                                                        title={productName}
                                                                    >
                                                                        <span className="text-truncate" style={{ maxWidth: '200px' }}>
                                                                            {productName}
                                                                        </span>
                                                                    <button
                                                                        type="button"
                                                                        className="btn-close btn-close-white"
                                                                            style={{ fontSize: '0.7rem', flexShrink: 0 }}
                                                                            onClick={() => handleProductRemove(productId)}
                                                                        aria-label="Remove"
                                                                    ></button>
                                                                </span>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}
                                                    
                                                    {/* Product Search Input */}
                                                    <div className="position-relative" ref={productDropdownRef}>
                                                        <input
                                                            ref={productInputRef}
                                                            type="text"
                                                            className="form-control bg-body text-body"
                                                            placeholder="Search and select products (max 3)..."
                                                            value={productSearchQuery}
                                                            onChange={(e) => {
                                                                setProductSearchQuery(e.target.value);
                                                                // Show dropdown when typing
                                                                if (brandProducts.length > 0) {
                                                                    setShowProductDropdown(true);
                                                                }
                                                            }}
                                                            onClick={() => {
                                                                // Open dropdown when clicking on input
                                                                if (brandProducts.length > 0 && !loadingProducts) {
                                                                    // Ensure filteredProducts is set
                                                                    if (filteredProducts.length === 0 && brandProducts.length > 0) {
                                                                        setFilteredProducts(brandProducts);
                                                                    }
                                                                    setShowProductDropdown(true);
                                                                }
                                                            }}
                                                            onFocus={() => {
                                                                // Always show dropdown when focusing if there are products
                                                                if (brandProducts.length > 0 && !loadingProducts) {
                                                                    // Ensure filteredProducts is set
                                                                    if (filteredProducts.length === 0 && brandProducts.length > 0) {
                                                                        setFilteredProducts(brandProducts);
                                                                    }
                                                                    setShowProductDropdown(true);
                                                                }
                                                            }}
                                                            disabled={loadingProducts || (formData.selectedProducts && formData.selectedProducts.length >= 3)}
                                                        />
                                                        
                                                        {/* Dropdown with filtered products */}
                                                        {showProductDropdown && brandProducts.length > 0 && (
                                                            <div 
                                                                className="dropdown-menu show w-100 position-absolute border"
                                                                style={{ 
                                                                    zIndex: 1050, 
                                                                    maxHeight: '300px', 
                                                                    overflowY: 'auto',
                                                                    top: '100%',
                                                                    marginTop: '2px'
                                                                }}
                                                                onMouseDown={(e) => e.preventDefault()}
                                                            >
                                                                {(filteredProducts.length > 0 ? filteredProducts : brandProducts)
                                                                    .filter(p => {
                                                                        const pid = String(p.product_id ?? p.id);
                                                                        return !formData.selectedProducts || !formData.selectedProducts.includes(pid);
                                                                    })
                                                                    .map((product) => {
                                                                        const pid = product.product_id ?? product.id;
                                                                        return (
                                                                            <button
                                                                                key={pid}
                                                                                type="button"
                                                                                className="dropdown-item py-2 border-bottom"
                                                                                onMouseDown={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                }}
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    handleProductSelect(pid);
                                                                                }}
                                                                            >
                                                                                <div className="fw-medium">{product.name || product.model || 'Unknown Product'}</div>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                {(filteredProducts.length > 0 ? filteredProducts : brandProducts).filter(p => {
                                                                    const pid = String(p.product_id ?? p.id);
                                                                    return !formData.selectedProducts || !formData.selectedProducts.includes(pid);
                                                                }).length === 0 && (
                                                                    <div className="dropdown-item text-muted">
                                                                        No products available or all products selected
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {loadingProducts && (
                                                        <div className="text-muted small mt-2">Loading products...</div>
                                                    )}
                                                    
                                                    {!loadingProducts && brandProducts.length === 0 && (
                                                        <div className="text-muted small mt-2">No products available</div>
                                                    )}
                                                    
                                                    <div className="form-text mt-2">
                                                        Search products and click on them to select. You can select up to 3 products.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="col-md-4">
                                    <div className="card bg-light border-0">
                                        <div className="card-body">
                                            <h6 className="card-title mb-3 fw-bold">Media</h6>
                                            
                                            <div className="mb-4">
                                                <label className="form-label fw-normal">Video *</label>
                                                {isEditMode && existingVideoUrl && !formData.videoFile && (
                                                    <div className="mb-3">
                                                        <div className="d-flex align-items-center gap-2 mb-2">
                                                            <span className="text-body mb-0">Current video:</span>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-primary"
                                                                onClick={() => setShowVideoModal(true)}
                                                            >
                                                                <i className="ri-eye-line me-1"></i> View Video
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    className="form-control bg-body text-body"
                                                    accept="video/*"
                                                    onChange={(e) => handleFileSelect(e, 'videoFile')}
                                                    ref={fileInputRef}
                                                />
                                                <div className="form-text small">
                                                    {isEditMode && existingVideoUrl ? 'Upload new to replace' : 'Max size: 100MB'}
                                                </div>
                                            </div>

                                            <div className="mb-3">
                                                <label className="form-label fw-normal">Thumbnail</label>
                                                {(isEditMode && existingThumbnailUrl && !formData.thumbnailFile) || thumbnailPreview ? (
                                                    <div className="mb-3">
                                                        <div className="mb-2">
                                                            <span className="text-muted small d-block mb-2">
                                                                {thumbnailPreview ? 'Preview:' : 'Current:'}
                                                            </span>
                                                            <div className="border rounded p-2 d-inline-block bg-white text-center w-100">
                                                                <img 
                                                                    src={thumbnailPreview || existingThumbnailUrl} 
                                                                    alt="Thumbnail" 
                                                                    className="img-fluid rounded"
                                                                    style={{ maxHeight: '200px' }}
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        const errorDiv = e.target.parentElement.querySelector('.thumbnail-error');
                                                                        if (errorDiv) errorDiv.style.display = 'block';
                                                                    }}
                                                                />
                                                                <div className="thumbnail-error" style={{ display: 'none', padding: '10px', color: '#6c757d' }}>
                                                                    No Image
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null}
                                                <input
                                                    type="file"
                                                    className="form-control bg-body text-body"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileSelect(e, 'thumbnailFile')}
                                                    ref={thumbnailInputRef}
                                                />
                                                <div className="form-text small">
                                                    {isEditMode && existingThumbnailUrl ? 'Upload new to replace' : 'Max size: 1MB'}
                                                </div>
                                                {formData.thumbnailFile && (
                                                    <div className="mt-2">
                                                        <span className="text-body small">Selected: {formData.thumbnailFile.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="d-flex justify-content-end mt-4">
                                <button 
                                    type="submit" 
                                    className="btn btn-success"
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            {isEditMode ? 'Updating...' : 'Uploading...'}
                                        </>
                                    ) : (
                                        isEditMode ? 'Update Reel' : 'Upload Reel'
                                    )}
                                </button>
                            </div>
                        </form>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Video Modal */}
            {showVideoModal && existingVideoUrl && (
                <VideoModal
                    show={showVideoModal}
                    videoUrl={existingVideoUrl}
                    onClose={() => setShowVideoModal(false)}
                    size="lg"
                />
            )}
        </div>
    );
}
