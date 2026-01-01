const express = require('express');
const router = express.Router();
const {
    uploadInfluencerReel,
    uploadSellerReel,
    uploadBrandReel,
    updateBrandReel,
    getInfluencerReels,
    getSellerReels,
    getCategories,
    getSellers,
    getSellerProducts,
    getBrands,
    getBrandProducts,
    getRelatedProducts,
    getProductNamesByIds,
    getAllProducts,
    incrementReelView,
    toggleReelLike,
    toggleCreatorFollow,
    getReelById,
    editReel,
    deleteReel,
    getSellerDashboardStats,
    getRecentSellerReels,
    getApprovedReelsCount,
    deleteBrandReel
} = require('../Controller/Studio/ReelsController');
const { editReelAzure } = require('../Controller/Studio/ReelsController');
const { verifyToken, verifyInfluencer, verifySeller } = require('../Middleware/AuthMiddleware');
const db = require('../Config/db'); // Add database connection

// Middleware to handle file uploads
const upload = require('../Config/multerConfig');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const FormData = require('form-data');
const AZURE_UPLOAD_URL = process.env.AZURE_UPLOAD_URL || (process.env.AZURE_UPLOAD_BASE_URL ? `${process.env.AZURE_UPLOAD_BASE_URL.replace(/\/$/, '')}/api/UploadReel` : '');
const AZURE_FUNCTION_KEY = process.env.AZURE_FUNCTION_KEY;
const AZURE_SAS_DISABLED = String(process.env.AZURE_SAS_DISABLED || '').toLowerCase() === 'true';

const SAS_ENV_KEYS = [
    'AZURE_BLOB_SAS_QUERY',
    'AZURE_BLOB_SAS_TOKEN',
    'AZURE_STORAGE_SAS',
    'AZURE_SAS_TOKEN'
];
const resolveSasToken = () => {
    for (const key of SAS_ENV_KEYS) {
        const value = process.env[key];
        if (value && String(value).trim()) {
            return { token: String(value).trim(), source: key };
        }
    }
    return { token: '', source: '' };
};
const appendSASLocal = (url) => {
    if (!url || !String(url).trim()) return url;
    if (AZURE_SAS_DISABLED) return url;
    const { token: sas } = resolveSasToken();
    if (!sas || !String(sas).trim()) return url;
    const clean = String(sas).replace(/^\?/, '');
    return url.includes('?') ? `${url}&${clean}` : `${url}?${clean}`;
};
const deleteBlobByUrl = (blobUrl) => {
    return new Promise((resolve) => {
        try {
            if (!blobUrl || !String(blobUrl).includes('blob.core.windows.net')) return resolve(false);
            const signed = appendSASLocal(blobUrl);
            const u = new URL(signed);
            const opts = { method: 'DELETE', hostname: u.hostname, path: u.pathname + u.search };
            const client = u.protocol === 'https:' ? https : http;
            const reqDel = client.request(opts, (resp) => {
                const ok = (resp.statusCode || 0) >= 200 && (resp.statusCode || 0) < 300;
                resolve(ok);
            });
            reqDel.on('error', () => resolve(false));
            reqDel.end();
        } catch {
            resolve(false);
        }
    });
};

const uploadToAzure = (filePath, filename, mimetype = 'video/mp4') => {
    return new Promise((resolve, reject) => {
        try {
            const sanitizeFilename = (name) => {
                if (!name) return 'upload.mp4';
                let sanitized = name.replace(/[\r\n\t]/g, '');
                sanitized = sanitized.normalize('NFKD').replace(/[^\x00-\x7F]/g, '');
                sanitized = sanitized.replace(/[^A-Za-z0-9._-]/g, '');
                sanitized = sanitized.substring(0, 80);
                return sanitized || 'upload.mp4';
            };

            let effectiveUrl = AZURE_UPLOAD_URL;
            if (!effectiveUrl) {
                const base = process.env.AZURE_UPLOAD_BASE_URL;
                if (base && String(base).trim()) {
                    effectiveUrl = `${String(base).replace(/\/$/, '')}/api/UploadReel`;
                } else {
                    effectiveUrl = 'https://reels-function.azurewebsites.net/api/reels/upload';
                }
            }

            const sanitizedFilename = sanitizeFilename(filename);
            const urlObj = new URL(effectiveUrl);
            if (AZURE_FUNCTION_KEY && !urlObj.searchParams.get('code')) {
                urlObj.searchParams.set('code', AZURE_FUNCTION_KEY);
            }
            const headers = {
                'Content-Type': mimetype || 'video/mp4',
                'x-filename': sanitizedFilename,
                'Content-Length': fs.statSync(filePath).size
            };

            if (AZURE_FUNCTION_KEY) headers['x-functions-key'] = AZURE_FUNCTION_KEY;

            const options = {
                method: 'POST',
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                headers,
            };

            const client = urlObj.protocol === 'https:' ? https : http;
            const req = client.request(options, (res) => {
                const chunks = [];
                res.on('data', (d) => chunks.push(d));
                res.on('end', () => {
                    const body = Buffer.concat(chunks).toString('utf8');
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            const json = JSON.parse(body);
                            resolve(json.url || json.videoUrl || json.blobUrl || json.location || body);
                        } catch {
                            resolve(body);
                        }
                    } else {
                        reject(new Error(body || String(res.statusCode)));
                    }
                });
            });

            req.on('error', reject);
            fs.createReadStream(filePath).pipe(req);
        } catch (err) {
            reject(err);
        }
    });
};

