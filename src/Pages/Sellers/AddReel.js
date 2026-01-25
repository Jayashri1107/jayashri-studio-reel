import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
 
import './AddReel.css';

export default function AddReel() {
    const navigate = useNavigate();
    const location = useLocation();
    const fileInputRef = useRef(null);
    const thumbnailInputRef = useRef(null);
    const productDropdownRef = useRef(null);
    const productInputRef = useRef(null);
    const [formData, setFormData] = useState({
        seller: '',
        title: '',
        description: '',
        category: '',
        associatedWith: '', // Will store 'product' or 'brand'
        videoUrl: '',
        thumbnail: '',
        videoDuration: 0,
        selectedProducts: [], // Changed to array for multiple product selection (max 3)
        selectedBrand: '' // For storing selected brand when associated with brand
    });
    
    // State for sellers dropdown
    const [sellers, setSellers] = useState([]);
    const [loadingSellers, setLoadingSellers] = useState(true);
    
    // State for categories dropdown
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    
    // State for showing new category input
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    
    // State for products dropdown (when associated with product)
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [showProductsDropdown, setShowProductsDropdown] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showProductDropdown, setShowProductDropdown] = useState(false);
    
    // State for brands dropdown (when associated with brand)
    const [brands, setBrands] = useState([]);
    const [loadingBrands, setLoadingBrands] = useState(false);
    const [showBrandsDropdown, setShowBrandsDropdown] = useState(false);
    
    // Upload states
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Fetch sellers and categories when component mounts
    useEffect(() => {
        fetchSellers();
        fetchCategories();
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, []);

    // Filter products based on search query
    useEffect(() => {
        if (products.length > 0) {
            if (productSearchQuery.trim()) {
                const filtered = products.filter(product => {
                    const name = (product.name || product.model || '').toLowerCase();
                    const query = productSearchQuery.toLowerCase();
                    return name.includes(query);
                });
                setFilteredProducts(filtered);
            } else {
                // Show all products when no search query
                setFilteredProducts(products);
            }
        } else {
            setFilteredProducts([]);
        }
    }, [productSearchQuery, products]);

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

    
    // vaishanvi start - Prefill form when editing an admin reel
    useEffect(() => {
        const reel = location.state?.reel;
        if (!reel) return;

        const assoc = reel.association_type === 'brand' ? 'brand' : 'product';
        setFormData(prev => ({
            ...prev,
            seller: reel.seller_id ? String(reel.seller_id) : '',
            title: reel.title || '',
            description: reel.description || '',
            category: reel.category_id ? String(reel.category_id) : '',
            associatedWith: assoc,
            videoUrl: reel.video_url || '',
            thumbnail: reel.thumbnail_url || '',
            selectedProducts: reel.product_id ? [String(reel.product_id)] : [],
            selectedBrand: reel.brand_id ? String(reel.brand_id) : ''
        }));

        if (assoc === 'product') {
            setShowProductsDropdown(true);
            setShowBrandsDropdown(false);
            if (reel.seller_id) {
                fetchProducts(reel.seller_id);
            }
        } else {
            setShowBrandsDropdown(true);
            setShowProductsDropdown(false);
            fetchBrands();
        }
    }, [location.state]);
    // vaishanvi end - Prefill form when editing an admin reel

    // Fetch sellers from API
    const fetchSellers = async () => {
        try {
            setLoadingSellers(true);
            const response = await ApiService.getAllSellers();
            
            if (response.success) {
                setSellers(response.data);
            } else {
                toast.error('Failed to load sellers: ' + response.message);
                setSellers([]);
            }
        } catch (error) {
            console.error('Error fetching sellers:', error);
            toast.error('Failed to load sellers');
            setSellers([]);
        } finally {
            setLoadingSellers(false);
        }
    };

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            const response = await ApiService.getAllCategories();
            
            if (response.success) {
                // Filter only active categories (status === 1)
                const activeCategories = Array.isArray(response.data) 
                    ? response.data.filter(cat => cat.status === 1 || cat.status === '1' || cat.status === true) 
                    : [];
                setCategories(activeCategories);
            } else {
                toast.error('Failed to load categories: ' + response.message);
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to load categories');
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    };

    // Fetch products for a specific seller
    const fetchProducts = async (sellerId) => {
        if (!sellerId) return;
        
        try {
            setLoadingProducts(true);
            const response = await ApiService.getSellerProducts(parseInt(sellerId));
            
            if (response.success) {
                setProducts(response.data);
                setProductSearchQuery('');
                setShowProductDropdown(false);
            } else {
                toast.error('Failed to load products: ' + response.message);
                setProducts([]);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
            setProducts([]);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Fetch products for a specific brand
    const fetchBrandProducts = async (brandId) => {
        if (!brandId) return;
        try {
            setLoadingProducts(true);
            const response = await ApiService.getBrandProducts(brandId);
            if (response.success) {
                setProducts(response.data || []);
                setShowProductsDropdown(true);
                setProductSearchQuery('');
                setShowProductDropdown(false);
            } else {
                toast.error('Failed to load products: ' + response.message);
                setProducts([]);
                setShowProductsDropdown(false);
            }
        } catch (error) {
            console.error('Error fetching brand products:', error);
            toast.error('Failed to load products');
            setProducts([]);
            setShowProductsDropdown(false);
        } finally {
            setLoadingProducts(false);
        }
    };

    // Fetch all brands
    const fetchBrands = async () => {
        try {
            setLoadingBrands(true);
            const response = await ApiService.getAllBrands();
            
            if (response.success) {
                setBrands(response.data);
            } else {
                toast.error('Failed to load brands: ' + response.message);
                setBrands([]);
            }
        } catch (error) {
            console.error('Error fetching brands:', error);
            toast.error('Failed to load brands');
            setBrands([]);
        } finally {
            setLoadingBrands(false);
        }
    };

    // Handle form input changes
    const [titleError, setTitleError] = useState('');
    const cleanTitle = (raw) => {
        let s = String(raw || '');
        s = s.replace(/\s+/g, ' ').trim();
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
        if (/^\s|\s$/.test(raw)) return { isValid: false, value: cleaned, message: 'Title must not start or end with a space' };
        if (/\s{2,}/.test(raw)) return { isValid: false, value: cleaned, message: 'Use only one space between words' };
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
        
        // If category is changed to "other", show new category input
        if (name === 'category' && value === 'other') {
            setShowNewCategoryInput(true);
        } else if (name === 'category' && value !== 'other') {
            setShowNewCategoryInput(false);
            setNewCategoryName('');
        }
        
        // If seller is changed and we're associating with product, fetch products
        if (name === 'seller' && formData.associatedWith === 'product' && value) {
            fetchProducts(parseInt(value));
            setShowProductsDropdown(true);
            setProductSearchQuery('');
            setShowProductDropdown(false);
        }

        // When a brand is selected, fetch its products
        if (name === 'selectedBrand' && value) {
            fetchBrandProducts(value);
            setProductSearchQuery('');
            setShowProductDropdown(false);
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
                // The dropdown will close when clicking outside
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

    // Handle new category name change
    const handleNewCategoryChange = (e) => {
        setNewCategoryName(e.target.value);
    };

    // Handle radio button changes for associatedWith
    const handleRadioChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            associatedWith: value
        }));
        
        // Clear search query
        setProductSearchQuery('');
        setShowProductDropdown(false);
        
        // If switching to product and a seller is already selected, fetch products
        if (value === 'product' && formData.seller) {
            fetchProducts(parseInt(formData.seller));
            setShowProductsDropdown(true);
            setShowBrandsDropdown(false);
        } 
        // If switching to brand, fetch brands
        else if (value === 'brand') {
            fetchBrands();
            setShowBrandsDropdown(true);
            setShowProductsDropdown(false);
            setProducts([]);
            // Clear selected products when switching to brand
            setFormData(prev => ({
                ...prev,
                selectedProducts: [],
                selectedBrand: ''
            }));
        }
    };

    // Trigger file input click
    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    // Handle file selection
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('video/')) {
            toast.error('Please select a valid video file');
            e.target.value = '';
            return;
        }

        // Validate file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            toast.error('File size exceeds 100MB limit');
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
            
            // Store video duration in form data
            setFormData(prev => ({
                ...prev,
                videoDuration: duration,
                videoUrl: url // Keep preview URL for display
            }));
            
            toast.success('Video selected successfully!');
        };
        
        vid.onerror = () => {
            URL.revokeObjectURL(url);
            toast.error('Unable to read video metadata');
            e.target.value = '';
        };
    };

    // Handle thumbnail selection
    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowed = ['image/jpeg', 'image/png'];
        if (!allowed.includes(file.type)) {
            toast.error('Please select a JPG or PNG image');
            return;
        }

        // Validate thumbnail size (max 1MB)
        if (file.size > 1 * 1024 * 1024) {
            toast.error('Thumbnail file size exceeds 1MB limit');
            e.target.value = '';
            return;
        }

        // For the form submission, we'll use the actual file from the input ref
        // Set a preview URL for display purposes
        const previewUrl = URL.createObjectURL(file);
        setFormData(prev => ({
            ...prev,
            thumbnail: previewUrl
        }));
        
        toast.success('Thumbnail selected');
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate required fields
        if (!formData.seller || !formData.category) {
            toast.error('Please fill in all required fields');
            return;
        }

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
        
        // Validate association type
        if (!formData.associatedWith) {
            toast.error('Please select association type (Product or Brand)');
            return;
        }
        
        // Validate seller selection for product association
        if (formData.associatedWith === 'product' && !formData.seller) {
            toast.error('Please select a seller for product association');
            return;
        }
        
        // Validate brand selection for brand association
        if (formData.associatedWith === 'brand' && !formData.selectedBrand) {
            toast.error('Please select a brand for brand association');
            return;
        }
        
        // Check if video file is selected
        if (!fileInputRef.current || !fileInputRef.current.files[0]) {
            toast.error('Please select a video file');
            return;
        }
        
        // Validate video duration
        if (formData.videoDuration && formData.videoDuration > 30) {
            toast.error('Video must be 30 seconds or less');
            return;
        }
        
        // Validate "other" category name if selected
        if (formData.category === 'other' && !newCategoryName.trim()) {
            toast.error('Please enter a category name');
            return;
        }
        
        try {
            // Validate video file exists
            if (!fileInputRef.current) {
                toast.error('Video input not found');
                return;
            }
            
            if (!fileInputRef.current.files || fileInputRef.current.files.length === 0) {
                toast.error('Please select a video file');
                return;
            }
            
            const videoFile = fileInputRef.current.files[0];
            
            if (!videoFile) {
                toast.error('Video file is invalid');
                return;
            }
            
            console.log('Video file selected:', {
                name: videoFile.name,
                size: videoFile.size,
                type: videoFile.type,
                lastModified: videoFile.lastModified
            });
            
            // Create FormData object for file upload
            const formDataObj = new FormData();
            
            // Append text fields
            formDataObj.append('title', cleanedTitle);
            formDataObj.append('description', formData.description || '');
            formDataObj.append('category', formData.category);
            formDataObj.append('associationType', formData.associatedWith);
            
            // Append other category name if category is "other"
            if (formData.category === 'other' && newCategoryName.trim()) {
                formDataObj.append('otherCategoryName', newCategoryName.trim());
            }
            
            // Append seller or brand based on association type
            // Note: seller is required for both product and brand associations (database constraint)
            if (formData.associatedWith === 'product') {
                formDataObj.append('selectedSeller', formData.seller);
                // Append multiple products
                if (formData.selectedProducts && formData.selectedProducts.length > 0) {
                    formData.selectedProducts.forEach(productId => {
                        formDataObj.append('selectedProducts', parseInt(productId));
                    });
                }
            } else if (formData.associatedWith === 'brand') {
                // For brand associations, still send seller if available
                // If seller is not selected, we'll need to handle it on backend
                if (formData.seller) {
                    formDataObj.append('selectedSeller', formData.seller);
                }
                formDataObj.append('selectedBrand', formData.selectedBrand);
                // Append multiple products
                if (formData.selectedProducts && formData.selectedProducts.length > 0) {
                    formData.selectedProducts.forEach(productId => {
                        formDataObj.append('selectedProducts', parseInt(productId));
                    });
                }
            }
            
            // Validate that at least one product is selected
            if (!formData.selectedProducts || formData.selectedProducts.length === 0) {
                toast.error('Please select at least one product');
                return;
            }
            
            // Append video file - MUST be appended as 'video' to match backend expectation
            formDataObj.append('video', videoFile);
            
            // Append video duration if available
            if (formData.videoDuration) {
                formDataObj.append('videoDuration', String(formData.videoDuration));
            }
            
            // Append thumbnail if selected
            if (thumbnailInputRef.current && thumbnailInputRef.current.files && thumbnailInputRef.current.files[0]) {
                formDataObj.append('thumbnail', thumbnailInputRef.current.files[0]);
            }
            
            // Debug: Log FormData contents
            console.log('FormData being sent:');
            for (const [key, value] of formDataObj.entries()) {
                if (value instanceof File) {
                    console.log(`${key}: File - ${value.name}, size: ${value.size} bytes, type: ${value.type}`);
                } else {
                    console.log(`${key}: ${value}`);
                }
            }
            
            setUploading(true);
            const saveResponse = await ApiService.uploadSellerReel(formDataObj);
            setUploading(false);
            
            if (saveResponse.success) {
                toast.success('Reel saved successfully');
                navigate('/sellers/reels');
            } else {
                toast.error('Failed to save reel: ' + (saveResponse.message || 'Unknown error'));
            }
        } catch (error) {
            setUploading(false);
            console.error('Error saving reel:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            toast.error('Failed to save reel: ' + (error.message || 'Unknown error'));
        }
    };

    return (
        <div className="container-fluid">
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex align-items-center justify-content-between">
                            <div>
                                <h4 className="card-title mb-0">Add New Reel</h4>
                            </div>
                         <button 
                            className="btn btn-secondary" 
                            onClick={() => navigate(-1)}
                        >
                            <i className="ri-arrow-left-line me-1"></i> Back
                        </button>
                        </div>
                        <div className="card-body">
                            <div className="mb-4 p-3 border rounded bg-body text-body">
                            <form onSubmit={handleSubmit}>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-normal">Seller *</label>
                                        {loadingSellers ? (
                                            <select className="form-select bg-body text-body" disabled>
                                                <option>Loading sellers...</option>
                                            </select>
                                        ) : (
                                            <select
                                                className="form-select bg-body text-body"
                                                name="seller"
                                                value={formData.seller}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select a Seller</option>
                                                {sellers.map(seller => {
                                                    const id = seller.vendor_id ?? seller.id;
                                                    const name = seller.name ?? `${seller.firstname || ''} ${seller.lastname || ''}`.trim();
                                                    return (
                                                        <option key={id} value={id}>
                                                            {name || `Seller #${id}`}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        )}
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
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
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-normal">Category *</label>
                                        {loadingCategories ? (
                                            <select className="form-select bg-body text-body" disabled>
                                                <option>Loading categories...</option>
                                            </select>
                                        ) : (
                                            <select
                                                className="form-select bg-body text-body"
                                                name="category"
                                                value={formData.category}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="">Select a category</option>
                                                {categories.map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                                <option value="other">Other</option>
                                            </select>
                                        )}
                                        {showNewCategoryInput && (
                                            <div className="mt-2">
                                                <input
                                                    type="text"
                                                    className="form-control bg-body text-body"
                                                    placeholder="Enter new category name"
                                                    value={newCategoryName}
                                                    onChange={handleNewCategoryChange}
                                                    required={showNewCategoryInput}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-normal">Description</label>
                                        <textarea
                                            className="form-control bg-body text-body"
                                            rows="3"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Enter reel description"
                                        />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-normal">Thumbnail</label>
                                        <input
                                            type="file"
                                            className="form-control bg-body text-body"
                                            ref={thumbnailInputRef}
                                            onChange={handleThumbnailChange}
                                            accept="image/png, image/jpeg"
                                        />
                                        <small className="text-body">JPG, PNG formats allowed. Recommended size: 1280x720. Max size: 1MB</small>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-normal">Video *</label>
                                        <div className="d-flex align-items-center gap-2">
                                            <input
                                                type="file"
                                                className="form-control bg-body text-body"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                accept="video/*"
                                            />
                                        </div>
                                        <small className="text-body">MP4, MOV, AVI formats allowed. Max size: 100MB</small>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-normal">Associate With *</label>
                                        <div className="d-flex gap-4">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="associatedWith"
                                                    id="associatedWithProduct"
                                                    value="product"
                                                    checked={formData.associatedWith === 'product'}
                                                    onChange={handleRadioChange}
                                                    required
                                                />
                                                <label className="form-check-label fw-normal" htmlFor="associatedWithProduct">
                                                    Product
                                                </label>
                                            </div>
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="radio"
                                                    name="associatedWith"
                                                    id="associatedWithBrand"
                                                    value="brand"
                                                    checked={formData.associatedWith === 'brand'}
                                                    onChange={handleRadioChange}
                                                    required
                                                />
                                                <label className="form-check-label fw-normal" htmlFor="associatedWithBrand">
                                                    Brand
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Product selection - shown when products are available */}
                                {showProductsDropdown && (
                                    <div className="row">
                                        <div className="col-md-12 mb-3">
                                            <label className="form-label fw-normal">
                                                Products {formData.associatedWith === 'product' || formData.associatedWith === 'brand' ? '*' : ''} 
                                                <small className="text-body ms-2">(Select up to 3 products)</small>
                                            </label>
                                            
                                            {/* Selected Products as Tags */}
                                            {formData.selectedProducts && formData.selectedProducts.length > 0 && (
                                                <div className="d-flex flex-wrap gap-2 mb-2">
                                                    {formData.selectedProducts.map(productId => {
                                                        const product = products.find(p => String(p.product_id ?? p.id) === productId);
                                                        const productName = product ? (product.name || product.model || 'Unknown Product') : '';
                                                        return product ? (
                                                            <span 
                                                                key={productId}
                                                                className="badge bg-primary d-inline-flex align-items-center gap-2 px-2 py-1"
                                                                style={{ 
                                                                    fontSize: '0.875rem',
                                                                    maxWidth: '300px',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}
                                                                title={productName}
                                                            >
                                                                <span style={{ 
                                                                    maxWidth: '250px',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    whiteSpace: 'nowrap'
                                                                }}>
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
                                                        if (products.length > 0) {
                                                            setShowProductDropdown(true);
                                                        }
                                                    }}
                                                    onClick={() => {
                                                        // Open dropdown when clicking on input
                                                        if (products.length > 0 && !loadingProducts) {
                                                            // Ensure filteredProducts is set
                                                            if (filteredProducts.length === 0 && products.length > 0) {
                                                                setFilteredProducts(products);
                                                            }
                                                            setShowProductDropdown(true);
                                                        }
                                                    }}
                                                    onFocus={() => {
                                                        // Always show dropdown when focusing if there are products
                                                        if (products.length > 0 && !loadingProducts) {
                                                            // Ensure filteredProducts is set
                                                            if (filteredProducts.length === 0 && products.length > 0) {
                                                                setFilteredProducts(products);
                                                            }
                                                            setShowProductDropdown(true);
                                                        }
                                                    }}
                                                    disabled={loadingProducts || (formData.selectedProducts && formData.selectedProducts.length >= 3)}
                                                />
                                                
                                                {/* Dropdown with filtered products */}
                                                {showProductDropdown && products.length > 0 && (
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
                                                        {(filteredProducts.length > 0 ? filteredProducts : products)
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
                                                                        className="dropdown-item"
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
                                                                        {product.name || product.model || 'Unknown Product'}
                                                                    </button>
                                                                );
                                                            })}
                                                        {(filteredProducts.length > 0 ? filteredProducts : products).filter(p => {
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
                                            
                                            {!loadingProducts && products.length === 0 && (
                                                <div className="text-muted small mt-2">No products available</div>
                                            )}
                                            
                                            <div className="form-text mt-2">
                                                Search products and click on them to select. You can select up to 3 products.
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* Brand dropdown - shown only when associated with brand */}
                                {showBrandsDropdown && (
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-normal">Brand</label>
                                            {loadingBrands ? (
                                                <select className="form-select bg-body text-body" disabled>
                                                    <option>Loading brands...</option>
                                                </select>
                                            ) : (
                                                <select 
                                                    className="form-select bg-body text-body"
                                                    name="selectedBrand"
                                                    value={formData.selectedBrand}
                                                    onChange={handleInputChange}
                                                    required={formData.associatedWith === 'brand'}
                                                >
                                                    <option value="">Select a Brand</option>
                                                    {brands.map(brand => (
                                                        <option key={brand.id} value={brand.id}>
                                                            {brand.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="d-flex justify-content-end mt-4">
                                    <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/sellers/reels')}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={uploading}>
                                        {uploading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <i className="ri-upload-2-line me-1"></i>
                                                Upload Reel
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
