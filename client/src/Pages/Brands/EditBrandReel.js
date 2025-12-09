import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';
import './AddBrandReel.css';

export default function EditBrandReel() {
    const navigate = useNavigate();
    const { id } = useParams();
    const fileInputRef = useRef(null);
    const thumbnailInputRef = useRef(null);
    const [formData, setFormData] = useState({
        brand: '',
        product: '',
        title: '',
        description: '',
        category: '',
        videoFile: null,
        thumbnailFile: null
    });
    
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
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch brands, categories, and reel data when component mounts
    useEffect(() => {
        Promise.all([
            fetchBrands(),
            fetchCategories()
        ]).then(() => {
            if (id) {
                fetchReelData();
            }
        });
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }, [id]);

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
            toast.error('Failed to load categories: ' + (error.message || 'Unknown error'));
            setCategories([]);
        } finally {
            setLoadingCategories(false);
        }
    };

    // Fetch reel data for editing
    const fetchReelData = async () => {
        try {
            setLoading(true);
            const response = await ApiService.getReelById(id);
            
            if (response.success) {
                const reelData = response.data;
                setFormData(prev => ({
                    ...prev,
                    brand: reelData.brand_id || '',
                    product: reelData.product_ids && reelData.product_ids.length > 0 ? reelData.product_ids[0] : '',
                    title: reelData.title || '',
                    description: reelData.description || '',
                    category: reelData.category_id || ''
                }));
                
                // Fetch products for the brand if brand_id exists
                if (reelData.brand_id) {
                    fetchBrandProducts(reelData.brand_id);
                }
            } else {
                setError(response.message || 'Failed to load reel data');
                toast.error(response.message || 'Failed to load reel data');
            }
        } catch (error) {
            console.error('Error fetching reel data:', error);
            setError('Failed to load reel data');
            toast.error('Failed to load reel data: ' + error.message);
        } finally {
            setLoading(false);
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
            
            // Edit brand reel
            const response = await ApiService.editBrandReel(id, uploadData);
            if (response && response.success) {
                toast.success('Brand reel updated successfully!');
                navigate('/brands/reels');
            } else {
                toast.error('Failed to update brand reel: ' + (response?.message || 'Unknown error'));
            }
        } catch (error) {
            const message = error?.response?.data?.message || error.message || 'Unknown error';
            console.error('Error updating brand reel:', message);
            toast.error('Failed to update brand reel: ' + message);
        }
    };

    if (loading) {
        return (
            <div className="container py-5">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container py-5">
                <div className="alert alert-danger">
                    <h4>Error</h4>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={() => navigate('/brands/reels')}>
                        Back to Brand Reels
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="row">
            <div className="col-12">
                <div className="card">
                    <div className="card-header d-flex align-items-center justify-content-between">
                        <div>
                            <h4 className="card-title mb-0">Edit Brand Reel</h4>
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
                                    <label className="form-label fw-normal">Video File</label>
                                    <input
                                        type="file"
                                        className="form-control bg-body text-body"
                                        accept="video/*"
                                        onChange={(e) => handleFileSelect(e, 'videoFile')}
                                        ref={fileInputRef}
                                    />
                                    <div className="form-text">Maximum file size: 100MB. Leave empty to keep current video.</div>
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
                                    <div className="form-text">Maximum file size: 5MB. Leave empty to keep current thumbnail.</div>
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
                                        Update Reel
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