// Configure multer for profile image uploads
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Store profile images in the studio public assets directory
        const profileDir = path.join(__dirname, '../../studio/public/assets/images/users');
        if (!fs.existsSync(profileDir)) {
            fs.mkdirSync(profileDir, { recursive: true });
        }
        cb(null, profileDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename for profile images
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});

const profileUpload = multer({
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for profile images
    },
    fileFilter: (req, file, cb) => {
        // Allow only image files for profile images
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only image files are allowed for profile pictures.'));
        }
    }
});

/**
 * @route   POST /api/studio/reels/profile/image
 * @desc    Upload a profile image
 * @access  Private (Authenticated users)
 */
router.post('/profile/image', verifyToken, profileUpload.single('profileImage'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        
        // Return the path to the uploaded file
        const imagePath = `/assets/images/users/${req.file.filename}`;
        res.json({ 
            success: true, 
            message: 'Profile image uploaded successfully',
            imagePath: imagePath
        });
    } catch (error) {
        console.error('Profile image upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload profile image' });
    }
});

/**
 * @route   PUT /api/studio/reels/profile/image
 * @desc    Update profile image path in database
 * @access  Private (Authenticated users)
 */
router.put('/profile/image', verifyToken, (req, res) => {
    try {
        const { imagePath } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;
        
        // Validate inputs
        if (!imagePath) {
            return res.status(400).json({ 
                success: false, 
                message: 'Image path is required' 
            });
        }
        
        let query = '';
        let tableName = '';
        
        // Determine which table to update based on user role
        if (userRole === 'influencer') {
            query = `UPDATE oc_influencers SET profile_image = ? WHERE id = ?`;
            tableName = 'oc_influencers';
        } else if (userRole === 'seller') {
            query = `UPDATE oc_sellers SET profile_image = ? WHERE id = ?`;
            tableName = 'oc_sellers';
        } else {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized role for profile image update' 
            });
        }
        
        db.query(query, [imagePath, userId], (err, result) => {
            if (err) {
                console.error(`Database error updating profile image in ${tableName}:`, err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to update profile image',
                    error: err.message 
                });
            }
            
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'User not found' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Profile image updated successfully'
            });
        });
    } catch (error) {
        console.error('Profile image update error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile image' });
    }
});

/**
 * @route   POST /api/studio/reels/influencer/upload
 * @desc    Upload a new influencer reel
 * @access  Private (Influencer only)
 */
router.post('/influencer/upload', verifyInfluencer, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), uploadInfluencerReel);

/**
 * @route   POST /api/studio/reels/seller/upload
 * @desc    Upload a new seller reel
 * @access  Private (Seller only)
 */
router.post('/seller/upload', verifySeller, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), uploadSellerReel);

/**
 * @route   POST /api/studio/reels/admin/seller-upload
 * @desc    Upload a new seller reel by admin
 * @access  Private (Admin only)
 */
router.post('/admin/seller-upload', verifyToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), uploadSellerReel);
/**
 * @route   POST /api/studio/reels/brand/upload
 * @desc    Upload a new brand reel
 * @access  Private (Authenticated users)
 */
router.post('/brand/upload', verifyToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), uploadBrandReel);

/**
 * @route   POST /api/studio/reels/brand-reel-upload
 * @desc    Upload a new brand reel (alternative route for compatibility)
 * @access  Private (Authenticated users)
 */
router.post('/brand-reel-upload', verifyToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), uploadBrandReel);

/**
 * @route   POST /api/studio/reels/azure/upload
 * @desc    Proxy upload to Azure Function to avoid browser CORS
 * @access  Private (Authenticated users)
 */
