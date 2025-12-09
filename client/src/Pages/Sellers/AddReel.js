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
    const [formData, setFormData] = useState({
        seller: '',
        title: '',
        description: '',
        category: '',
        associatedWith: '', // Will store 'product' or 'brand'
        videoUrl: '',
        thumbnail: '',
        selectedProduct: '', // For storing selected product when associated with product
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
            selectedProduct: reel.product_id ? String(reel.product_id) : '',
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
                setCategories(response.data);
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
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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
        }

        // When a brand is selected, fetch its products
        if (name === 'selectedBrand' && value) {
            fetchBrandProducts(value);
        }
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
            // Clear selected product when switching to brand
            setFormData(prev => ({
                ...prev,
                selectedProduct: '',
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
            return;
        }

        // Validate file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
            toast.error('File size exceeds 100MB limit');
            return;
        }

        // For the form submission, we'll use the actual file from the input ref
        // Set a preview URL for display purposes
        const previewUrl = URL.createObjectURL(file);
        setFormData(prev => ({
            ...prev,
            videoUrl: previewUrl
        }));
        
        toast.success('Video selected successfully!');
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
        if (!formData.seller || !formData.title || !formData.category) {
            toast.error('Please fill in all required fields');
            return;
        }
        
        // Check if video file is selected
        if (!fileInputRef.current || !fileInputRef.current.files[0]) {
            toast.error('Please select a video file');
            return;
        }
        
        // If "Other" is selected and new category name is provided, create the category
        if (formData.category === 'other' && newCategoryName.trim()) {
            try {
                const response = await ApiService.createCategory(newCategoryName.trim());
                if (response.success) {
                    toast.success(`New category "${newCategoryName}" created successfully`);
                    // Refresh categories list
                    await fetchCategories();
                    // Update form data to use the new category ID
                    setFormData(prev => ({
                        ...prev,
                        category: response.data.id.toString()
                    }));
                } else {
                    toast.error('Failed to create category: ' + response.message);
                    return;
                }
            } catch (error) {
                console.error('Error creating category:', error);
                toast.error('Failed to create category');
                return;
            }
        }
        
        try {
            // Create FormData object for file upload
            const formDataObj = new FormData();
            
            // Append text fields
            formDataObj.append('title', formData.title);
            formDataObj.append('description', formData.description);
            formDataObj.append('category', formData.category);
            formDataObj.append('associationType', formData.associatedWith);
            
            // Append seller or brand based on association type
            if (formData.associatedWith === 'product') {
                formDataObj.append('selectedSeller', formData.seller);
                if (formData.selectedProduct) {
                    formDataObj.append('selectedProducts', formData.selectedProduct);
                }
            } else if (formData.associatedWith === 'brand') {
                formDataObj.append('selectedBrand', formData.selectedBrand);
                if (formData.selectedProduct) {
                    formDataObj.append('selectedProducts', formData.selectedProduct);
                }
            }
            
            // Append actual files
            if (fileInputRef.current && fileInputRef.current.files[0]) {
                formDataObj.append('video', fileInputRef.current.files[0]);
            }
            
            if (thumbnailInputRef.current && thumbnailInputRef.current.files[0]) {
                formDataObj.append('thumbnail', thumbnailInputRef.current.files[0]);
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
            toast.error('Failed to save reel');
        }
    };

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Add New Reel</h4>
                        </div>
                        <button 
                            className="btn btn-secondary" 
                            onClick={() => navigate('/sellers/reels')}
                        >
                            <i className="ri-arrow-left-line me-1"></i> 
                            Back to Reels
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
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-normal">Title *</label>
                                        <input
                                            type="text"
                                            className="form-control bg-body text-body"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="Enter reel title"
                                            required
                                        />
                                    </div>
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
                                        <small className="text-muted">MP4, MOV, AVI formats allowed. Max size: 100MB</small>
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
                                            required
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
                                        <small className="text-muted">JPG, PNG formats allowed. Recommended size: 1280x720</small>
                                    </div>
                                </div>
                                <div className="row">
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
                                {/* Product dropdown - shown when products are available */}
                                {showProductsDropdown && (
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-normal">Product</label>
                                            {loadingProducts ? (
                                                <select className="form-select bg-body text-body" disabled>
                                                    <option>Loading products...</option>
                                                </select>
                                            ) : (
                                                <select 
                                                    className="form-select bg-body text-body"
                                                    name="selectedProduct"
                                                    value={formData.selectedProduct}
                                                    onChange={handleInputChange}
                                                    required={formData.associatedWith === 'product' || formData.associatedWith === 'brand'}
                                                >
                                                    <option value="">Select a Product</option>
                                                    {products.map(product => {
                                                        const pid = product.product_id ?? product.id;
                                                        return (
                                                            <option key={pid} value={pid}>
                                                                {product.name}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                            )}
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
                                {formData.videoUrl && (
                                    <div className="alert alert-info mt-2">
                                        <strong>Video URL:</strong> <a href={formData.videoUrl} target="_blank" rel="noopener noreferrer">{formData.videoUrl}</a>
                                    </div>
                                )}
                                <div className="d-flex justify-content-end mt-4">
                                    <button type="button" className="btn btn-secondary me-2" onClick={() => navigate('/sellers/reels')}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        <i className="ri-upload-2-line me-1"></i>
                                        Upload Reel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
