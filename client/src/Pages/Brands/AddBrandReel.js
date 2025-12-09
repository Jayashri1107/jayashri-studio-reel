import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import './AddBrandReel.css';

export default function AddBrandReel() {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const fileInputRef = useRef(null);
    const thumbnailInputRef = useRef(null);
    const [formData, setFormData] = useState({
        brand: '',
        product: '', // Add product field
        title: '',
        description: '',
        category: '',
        videoFile: null,
        thumbnailFile: null
    });
    const [isEditMode, setIsEditMode] = useState(false);
    
    // State for brands dropdown
    const [brands, setBrands] = useState([]);
    const [loadingBrands, setLoadingBrands] = useState(true);
    
    // State for products dropdown
    const [products, setProducts] = useState([]);
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

    // Prefill form when editing
    useEffect(() => {
        const reel = location.state?.reel;
        if (id && reel) {
            setIsEditMode(true);
            setFormData(prev => ({
                ...prev,
                brand: reel.brand_id || '',
                product: reel.product_id || '',
                title: reel.title || '',
                description: reel.description || '',
                category: reel.category_id || ''
            }));
            if (reel.brand_id) {
                fetchBrandProducts(reel.brand_id);
            }
        }
    }, [id, location.state]);

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
            setProducts([]);
            return;
        }
        
        try {
            setLoadingProducts(true);
            const response = await ApiService.getBrandProducts(brandId);
            
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

    // Fetch categories from API
    const fetchCategories = async () => {
        try {
            console.log('Fetching categories...');
            setLoadingCategories(true);
            const response = await ApiService.getAllCategories();
            
            if (response.success) {
                console.log('Categories fetched successfully:', response.data);
                setCategories(response.data);
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
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // If brand is changed, fetch products for that brand
        if (name === 'brand') {
            fetchBrandProducts(value);
            // Reset product selection when brand changes
            setFormData(prev => ({
                ...prev,
                product: ''
            }));
        }
        
        // If category is changed to "other", show new category input
        if (name === 'category' && value === 'other') {
            setShowNewCategoryInput(true);
        } else if (name === 'category' && value !== 'other') {
            setShowNewCategoryInput(false);
            setNewCategoryName('');
        }
    };

    // Handle file selection
    const handleFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validate file size (100MB limit for videos, 5MB for thumbnails)
        if (type === 'videoFile' && file.size > 100 * 1024 * 1024) {
            toast.error('Video file size exceeds 100MB limit');
            return;
        }
        
        if (type === 'thumbnailFile' && file.size > 5 * 1024 * 1024) {
            toast.error('Thumbnail file size exceeds 5MB limit');
            return;
        }
        
        // Store the actual file object
        setFormData(prev => ({
            ...prev,
            [type]: file
        }));
        
        toast.info(`${type === 'videoFile' ? 'Video' : 'Thumbnail'} selected: ${file.name}`);
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.brand) {
            toast.error('Please select a brand');
            return;
        }
        
        if (!formData.title) {
            toast.error('Please enter a title');
            return;
        }
        
        if (!formData.category) {
            toast.error('Please select a category');
            return;
        }
        
        if (!isEditMode && !formData.videoFile) {
            toast.error('Please select a video file');
            return;
        }
        
        try {
            // Create FormData object for file uploads
            const uploadData = new FormData();
            const categoryId = formData.category === 'other' ? '' : formData.category;
            uploadData.append('title', formData.title);
            uploadData.append('description', formData.description);
            uploadData.append('category', formData.category);
            uploadData.append('category_id', categoryId);
            uploadData.append('brandId', formData.brand);
            uploadData.append('brand_id', formData.brand);
            uploadData.append('productId', formData.product || '');
            uploadData.append('product_id', formData.product || '');
            if (formData.category === 'other' && newCategoryName) {
                uploadData.append('new_category_name', newCategoryName);
            }
            if (formData.videoFile) {
                uploadData.append('video', formData.videoFile);
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
                            className="btn btn-secondary" 
                            onClick={() => navigate('/brands/reels')}
                        >
                            <i className="ri-arrow-left-line me-1"></i> 
                            Back to Reels
                        </button>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row">
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
                                    {loadingBrands && <div className="text-muted small">Loading brands...</div>}
                                </div>
                                
                                {/* Product Selection - shown when brand is selected */}
                                {formData.brand && (
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-normal">Product</label>
                                        <select
                                            className="form-select bg-body text-body"
                                            name="product"
                                            value={formData.product}
                                            onChange={handleInputChange}
                                            disabled={loadingProducts}
                                        >
                                            <option value="">Select a Product (Optional)</option>
                                            {products.map(product => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name || product.model}
                                                </option>
                                            ))}
                                        </select>
                                        {loadingProducts && <div className="text-muted small">Loading products...</div>}
                                    </div>
                                )}
                                
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
                                        <option value="">Select a Category</option>
                                        {categories.map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                        <option value="other">Other (Specify)</option>
                                    </select>
                                    {loadingCategories && <div className="text-muted small">Loading categories...</div>}
                                    
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
                                
                                <div className="col-12 mb-3">
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
                                
                                <div className="col-12 mb-3">
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
                                
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-normal">Video File *</label>
                                    <input
                                        type="file"
                                        className="form-control bg-body text-body"
                                        accept="video/*"
                                        onChange={(e) => handleFileSelect(e, 'videoFile')}
                                        ref={fileInputRef}
                                    />
                                    <div className="form-text">Maximum file size: 100MB</div>
                                </div>
                                
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-normal">Thumbnail File</label>
                                    <input
                                        type="file"
                                        className="form-control bg-body text-body"
                                        accept="image/*"
                                        onChange={(e) => handleFileSelect(e, 'thumbnailFile')}
                                        ref={thumbnailInputRef}
                                    />
                                    <div className="form-text">Maximum file size: 5MB</div>
                                </div>
                            </div>
                            
                            <div className="d-flex justify-content-end mt-4">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary me-2" 
                                    onClick={() => navigate('/brands/reels')}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn btn-primary"
                                >
                                    <>
                                        <i className="ri-save-line me-1"></i>
                                        Save Reel
                                    </>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