router.post('/azure/upload', verifyToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'file', maxCount: 1 }
]), async (req, res) => {
    try {
        const sanitizeFilename = (name) => {
            if (!name) return `upload_${Date.now()}.mp4`;
            const lastDot = name.lastIndexOf('.');
            const hasExtension = lastDot > 0 && lastDot < name.length - 1;
            const extension = hasExtension ? name.substring(lastDot) : '';
            const nameWithoutExt = hasExtension ? name.substring(0, lastDot) : name;
            let sanitized = nameWithoutExt
                .replace(/[\r\n\t]/g, '')
                .replace(/[\\/:*?"<>|]/g, '_')
                .replace(/\s+/g, '_')
                .replace(/[^\w\-_.]/g, '_')
                .replace(/_+/g, '_')
                .replace(/^_+|_+$/g, '');
            if (!sanitized || !sanitized.trim()) sanitized = `upload_${Date.now()}`;
            if (sanitized.length > 200) sanitized = sanitized.substring(0, 200);
            const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v'];
            const lowerExt = extension.toLowerCase();
            const finalExtension = videoExtensions.includes(lowerExt) ? '.mp4' : (lowerExt || '.mp4');
            const timestamp = Date.now();
            const randomSuffix = Math.random().toString(36).substring(2, 8);
            const finalFilename = `${sanitized}_${timestamp}_${randomSuffix}${finalExtension}`;
            return finalFilename;
        };

        const file = (req.files?.video?.[0]) || (req.files?.file?.[0]);
        if (!file) {
            return res.status(400).json({ success: false, message: 'No video file uploaded' });
        }

        const originalName = (req.body?.filename) || (file.originalname || 'upload.mp4');
        const filename = sanitizeFilename(originalName);
        const uploadedUrl = await uploadToAzure(file.path, filename, file.mimetype);

        let finalUrl = uploadedUrl;
        const { token: sas } = resolveSasToken();
        if (!AZURE_SAS_DISABLED && finalUrl && sas) {
            const cleanSas = String(sas).replace(/^\?/, '');
            finalUrl = finalUrl.includes('?') ? `${finalUrl}&${cleanSas}` : `${finalUrl}?${cleanSas}`;
        }

        if (!finalUrl) {
            return res.status(200).json({ success: true, message: 'Uploaded to Azure, but no URL was returned' });
        }

        return res.json({ success: true, url: finalUrl });
    } catch (error) {
        console.error('Azure upload proxy error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Azure proxy failed' });
    }
});

/**
 * @route   PUT /api/studio/reels/azure/edit/:id
 * @desc    Proxy edit to Azure Function to avoid browser CORS
 * @access  Private (Authenticated users)
 */
