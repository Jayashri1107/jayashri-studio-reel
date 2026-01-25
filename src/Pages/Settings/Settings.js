import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../Config/axios';

export default function Settings() {
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState({
        // Platform Settings
        platformName: 'Admin Dashboard',
        platformOwnerName: '',
        ownerPhone: '',
        ownerEmail: '',
        fullAddress: '',
        zipCode: '',
        city: '',
        country: 'U.S.A',
        
        // General Settings
        metaTitle: '',
        metaTag: '',
        theme: 'Default',
        description: '',
        
        // Social Settings
        facebookUrl: '',
        instagramUrl: '',
        twitterUrl: '',
        websiteUrl: '',
        
        // Customer Settings
        customersOnline: true,
        customersActivity: true,
        customerSearches: true,
        guestCheckout: false,
        loginDisplayPrice: false,
        
        // Categories Settings
        categoryProductCount: true,
        defaultItemsPerPage: 10,
        
        // Reviews Settings
        allowReviews: true,
        allowGuestReviews: false
    });

    useEffect(() => {
        if (window.lucide) {
            window.lucide.createIcons();
        }
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            // Load user data to pre-fill some fields
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                const user = JSON.parse(storedUser);
                setSettings(prev => ({
                    ...prev,
                    platformOwnerName: `${user.first_name || user.firstName || ''} ${user.last_name || user.lastName || ''}`.trim(),
                    ownerEmail: user.email || '',
                    ownerPhone: user.phone || ''
                }));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            // TODO: Implement API call to save settings
            // const response = await api.post('/Settings/Update', settings);
            
            // Simulate save
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            toast.success('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="row">
            <div className="col-xl-6">
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title mb-0">Platform Settings</h4>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                <div className="col-lg-7">
                                    <div className="mb-3">
                                        <p className="fw-medium mb-2">Upload Platform Logo</p>
                                        <div className="profile-photo-edit w-50 auth-logo border bg-light-subtle p-2 rounded">
                                            <input id="platform-logo-input" type="file" className="profile-img-file-input" accept="image/*" />
                                            <label htmlFor="platform-logo-input" className="profile-photo-edit px-4 py-2">
                                                <img src="/assets/images/ipshopy-logo-black.png" className="logo-dark me-1" alt="ipshopy logo" height="24" />
                                                <img src="/assets/images/ipshopy-logo-white.png" className="logo-light me-1" alt="ipshopy logo" height="24" />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-6">
                                    <div className="mb-3">
                                        <label htmlFor="platform-name" className="form-label">Platform Name</label>
                                        <input 
                                            type="text" 
                                            id="platform-name" 
                                            name="platformName"
                                            className="form-control" 
                                            placeholder="Enter name" 
                                            value={settings.platformName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="col-lg-6">
                                    <div className="mb-3">
                                        <label htmlFor="owner-name" className="form-label">Admin Full Name</label>
                                        <input 
                                            type="text" 
                                            id="owner-name" 
                                            name="platformOwnerName"
                                            className="form-control" 
                                            placeholder="Full name" 
                                            value={settings.platformOwnerName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="col-lg-6">
                                    <div className="mb-3">
                                        <label htmlFor="owner-phone" className="form-label">Admin Phone number</label>
                                        <input 
                                            type="text" 
                                            id="owner-phone" 
                                            name="ownerPhone"
                                            className="form-control" 
                                            placeholder="Number" 
                                            value={settings.ownerPhone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="col-lg-6">
                                    <div className="mb-3">
                                        <label htmlFor="owner-email" className="form-label">Admin Email</label>
                                        <input 
                                            type="email" 
                                            id="owner-email" 
                                            name="ownerEmail"
                                            className="form-control" 
                                            placeholder="Email" 
                                            value={settings.ownerEmail}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="col-lg-12">
                                    <div className="mb-3">
                                        <label htmlFor="address" className="form-label">Full Address</label>
                                        <textarea 
                                            className="form-control bg-light-subtle" 
                                            id="address" 
                                            name="fullAddress"
                                            rows="3" 
                                            placeholder="Type address"
                                            value={settings.fullAddress}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="mb-3">
                                        <label htmlFor="zipcode" className="form-label">Zip-Code</label>
                                        <input 
                                            type="number" 
                                            id="zipcode" 
                                            name="zipCode"
                                            className="form-control" 
                                            placeholder="zip-code" 
                                            value={settings.zipCode}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="mb-3">
                                        <label htmlFor="city" className="form-label">City</label>
                                        <input 
                                            type="text" 
                                            id="city" 
                                            name="city"
                                            className="form-control" 
                                            placeholder="City" 
                                            value={settings.city}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="mb-3">
                                        <label htmlFor="country" className="form-label">Country</label>
                                        <select 
                                            className="form-control" 
                                            id="country" 
                                            name="country"
                                            value={settings.country}
                                            onChange={handleChange}
                                        >
                                            <option value="">Choose a country</option>
                                            <option value="United Kingdom">United Kingdom</option>
                                            <option value="France">France</option>
                                            <option value="Netherlands">Netherlands</option>
                                            <option value="U.S.A">U.S.A</option>
                                            <option value="Denmark">Denmark</option>
                                            <option value="Canada">Canada</option>
                                            <option value="Australia">Australia</option>
                                            <option value="India">India</option>
                                            <option value="Germany">Germany</option>
                                            <option value="Spain">Spain</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="col-xl-6 col-lg-8">
                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title mb-0">General Settings</h4>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-lg-6">
                            <div className="mb-3">
                                    <label htmlFor="meta-title" className="form-label">Meta Title</label>
                                    <input 
                                        type="text" 
                                        id="meta-title" 
                                        name="metaTitle"
                                        className="form-control" 
                                        placeholder="Title"
                                        value={settings.metaTitle}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="col-lg-6">
                            <div className="mb-3">
                                    <label htmlFor="meta-tag" className="form-label">Meta Tag Keyword</label>
                                    <input 
                                        type="text" 
                                        id="meta-tag" 
                                        name="metaTag"
                                        className="form-control" 
                                        placeholder="Enter word"
                                        value={settings.metaTag}
                                        onChange={handleChange}
                                    />
                            </div>
                        </div>

                            <div className="col-lg-6">
                            <div className="mb-3">
                                    <label htmlFor="theme" className="form-label">Platform Theme</label>
                                    <select 
                                        className="form-control" 
                                        id="theme" 
                                        name="theme"
                                        value={settings.theme}
                                        onChange={handleChange}
                                    >
                                        <option value="Default">Default</option>
                                        <option value="Dark">Dark</option>
                                        <option value="Minimalist">Minimalist</option>
                                        <option value="High Contrast">High Contrast</option>
                                </select>
                            </div>
                        </div>

                            <div className="col-lg-12">
                                <div className="mb-3">
                                    <label htmlFor="description" className="form-label">Description</label>
                                    <textarea 
                                        className="form-control bg-light-subtle" 
                                        id="description" 
                                        name="description"
                                        rows="4" 
                                        placeholder="Type description"
                                        value={settings.description}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h4 className="card-title mb-0">Social Settings</h4>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-lg-4">
                                <div className="mb-3">
                                    <label htmlFor="facebook-url" className="form-label">Facebook URL</label>
                                    <input 
                                        type="url" 
                                        id="facebook-url" 
                                        name="facebookUrl"
                                        className="form-control" 
                                        placeholder="Enter URL" 
                                        value={settings.facebookUrl}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="col-lg-4">
                                <div className="mb-3">
                                    <label htmlFor="instagram-url" className="form-label">Instagram URL</label>
                                    <input 
                                        type="url" 
                                        id="instagram-url" 
                                        name="instagramUrl"
                                        className="form-control" 
                                        placeholder="Enter URL" 
                                        value={settings.instagramUrl}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="col-lg-4">
                                <div className="mb-3">
                                    <label htmlFor="twitter-url" className="form-label">Twitter URL</label>
                                    <input 
                                        type="url" 
                                        id="twitter-url" 
                                        name="twitterUrl"
                                        className="form-control" 
                                        placeholder="Enter URL" 
                                        value={settings.twitterUrl}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="col-lg-6">
                                <div className="mb-3">
                                    <label htmlFor="website-url" className="form-label">Website URL</label>
                                    <input 
                                        type="url" 
                                        id="website-url" 
                                        name="websiteUrl"
                                        className="form-control" 
                                        placeholder="Enter URL" 
                                        value={settings.websiteUrl}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mt-3">
                <div className="col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Customer Settings</h4>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-lg-4">
                                    <div className="form-group mb-3">
                                        <p className="fw-medium mb-2">Customers Online</p>
                                        <div className="form-check form-switch">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id="customersOnline"
                                                name="customersOnline"
                                                checked={settings.customersOnline}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="customersOnline">Yes</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="form-group mb-3">
                                        <p className="fw-medium mb-2">Customers Activity</p>
                                        <div className="form-check form-switch">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id="customersActivity"
                                                name="customersActivity"
                                                checked={settings.customersActivity}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="customersActivity">Yes</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="form-group mb-3">
                                        <p className="fw-medium mb-2">Customer Searches</p>
                                        <div className="form-check form-switch">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id="customerSearches"
                                                name="customerSearches"
                                                checked={settings.customerSearches}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="customerSearches">Yes</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="form-group mb-3">
                                        <p className="fw-medium mb-2">Allow Guest Checkout</p>
                                        <div className="form-check form-switch">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id="guestCheckout"
                                                name="guestCheckout"
                                                checked={settings.guestCheckout}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="guestCheckout">Yes</label>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-lg-4">
                                    <div className="form-group mb-3">
                                        <p className="fw-medium mb-2">Login Display Price</p>
                                        <div className="form-check form-switch">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id="loginDisplayPrice"
                                                name="loginDisplayPrice"
                                                checked={settings.loginDisplayPrice}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="loginDisplayPrice">Yes</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-3">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Categories Settings</h4>
                        </div>
                        <div className="card-body">
                            <div className="form-group mb-3">
                                <p className="fw-medium mb-2">Category Product Count</p>
                                <div className="form-check form-switch">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="categoryProductCount"
                                        name="categoryProductCount"
                                        checked={settings.categoryProductCount}
                                        onChange={handleChange}
                                    />
                                    <label className="form-check-label" htmlFor="categoryProductCount">Yes</label>
                                </div>
                            </div>

                            <div className="form-group">
                                <div className="mb-3">
                                    <label htmlFor="items-per-page" className="form-label">Default Items Per Page</label>
                                    <input 
                                        type="number" 
                                        id="items-per-page" 
                                        name="defaultItemsPerPage"
                                        className="form-control" 
                                        placeholder="000"
                                        value={settings.defaultItemsPerPage}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-3">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Reviews Settings</h4>
                        </div>
                        <div className="card-body">
                            <div className="form-group mb-3">
                                <p className="fw-medium mb-2">Allow Reviews</p>
                                <div className="form-check form-switch">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="allowReviews"
                                        name="allowReviews"
                                        checked={settings.allowReviews}
                                        onChange={handleChange}
                                    />
                                    <label className="form-check-label" htmlFor="allowReviews">Yes</label>
                                </div>
                            </div>

                            <div className="form-group">
                                <p className="fw-medium mb-2">Allow Guest Reviews</p>
                                <div className="form-check form-switch">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="allowGuestReviews"
                                        name="allowGuestReviews"
                                        checked={settings.allowGuestReviews}
                                        onChange={handleChange}
                                    />
                                    <label className="form-check-label" htmlFor="allowGuestReviews">Yes</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mt-3">
                <div className="col-12">
                    <div className="text-end">
                        <button 
                            type="button" 
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
