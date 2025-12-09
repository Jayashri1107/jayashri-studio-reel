import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from '../../Services/ApiService';

export default function InfluencerUpload() {
    const navigate = useNavigate();
    const [uploadData, setUploadData] = useState({
        title: '',
        description: '',
        category: '',
        video: null,
        thumbnail: null,
        associationType: '', // 'seller' or 'brand'
        selectedSeller: '',
        selectedBrand: '',
        selectedProducts: []
    });
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [brands, setBrands] = useState([]);
    const [sellerProducts, setSellerProducts] = useState([]);
    const [brandProducts, setBrandProducts] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [reels, setReels] = useState([]);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [editingReelId, setEditingReelId] = useState(null);

    useEffect(() => {
        console.log('Component mounted, initializing data loading...');
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Load initial data
        loadCategories();
        loadReels();
    }, []);

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

    const loadSellers = async () => {
        if (sellers.length > 0) return; // Already loaded
        
        try {
            console.log('Loading sellers...');
            setLoading(true);
            const response = await ApiService.getSellers();
            console.log('Sellers response:', response);
            if (response.success) {
                setSellers(response.data);
                console.log('Sellers loaded:', response.data);
            } else {
                toast.error('Failed to load sellers: ' + response.message);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading sellers:', error);
            toast.error('Failed to load sellers: ' + error.message);
            setLoading(false);
        }
    };

    const loadBrands = async () => {
        if (brands.length > 0) return; // Already loaded
        
        try {
            console.log('Loading brands...');
            setLoading(true);
            const response = await ApiService.getBrands();
            console.log('Brands response:', response);
            if (response.success) {
                setBrands(response.data);
                console.log('Brands loaded:', response.data);
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

    const loadSellerProducts = async (vendorId) => {
        try {
            console.log('Loading seller products for vendorId:', vendorId);
            setLoading(true);
            const response = await ApiService.getSellerProducts(vendorId);
            console.log('Seller products response:', response); // Debug log
            if (response.success) {
                setSellerProducts(response.data);
                console.log('Seller products loaded:', response.data);
            } else {
                toast.error('Failed to load seller products: ' + response.message);
                setSellerProducts([]); // Clear products on error
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading seller products:', error);
            toast.error('Failed to load seller products: ' + error.message);
            setSellerProducts([]); // Clear products on error
            setLoading(false);
        }
    };

    const loadBrandProducts = async (brandId) => {
        try {
            console.log('Loading brand products for brandId:', brandId);
            setLoading(true);
            const response = await ApiService.getBrandProducts(brandId);
            console.log('Brand products response:', response); // Debug log
            if (response.success) {
                setBrandProducts(response.data);
                console.log('Brand products loaded:', response.data);
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
    const loadRelatedProducts = async (selectedProductIds) => {
        try {
            setLoading(true);
            const response = await ApiService.getRelatedProducts(
                selectedProductIds,
                uploadData.associationType,
                uploadData.selectedSeller,
                uploadData.selectedBrand
            );
            
            if (response.success) {
                setRelatedProducts(response.data);
            } else {
                // If API fails, fall back to demo implementation
                console.log('API failed, using demo implementation');
                setTimeout(() => {
                    // For demo, we'll just use some of the existing products as "related"
                    let related = [];
                    if (uploadData.associationType === 'seller' && sellerProducts.length > 0) {
                        related = sellerProducts.filter(p => !selectedProductIds.includes(p.product_id)).slice(0, 3);
                    } else if (uploadData.associationType === 'brand' && brandProducts.length > 0) {
                        related = brandProducts.filter(p => !selectedProductIds.includes(p.id)).slice(0, 3);
                    }
                    
                    setRelatedProducts(related);
                    
                    if (related.length > 0) {
                        toast.info(`Found ${related.length} related products`);
                    }
                }, 500);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error loading related products:', error);
            // Fall back to demo implementation on error
            setTimeout(() => {
                // For demo, we'll just use some of the existing products as "related"
                let related = [];
                if (uploadData.associationType === 'seller' && sellerProducts.length > 0) {
                    related = sellerProducts.filter(p => !selectedProductIds.includes(p.product_id)).slice(0, 3);
                } else if (uploadData.associationType === 'brand' && brandProducts.length > 0) {
                    related = brandProducts.filter(p => !selectedProductIds.includes(p.id)).slice(0, 3);
                }
                
                setRelatedProducts(related);
                setLoading(false);
                
                if (related.length > 0) {
                    toast.info(`Found ${related.length} related products`);
                }
            }, 500);
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
        if (file) {
            setUploadData(prev => ({
                ...prev,
                [fieldName]: file
            }));
            console.log('Upload data after file selection:', { ...uploadData, [fieldName]: file });
        }
    };

    const handleAssociationTypeChange = (type) => {
        setUploadData(prev => ({
            ...prev,
            associationType: type,
            selectedSeller: '',
            selectedBrand: '',
            selectedProducts: []
        }));
        
        // Clear products when changing association type
        setSellerProducts([]);
        setBrandProducts([]);
        setRelatedProducts([]);
        
        // Load sellers or brands based on selection
        if (type === 'seller') {
            loadSellers();
        } else if (type === 'brand') {
            loadBrands();
        }
    };

    const handleSellerChange = (vendorId) => {
        setUploadData(prev => ({
            ...prev,
            selectedSeller: vendorId,
            selectedProducts: []
        }));
        
        // Clear brand products when selecting a seller
        setBrandProducts([]);
        setRelatedProducts([]);
        
        // Load seller products
        if (vendorId) {
            loadSellerProducts(vendorId);
        } else {
            setSellerProducts([]);
        }
    };

    const handleBrandChange = (brandId) => {
        setUploadData(prev => ({
            ...prev,
            selectedBrand: brandId,
            selectedProducts: []
        }));
        
        // Clear seller products when selecting a brand
        setSellerProducts([]);
        setRelatedProducts([]);
        
        // Load brand products
        if (brandId) {
            loadBrandProducts(brandId);
        } else {
            setBrandProducts([]);
        }
    };

    const handleProductSelection = (e) => {
        const selected = Array.from(
            e.target.selectedOptions,
            option => parseInt(option.value)
        );
        
        // Validate that max 3 products can be selected
        if (selected.length > 3) {
            toast.warn('You can select maximum 3 products');
            // Keep only the first 3 selected products
            const limitedSelection = selected.slice(0, 3);
            setUploadData(prev => ({
                ...prev,
                selectedProducts: limitedSelection
            }));
            
            // Fetch related products for the first 3 selected products
            loadRelatedProducts(limitedSelection);
        } else {
            setUploadData(prev => ({
                ...prev,
                selectedProducts: selected
            }));
            
            // Fetch related products when selection changes
            if (selected.length > 0) {
                loadRelatedProducts(selected);
            } else {
                setRelatedProducts([]);
            }
        }
    };

    const handleRelatedProductSelection = (productId) => {
        // Add related product to main selection (if not already selected and under limit)
        if (!uploadData.selectedProducts.includes(productId) && uploadData.selectedProducts.length < 3) {
            setUploadData(prev => ({
                ...prev,
                selectedProducts: [...prev.selectedProducts, productId]
            }));
        } else if (uploadData.selectedProducts.includes(productId)) {
            toast.warn('Product already selected');
        } else {
            toast.warn('You can select maximum 3 products');
        }
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
            sellerOrBrand: (uploadData.associationType === 'seller' && !!uploadData.selectedSeller) || 
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
            ((uploadData.associationType === 'seller' && uploadData.selectedSeller) || 
             (uploadData.associationType === 'brand' && uploadData.selectedBrand)) &&
            uploadData.selectedProducts && 
            uploadData.selectedProducts.length > 0 &&
            uploadData.selectedProducts.length <= 3;
        
        if (!isFormValid) {
            console.log('Form validation failed:', validationDetails);
            toast.error('Please fill in all required fields correctly');
            return;
        }

        setLoading(true);
        
        try {
            if (editingReelId) {
                // Edit existing reel (without file upload)
                const reelData = {
                    title: uploadData.title,
                    description: uploadData.description,
                    category: uploadData.category,
                    associationType: uploadData.associationType,
                    selectedSeller: uploadData.selectedSeller,
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
                formData.append('associationType', uploadData.associationType || '');
                formData.append('selectedSeller', uploadData.selectedSeller || '');
                formData.append('selectedBrand', uploadData.selectedBrand || '');
                formData.append('selectedProducts', JSON.stringify(uploadData.selectedProducts));
                
                // Add files if they exist
                if (uploadData.video) {
                    formData.append('video', uploadData.video);
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
            associationType: '',
            selectedSeller: '',
            selectedBrand: '',
            selectedProducts: []
        });
        setSellerProducts([]);
        setBrandProducts([]);
        setRelatedProducts([]);
        setEditingReelId(null);
    };

    const handleViewReel = (reel) => {
        // For now, just show a toast with reel details
        toast.info(`Viewing reel: ${reel.title}`);
        // In a full implementation, you might navigate to a view page or open a modal
    };

    const handleEditReel = async (reel) => {
        try {
            setLoading(true);
            
            // Fetch the full reel details
            const response = await ApiService.getReelById(reel.id);
            
            if (response.success) {
                const reelData = response.data;
                
                // Set the form data with the reel information
                setUploadData({
                    title: reelData.title,
                    description: reelData.description || '',
                    category: reelData.category_id || '',
                    video: null, // We don't need to preload the video file
                    thumbnail: null, // We don't need to preload the thumbnail
                    associationType: reelData.product_ids && reelData.product_ids.length > 0 ? 'seller' : 'brand', // Simplified logic
                    selectedSeller: '', // Would need to fetch this from backend
                    selectedBrand: '', // Would need to fetch this from backend
                    selectedProducts: reelData.product_ids || []
                });
                
                // Set editing mode
                setEditingReelId(reel.id);
                setShowUploadForm(true);
                
                toast.info('Editing reel: ' + reelData.title);
            } else {
                toast.error('Failed to load reel details: ' + response.message);
            }
            
            setLoading(false);
        } catch (error) {
            console.error('Error loading reel for edit:', error);
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

    // ... rest of the component code remains the same ...