router.put('/azure/edit/:id', verifyToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate reel ID
        if (!id) {
            return res.status(400).json({ success: false, message: 'Reel ID is required' });
        }

        // First, get the existing reel to get the old blob path
        const getReelQuery = `
            SELECT video_url FROM oc_influencer_reels WHERE reel_id = ?
            UNION
            SELECT video_url FROM oc_seller_reels WHERE reel_id = ?
            UNION
            SELECT video_url FROM oc_brand_reels WHERE id = ?
            LIMIT 1
        `;

        db.query(getReelQuery, [id, id, id], async (err, results) => {
            if (err) {
                console.error('Error fetching reel for Azure edit:', err);
                return res.status(500).json({ success: false, message: 'Error fetching reel data' });
            }

            if (results.length === 0) {
                return res.status(404).json({ success: false, message: 'Reel not found' });
            }

            // Ensure oldBlobPath is a string
            const oldBlobPath = String(results[0].video_url || '');
            const oldThumbPath = '';
            
            // Validate old blob path
            if (!oldBlobPath || oldBlobPath.trim() === '') {
                return res.status(400).json({ success: false, message: 'Invalid blob path for reel' });
            }

            // Create FormData to send to Azure Function
            const formData = new FormData();
            
            // Add all form fields to the FormData (coerce to strings)
            Object.keys(req.body).forEach(key => {
                const val = req.body[key];
                if (val === undefined || val === null) return;
                if (typeof val === 'object') {
                    formData.append(key, JSON.stringify(val));
                } else {
                    formData.append(key, String(val));
                }
            });
            
            // Add files if they exist
            if (req.files) {
                if (req.files.video && req.files.video[0]) {
                    formData.append('video', fs.createReadStream(req.files.video[0].path), {
                        filename: req.files.video[0].originalname,
                        contentType: req.files.video[0].mimetype
                    });
                }
                if (req.files.thumbnail && req.files.thumbnail[0]) {
                    formData.append('thumbnail', fs.createReadStream(req.files.thumbnail[0].path), {
                        filename: req.files.thumbnail[0].originalname,
                        contentType: req.files.thumbnail[0].mimetype
                    });
                }
            }

            try {
                const isAzureVideo = oldBlobPath.includes('blob.core.windows.net');
                const isAzureThumb = oldThumbPath.includes('blob.core.windows.net');
                const hasVideo = !!(req.files && req.files.video && req.files.video[0]);
                const hasThumb = !!(req.files && req.files.thumbnail && req.files.thumbnail[0]);
                if (!hasVideo && !hasThumb) {
                    return res.status(200).json({ success: true, message: 'No file changes' });
                }
                if (!isAzureVideo) {
                    const videoFile = req.files?.video?.[0];
                    if (!videoFile) {
                        return res.status(400).json({ success: false, message: 'No video file provided for local reel' });
                    }
                    const originalName = (req.body?.filename) || (videoFile.originalname || 'upload.mp4');
                    const uploadedUrl = await uploadToAzure(videoFile.path, originalName, videoFile.mimetype);
                    let finalUrl = uploadedUrl;
                    const { token: sas } = resolveSasToken();
                    if (!AZURE_SAS_DISABLED && finalUrl && sas) {
                        const cleanSas = String(sas).replace(/^\?/, '');
                        finalUrl = finalUrl.includes('?') ? `${finalUrl}&${cleanSas}` : `${finalUrl}?${cleanSas}`;
                    }
                    const updateInfluencer = `UPDATE oc_influencer_reels SET video_url = ? WHERE reel_id = ?`;
                    db.query(updateInfluencer, [finalUrl, id], (err, infRes) => {
                        if (err) {
                            return res.status(500).json({ success: false, message: 'Error updating influencer reel video', error: err.message });
                        }
                        if (infRes.affectedRows > 0) {
                            return res.json({ success: true, url: finalUrl, message: 'Reel updated successfully' });
                        }
                        const updateSeller = `UPDATE oc_seller_reels SET video_url = ? WHERE reel_id = ?`;
                        db.query(updateSeller, [finalUrl, id], (err, selRes) => {
                            if (err) {
                                return res.status(500).json({ success: false, message: 'Error updating seller reel video', error: err.message });
                            }
                            if (selRes.affectedRows > 0) {
                                return res.json({ success: true, url: finalUrl, message: 'Reel updated successfully' });
                            }
                            const updateBrand = `UPDATE oc_brand_reels SET video_url = ? WHERE id = ?`;
                            db.query(updateBrand, [finalUrl, id], (err, brRes) => {
                                if (err) {
                                    return res.status(500).json({ success: false, message: 'Error updating brand reel video', error: err.message });
                                }
                                if (brRes.affectedRows > 0) {
                                    return res.json({ success: true, url: finalUrl, message: 'Reel updated successfully' });
                                }
                                return res.status(404).json({ success: false, message: 'Reel not found for update' });
                            });
                        });
                    });
                    return;
                }
                let newVideoUrl = '';
                let newThumbUrl = '';
                if (hasVideo) {
                    const vf = req.files.video[0];
                    const uploaded = await uploadToAzure(vf.path, vf.originalname || 'upload.mp4', vf.mimetype);
                    newVideoUrl = appendSASLocal(uploaded);
                }
                if (hasThumb) {
                    const tf = req.files.thumbnail[0];
                    const uploadedT = await uploadToAzure(tf.path, tf.originalname || 'thumbnail.png', tf.mimetype);
                    newThumbUrl = appendSASLocal(uploadedT);
                }
                const updateInfluencer = `UPDATE oc_influencer_reels SET ${hasVideo ? 'video_url = ?' : ''}${hasVideo && hasThumb ? ', ' : ''}${hasThumb ? 'thumbnail = ?' : ''} WHERE reel_id = ?`;
                const updateSeller = `UPDATE oc_seller_reels SET ${hasVideo ? 'video_url = ?' : ''}${hasVideo && hasThumb ? ', ' : ''}${hasThumb ? 'thumbnail = ?' : ''} WHERE reel_id = ?`;
                const updateBrand = `UPDATE oc_brand_reels SET ${hasVideo ? 'video_url = ?' : ''}${hasVideo && hasThumb ? ', ' : ''}${hasThumb ? 'thumbnail = ?' : ''} WHERE id = ?`;
                const valsBase = [];
                if (hasVideo) valsBase.push(newVideoUrl);
                if (hasThumb) valsBase.push(newThumbUrl);
                const tryUpdate = (query, tableName) => {
                    return new Promise((resolveUpdate) => {
                        db.query(query, [...valsBase, id], (err, result) => {
                            if (err && err.code === 'ER_BAD_FIELD_ERROR' && hasThumb) {
                                const fallbackQuery = query.replace(/,\s*thumbnail\s*=\s*\?/i, '');
                                db.query(fallbackQuery, hasVideo ? [newVideoUrl, id] : [id], (err2, result2) => {
                                    if (err2) return resolveUpdate({ ok: false, err: err2, table: tableName });
                                    resolveUpdate({ ok: (result2.affectedRows || 0) > 0, table: tableName });
                                });
                                return;
                            }
                            if (err) return resolveUpdate({ ok: false, err, table: tableName });
                            resolveUpdate({ ok: (result.affectedRows || 0) > 0, table: tableName });
                        });
                    });
                };
                const inf = await tryUpdate(updateInfluencer, 'influencer');
                if (inf.ok) {
                    if (hasVideo && isAzureVideo && oldBlobPath && newVideoUrl) deleteBlobByUrl(oldBlobPath);
                    if (hasThumb && isAzureThumb && oldThumbPath && newThumbUrl) deleteBlobByUrl(oldThumbPath);
                    return res.json({ success: true, message: 'Reel updated successfully', url: newVideoUrl, thumbnail: newThumbUrl });
                }
                const sel = await tryUpdate(updateSeller, 'seller');
                if (sel.ok) {
                    if (hasVideo && isAzureVideo && oldBlobPath && newVideoUrl) deleteBlobByUrl(oldBlobPath);
                    if (hasThumb && isAzureThumb && oldThumbPath && newThumbUrl) deleteBlobByUrl(oldThumbPath);
                    return res.json({ success: true, message: 'Reel updated successfully', url: newVideoUrl, thumbnail: newThumbUrl });
                }
                const br = await tryUpdate(updateBrand, 'brand');
                if (br.ok) {
                    if (hasVideo && isAzureVideo && oldBlobPath && newVideoUrl) deleteBlobByUrl(oldBlobPath);
                    if (hasThumb && isAzureThumb && oldThumbPath && newThumbUrl) deleteBlobByUrl(oldThumbPath);
                    return res.json({ success: true, message: 'Reel updated successfully', url: newVideoUrl, thumbnail: newThumbUrl });
                }
                return res.status(404).json({ success: false, message: 'Reel not found for update' });
            } catch (azureError) {
                console.error('Edit upload error:', azureError);
                const msg = (azureError && azureError.message) ? azureError.message : 'Edit upload failed';
                return res.status(500).json({ success: false, message: msg });
            }
        });
    } catch (error) {
        console.error('Azure edit proxy error:', error);
        return res.status(500).json({ success: false, message: error.message || 'Azure proxy failed' });
    }
});
router.get('/azure/sas-health', verifyToken, async (req, res) => {
    try {
        const inputUrl = String(req.query.url || '').trim();
        if (!inputUrl) {
            return res.status(400).json({ success: false, message: 'Missing url query parameter' });
        }
        const isAzure = inputUrl.includes('blob.core.windows.net');
        if (!isAzure) {
            return res.status(400).json({ success: false, message: 'Provided URL is not an Azure blob URL' });
        }
        if (AZURE_SAS_DISABLED) {
            return res.status(200).json({
                success: true,
                sasConfigured: false,
                message: 'SAS disabled via AZURE_SAS_DISABLED=true; using public/blob-level access',
                checkedEnvKeys: SAS_ENV_KEYS
            });
        }
        const { token: sas, source } = resolveSasToken();
        if (!sas || !sas.trim()) {
            return res.status(200).json({ 
                success: false, 
                sasConfigured: false, 
                message: 'Azure SAS token is not set in environment',
                checkedEnvKeys: SAS_ENV_KEYS 
            });
        }
        const cleanSas = String(sas).trim().replace(/^\?/, '');
        const testUrl = inputUrl.includes('?') ? `${inputUrl}&${cleanSas}` : `${inputUrl}?${cleanSas}`;
        let statusCode = 0;
        let ok = false;
        const urlObj = new URL(testUrl);
        const options = { method: 'HEAD', hostname: urlObj.hostname, path: urlObj.pathname + urlObj.search };
        const client = urlObj.protocol === 'https:' ? https : http;
        await new Promise((resolve) => {
            const reqHead = client.request(options, (resp) => {
                statusCode = resp.statusCode || 0;
                ok = statusCode >= 200 && statusCode < 300;
                resolve();
            });
            reqHead.on('error', () => {
                statusCode = 0;
                ok = false;
                resolve();
            });
            reqHead.end();
        });
        return res.status(200).json({
            success: ok,
            sasConfigured: true,
            statusCode,
            testedUrlLength: testUrl.length,
            signedUrl: testUrl,
            sasSource: source
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || 'SAS health check failed' });
    }
});

