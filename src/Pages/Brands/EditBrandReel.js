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
    const [titleError, setTitleError] = useState('');
    
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
        if (name === 'title') {
            const check = validateTitleStrict(value);
            setFormData(prev => ({ ...prev, title: check.value }));
            setTitleError(check.isValid ? '' : check.message);
            return;
        }
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
        
        if (!formData.category) {
            toast.error('Please select a category');
            return;
        }
        
        try {
            // Create FormData object for file uploads
            const uploadData = new FormData();
            const categoryId = formData.category === 'other' ? '' : formData.category;
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
            uploadData.append('title', cleanedTitle);
            uploadData.append('description', formData.description);
            uploadData.append('category', formData.category);
            uploadData.append('category_id', categoryId);
            uploadData.append('brand_id', formData.brand);
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
                    <button className="btn btn-outline-secondary" onClick={() => navigate('/brands/reels')}>
                        <i className="ri-arrow-left-line align-bottom me-1"></i> Back
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
                            className="btn btn-outline-secondary" 
                            onClick={() => navigate('/brands/reels')}
                        >
                            <i className="ri-arrow-left-line align-bottom me-1"></i> Back
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
                                    {titleError && (
                                        <div className="form-text text-danger">{titleError}</div>
                                    )}
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