/**
 * @route   GET /api/studio/reels/influencer/my-reels
 * @desc    Get reels for the authenticated influencer
 * @access  Private (Influencer only)
 */
router.get('/influencer/my-reels', verifyToken, verifyInfluencer, getInfluencerReels);

/**
 * @route   GET /api/studio/reels/influencers/reels
 * @desc    Get all influencer reels for admin list
 * @access  Public
 */
router.get('/influencers/reels', (req, res) => {
    // Import the function here to avoid circular dependencies
    const { getInfluencerReelsAdmin } = require('../Controller/Studio/ReelsController');
    getInfluencerReelsAdmin(req, res);
});

/**
 * @route   GET /api/studio/reels/influencers/approved-with-counts
 * @desc    Get approved influencers with their reel counts
 * @access  Public
 */
router.get('/influencers/approved-with-counts', (req, res) => {
    // Import the function here to avoid circular dependencies
    const { getApprovedInfluencersWithReelCounts } = require('../Controller/Studio/ReelsController');
    getApprovedInfluencersWithReelCounts(req, res);
});

/**
 * @route   GET /api/studio/reels/influencers/approved-reels
 * @desc    Get all approved influencer reels
 * @access  Public
 */
router.get('/influencers/approved-reels', (req, res) => {
    // Import the function here to avoid circular dependencies
    const { getAllApprovedInfluencerReels } = require('../Controller/Studio/ReelsController');
    getAllApprovedInfluencerReels(req, res);
});

/**
 * @route   GET /api/studio/reels/recent-approved
 * @desc    Get recent approved reels across sellers and influencers
 * @access  Public
 */
router.get('/recent-approved', (req, res) => {
    const { getRecentApprovedReels } = require('../Controller/Studio/ReelsController');
    getRecentApprovedReels(req, res);
});

/**
 * @route   GET /api/studio/reels/influencer/:influencerId/reels
 * @desc    Get reels for a specific influencer
 * @access  Public
 */
router.get('/influencer/:influencerId/reels', (req, res) => {
    // Import the function here to avoid circular dependencies
    const { getInfluencerReelsById } = require('../Controller/Studio/ReelsController');
    getInfluencerReelsById(req, res);
});

/**
 * @route   GET /api/studio/reels/seller/:vendorId/reels
 * @desc    Get reels for a specific seller
 * @access  Private (Seller only)
 */
router.get('/seller/:vendorId/reels', verifySeller, getSellerReels);

/**
 * @route   GET /api/studio/reels/seller/:vendorId/public
 * @desc    Get reels for a specific seller (public)
 * @access  Public
 */
// Temporary workaround - using the same function but without authentication
router.get('/seller/:vendorId/public', getSellerReels);

/**
 * @route   GET /api/studio/reels/seller/:vendorId/dashboard-stats
 * @desc    Get dashboard statistics for a specific seller
 * @access  Private (Seller only)
 */
router.get('/seller/:vendorId/dashboard-stats', verifySeller, getSellerDashboardStats);

/**
 * @route   GET /api/studio/reels/seller/:vendorId/recent-reels
 * @desc    Get recent reels for a specific seller
 * @access  Private (Seller only)
 */
router.get('/seller/:vendorId/recent-reels', verifySeller, getRecentSellerReels);

/**
 * @route   GET /api/studio/reels/categories
 * @desc    Get all categories
 * @access  Public
 */
router.get('/categories', getCategories);

/**
 * @route   GET /api/studio/reels/sellers
 * @desc    Get all sellers
 * @access  Public
 */
router.get('/sellers', getSellers);

/**
 * @route   GET /api/studio/reels/brands
 * @desc    Get all brands
 * @access  Public
 */
router.get('/brands', getBrands);

/**
 * @route   GET /api/studio/reels/brand-reels
 * @desc    Get all brand reels (reels with brand_id)
 * @access  Public
 */
router.get('/brand-reels', (req, res) => {
    // Import the function here to avoid circular dependencies
    const { getBrandReels } = require('../Controller/Studio/ReelsController');
    getBrandReels(req, res);
});

/**
 * @route   PUT /api/studio/reels/brand-reels/:id
 * @desc    Update an existing brand reel
 * @access  Private (Authenticated users)
 */
router.put('/brand-reels/:id', verifyToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), updateBrandReel);

router.delete('/brand-reels/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    let blobUrl = '';
    try {
        const q = `
            SELECT video_url FROM oc_brand_reels WHERE id = ?
            LIMIT 1
        `;
        db.query(q, [id], (err, results) => {
            if (!err && results && results.length > 0) {
                blobUrl = String(results[0].video_url || '');
            }
            res.once('finish', () => {
                try {
                    const u = blobUrl ? new URL(blobUrl) : null;
                    if (!u || !u.hostname.includes('blob.core.windows.net')) return;
                    const parts = u.pathname.split('/').filter(Boolean);
                    if (parts.length < 2) return;
                    const blobName = parts.slice(1).join('/');
                    let funcUrl = process.env.AZURE_REELS_DELETE_URL || process.env.AZURE_DELETE_FUNCTION_URL || '';
                    if (!funcUrl) funcUrl = 'https://reels-function.azurewebsites.net/api/reels/delete';
                    const funcObj = new URL(funcUrl);
                    funcObj.searchParams.set('blobName', blobName);
                    const key = process.env.AZURE_FUNCTION_KEY || '';
                    if (key && !funcObj.searchParams.get('code')) funcObj.searchParams.set('code', key);
                    const opts = { method: 'DELETE', hostname: funcObj.hostname, path: funcObj.pathname + funcObj.search, headers: {} };
                    if (key) opts.headers['x-functions-key'] = key;
                    const client = funcObj.protocol === 'https:' ? https : http;
                    const reqDel = client.request(opts, (resp) => {
                        const chunks = [];
                        resp.on('data', d => chunks.push(d));
                        resp.on('end', () => {});
                    });
                    reqDel.on('error', () => {});
                    reqDel.end();
                } catch (_) {}
            });
            deleteBrandReel(req, res);
        });
    } catch (_) {
        deleteBrandReel(req, res);
    }
});

/**
 * @route   GET /api/studio/reels/sellers/:vendorId/products
 * @desc    Get products for a specific seller
 * @access  Public
 */
router.get('/sellers/:vendorId/products', getSellerProducts);

/**
 * @route   GET /api/studio/reels/brands/:brandId/products
 * @desc    Get products for a specific brand
 * @access  Public
 */
router.get('/brands/:brandId/products', getBrandProducts);

/**
 * @route   POST /api/studio/reels/related-products
 * @desc    Get related products based on selected products
 * @access  Public
 */
router.post('/related-products', getRelatedProducts);

/**
 * @route   POST /api/studio/reels/product-names
 * @desc    Get product names by IDs
 * @access  Public
 */
router.post('/product-names', getProductNamesByIds);

/**
 * @route   GET /api/studio/reels/products/all
 * @desc    Get all products
 * @access  Public
 */
router.get('/products/all', getAllProducts);

/**
 * @route   GET /api/studio/reels/approved-counts
 * @desc    Get approved reels count across all sellers and influencers
 * @access  Public
 */
router.get('/approved-counts', getApprovedReelsCount);

/**
 * @route   PUT /api/studio/reels/:id
 * @desc    Edit a specific reel
 * @access  Private (Authenticated users)
 */
router.put('/:id', verifyToken, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), editReel);

/**
 * @route   POST /api/studio/reels/:id/view
 * @desc    Increment view count for a specific reel
 * @access  Public
 */
router.post('/:id/view', incrementReelView);

/**
 * @route   POST /api/studio/reels/:id/like
 * @desc    Toggle like for a specific reel
 * @access  Private (Authenticated users)
 */
router.post('/:id/like', verifyToken, toggleReelLike);

/**
 * @route   POST /api/studio/reels/:id/sync-likes
 * @desc    Sync like counts for a specific reel into oc_reel_likes summary
 * @access  Private (Authenticated users)
 */
router.post('/:id/sync-likes', verifyToken, (req, res) => {
    const { syncReelLikesSummary } = require('../Controller/Studio/ReelsController');
    syncReelLikesSummary(req, res);
});

/**
 * @route   POST /api/studio/reels/sync-likes
 * @desc    Sync like counts for all reels into oc_reel_likes summary
 * @access  Private (Authenticated users)
 */
router.post('/sync-likes', verifyToken, (req, res) => {
    const { syncAllReelLikesSummary } = require('../Controller/Studio/ReelsController');
    syncAllReelLikesSummary(req, res);
});

/**
 * @route   POST /api/studio/reels/:id/follow
 * @desc    Toggle follow for the creator of a specific reel
 * @access  Private (Authenticated users)
 */
router.post('/:id/follow', verifyToken, toggleCreatorFollow);

/**
 * @route   GET /api/studio/reels/:id
 * @desc    Get a specific reel by ID
 * @access  Private (Authenticated users)
 */
router.get('/:id', verifyToken, getReelById);

/**
 * @route   POST /api/studio/reels/seller-reels/:id/approve
 * @desc    Approve a specific seller reel
 * @access  Private (Authenticated users)
 */
router.post('/seller-reels/:id/approve', verifyToken, (req, res) => {
    // Import the function here to avoid circular dependencies
    const { approveSellerReel } = require('../Controller/Studio/ReelsController');
    approveSellerReel(req, res);
});

/**
 * @route   POST /api/studio/reels/seller-reels/:id/reject
 * @desc    Reject a specific seller reel
 * @access  Private (Authenticated users)
 */
router.post('/seller-reels/:id/reject', verifyToken, (req, res) => {
    // Import the function here to avoid circular dependencies
    const { rejectSellerReel } = require('../Controller/Studio/ReelsController');
    rejectSellerReel(req, res);
});

/**
 * @route   POST /api/studio/reels/influencer-reels/:id/approve
 * @desc    Approve a specific influencer reel
 * @access  Private (Authenticated users)
 */
router.post('/influencer-reels/:id/approve', verifyToken, (req, res) => {
    // Import the function here to avoid circular dependencies
    const { approveInfluencerReel } = require('../Controller/Studio/ReelsController');
    approveInfluencerReel(req, res);
});

/**
 * @route   POST /api/studio/reels/influencer-reels/:id/reject
 * @desc    Reject a specific influencer reel
 * @access  Private (Authenticated users)
 */
router.post('/influencer-reels/:id/reject', verifyToken, (req, res) => {
    // Import the function here to avoid circular dependencies
    const { rejectInfluencerReel } = require('../Controller/Studio/ReelsController');
    rejectInfluencerReel(req, res);
});

/**
 * @route   DELETE /api/studio/reels/:id
 * @desc    Delete a specific reel
 * @access  Private (Authenticated users)
 */
router.delete('/:id', verifyToken, (req, res) => {
    const { id } = req.params;
    let blobUrl = '';
    try {
        const q = `
            SELECT video_url FROM oc_influencer_reels WHERE reel_id = ?
            UNION
            SELECT video_url FROM oc_seller_reels WHERE reel_id = ?
            UNION
            SELECT video_url FROM oc_brand_reels WHERE id = ?
            LIMIT 1
        `;
        db.query(q, [id, id, id], (err, results) => {
            if (!err && results && results.length > 0) {
                blobUrl = String(results[0].video_url || '');
            }
            res.once('finish', () => {
                try {
                    const u = blobUrl ? new URL(blobUrl) : null;
                    if (!u || !u.hostname.includes('blob.core.windows.net')) return;
                    const parts = u.pathname.split('/').filter(Boolean);
                    if (parts.length < 2) return;
                    const blobName = parts.slice(1).join('/');
                    let funcUrl = process.env.AZURE_REELS_DELETE_URL || process.env.AZURE_DELETE_FUNCTION_URL || '';
                    if (!funcUrl) funcUrl = 'https://reels-function.azurewebsites.net/api/reels/delete';
                    const funcObj = new URL(funcUrl);
                    funcObj.searchParams.set('blobName', blobName);
                    const key = process.env.AZURE_FUNCTION_KEY || '';
                    if (key && !funcObj.searchParams.get('code')) funcObj.searchParams.set('code', key);
                    const opts = { method: 'DELETE', hostname: funcObj.hostname, path: funcObj.pathname + funcObj.search, headers: {} };
                    if (key) opts.headers['x-functions-key'] = key;
                    const client = funcObj.protocol === 'https:' ? https : http;
                    const reqDel = client.request(opts, (resp) => {
                        const chunks = [];
                        resp.on('data', d => chunks.push(d));
                        resp.on('end', () => {});
                    });
                    reqDel.on('error', () => {});
                    reqDel.end();
                } catch (_) {}
            });
            deleteReel(req, res);
        });
    } catch (_) {
        deleteReel(req, res);
    }
});

/**
 * @route   GET /api/studio/reels/pending-seller-reels
 * @desc    Get all pending seller reels for admin approval
 * @access  Private (Admin only)
 */
router.get('/pending-seller-reels', verifyToken, (req, res) => {
    // Import the function here to avoid circular dependencies
    const { getAllPendingSellerReels } = require('../Controller/Studio/ReelsController');
    getAllPendingSellerReels(req, res);
});

/**
 * @route   GET /api/studio/reels/approved-seller-reels
 * @desc    Get all approved seller reels for admin list
 * @access  Private (Admin only)
 */
router.get('/approved-seller-reels', verifyToken, (req, res) => {
    const { getAllApprovedSellerReels } = require('../Controller/Studio/ReelsController');
    getAllApprovedSellerReels(req, res);
});
module.exports = router;
