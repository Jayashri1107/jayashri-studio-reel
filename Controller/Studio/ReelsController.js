const db = require('../../Config/db')
const dbSagar = require('../../Config/db_sagar')
const fs = require('fs')
const http = require('http')
const https = require('https')
const FormData = require('form-data')

const AZURE_UPLOAD_URL = process.env.AZURE_UPLOAD_URL
    || (process.env.AZURE_UPLOAD_BASE_URL ? `${process.env.AZURE_UPLOAD_BASE_URL.replace(/\/$/, '')}/api/UploadReel` : '')
    || 'https://reels-function.azurewebsites.net/api/reels/upload';

const AZURE_REELS_ENDPOINTS = {
  UPLOAD: process.env.AZURE_UPLOAD_URL || 'https://reels-function.azurewebsites.net/api/reels/upload',
  EDIT: process.env.AZURE_REELS_EDIT_URL || 'https://reels-function.azurewebsites.net/api/reels/edit',
  DELETE: process.env.AZURE_REELS_DELETE_URL || 'https://reels-function.azurewebsites.net/api/reels/delete?code=jIItzrj8IZ2gnytPJrgyMfuQGtpG3p4LS1u18TDXL9eyAzFuvrVG8Q=='
};
let SAS_WARNING_SHOWN = false;
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

// Helper function to strip SAS token from URL (for saving to database)
const stripSASToken = (url) => {
    if (!url || !url.trim()) return url;
    // Remove everything after ? (SAS token parameters)
    if (url.includes('?')) {
        return url.split('?')[0];
    }
    return url;
};

// Helper function to validate and check SAS token expiration
const validateSASToken = (sasToken) => {
    if (!sasToken || !sasToken.trim()) {
        return { valid: false, error: 'SAS token is empty or not set' };
    }
    
    const cleanSas = String(sasToken).trim().replace(/^\?/, '');
    
    // Check if token has required parameters
    if (!cleanSas.includes('sv=') && !cleanSas.includes('sig=')) {
        return { valid: false, error: 'SAS token format invalid - missing sv= or sig= parameters' };
    }
    
    // Check expiration date (se= parameter)
    const expiryMatch = cleanSas.match(/se=([^&]+)/);
    if (expiryMatch) {
        try {
            const expiryDate = new Date(decodeURIComponent(expiryMatch[1]));
            const now = new Date();
            
            if (expiryDate < now) {
                return { 
                    valid: false, 
                    error: `SAS token has EXPIRED. Expiry date: ${expiryDate.toISOString()}. Please generate a new token.`,
                    expired: true,
                    expiryDate: expiryDate
                };
            }
            
            // Warn if token expires within 30 days
            const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry < 30) {
                return { 
                    valid: true, 
                    warning: `SAS token expires in ${daysUntilExpiry} days (${expiryDate.toISOString()}). Consider renewing it.`,
                    expiryDate: expiryDate
                };
            }
            
            return { valid: true, expiryDate: expiryDate };
        } catch (e) {
            console.warn('[validateSASToken] Could not parse expiry date:', e);
        }
    }
    
    return { valid: true };
};

// Helper function to check if URL is an Azure blob storage URL
const isAzureBlobUrl = (url) => {
    if (!url || !url.trim()) return false;
    return url.includes('blob.core.windows.net') || 
           url.includes('reelsstorage.blob.core.windows.net') ||
           url.includes('.blob.core.windows.net');
};

// Helper function to check if URL is a local URL (doesn't need SAS token)
const isLocalUrl = (url) => {
    if (!url || !url.trim()) return false;
    // Check for local paths
    if (url.startsWith('/uploads/') || url.startsWith('/uploads')) return true;
    if (url.startsWith('./uploads/') || url.startsWith('./uploads')) return true;
    // Check for localhost URLs (but not Azure URLs)
    // if (url.includes('localhost') && !isAzureBlobUrl(url)) return true;
    if (url.includes('studio-api.ipshopy.com') && !isAzureBlobUrl(url)) return true;
    // if (url.includes('127.0.0.1') && !isAzureBlobUrl(url)) return true;
    // Check if it's a relative path (starts with / but not http)
    if (url.startsWith('/') && !url.startsWith('http')) return true;
    return false;
};

// Enhanced version of appendSAS that provides better error handling
const appendSAS = (url) => {
    try {
        if (!url || !url.trim()) {
            console.warn('[appendSAS] Empty or invalid URL provided');
            return url;
        }

        if (AZURE_SAS_DISABLED) {
            console.log('[appendSAS] SAS disabled via AZURE_SAS_DISABLED=true; returning URL as-is.');
            return url;
        }
        
        // Check if URL is local - local URLs don't need SAS tokens
        if (isLocalUrl(url)) {
            // For local URLs, just return as-is (no SAS token needed)
            return url;
        }
        
        // Check if URL is an Azure blob storage URL
        const isAzureUrl = isAzureBlobUrl(url);
        
        // If URL already has SAS token, return as-is (but verify it's valid)
        if (url.includes('sig=') || url.includes('sv=')) {
            if (isAzureUrl) {
                console.log('[appendSAS] Azure URL already contains SAS token');
            }
            return url;
        }
        
        // Only Azure URLs need SAS tokens
        if (!isAzureUrl) {
            // Not an Azure URL and not local - return as-is (might be external URL)
            return url;
        }
        
        // For Azure blob URLs, SAS token is REQUIRED
        const { token: sas, source } = resolveSasToken();
        if (!sas || !sas.trim()) {
            if (!SAS_WARNING_SHOWN) {
                SAS_WARNING_SHOWN = true;
                console.error('[appendSAS] ERROR: Azure blob URL requires SAS token but no SAS env var was found.');
                console.error('[appendSAS] URL:', url.substring(0, 150));
                console.error('[appendSAS] Checked env keys:', SAS_ENV_KEYS.join(', '));
                console.error('[appendSAS] Please add your Azure SAS query string (e.g. ?sv=...&sig=...) to one of the above env vars.');
            }
            // Still return the URL, but it will likely fail to load
            return url;
        }
        
        // Validate SAS token (check expiration, format, etc.)
        const validation = validateSASToken(sas);
        if (!validation.valid) {
            console.error('[appendSAS] ERROR: SAS token validation failed:', validation.error);
            if (validation.expired) {
                console.error('[appendSAS] CRITICAL: SAS token has EXPIRED! Videos will not load until you generate a new token.');
                console.error('[appendSAS] Please generate a new SAS token in Azure Portal and update your .env file');
            }
            // Still try to use it, but log the error
        } else if (validation.warning) {
            console.warn('[appendSAS] WARNING:', validation.warning);
        }
        
        const cleanSas = String(sas).trim().replace(/^\?/, '');
        
        const finalUrl = url.includes('?') ? `${url}&${cleanSas}` : `${url}?${cleanSas}`;
        
        // Verify the final URL has the SAS token
        if (!finalUrl.includes('sig=') && !finalUrl.includes('sv=')) {
            console.error('[appendSAS] ERROR: Failed to append valid SAS token. Check AZURE_BLOB_SAS_QUERY format.');
            console.error('[appendSAS] SAS token should contain: ?sv=...&sig=...');
        } else {
            console.log('[appendSAS] Successfully appended SAS token.', {
                source,
                urlLength: finalUrl.length,
                sasLength: cleanSas.length
            });
        }
        
        return finalUrl;
    } catch (error) {
        console.error('[appendSAS] Error appending SAS token:', error);
        console.error('[appendSAS] Original URL:', url?.substring(0, 100));
        return url;
    }
}



// Azure Functions Integration
const uploadToAzureDirect = (formData) => {
    return new Promise((resolve, reject) => {
        try {
            const urlObj = new URL(AZURE_REELS_ENDPOINTS.UPLOAD);

            const headers = {
                // Don't set Content-Type header when using FormData
                // It will be set automatically with the correct boundary
            };

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
                            resolve(json);
                        } catch {
                            resolve({ success: true, message: body, url: body });
                        }
                    } else {
                        reject(new Error(body || String(res.statusCode)));
                    }
                });
            });

            req.on('error', reject);

            // Pipe the form data
            formData.pipe(req);
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Edit reel video in Azure Blob
 * @param {string} oldBlobPath - Existing blob path from DB
 * @param {FormData} formData - New video file
 */
const editReelAzure = (oldBlobPath, formData) => {
  return new Promise((resolve, reject) => {
    try {
      const blobPath = stripSASToken(String(oldBlobPath || ''));
      
      if (!blobPath || blobPath.trim() === '') {
        return reject(new Error('Invalid old blob path provided'));
      }
      
      const run = () => {
        const urlObj = new URL(AZURE_REELS_ENDPOINTS.EDIT);
        const headers = {
          "x-old-blob": blobPath,
          ...formData.getHeaders(),
        };
        const functionKey = process.env.AZURE_FUNCTION_KEY;
        if (functionKey) headers['x-functions-key'] = functionKey;
        if (functionKey && !urlObj.searchParams.get('code')) {
          urlObj.searchParams.set('code', functionKey);
        }
        const options = {
          method: "PUT",
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          headers,
        };
        const client = urlObj.protocol === "https:" ? https : http;
        const req = client.request(options, (res) => {
          const chunks = [];
          res.on("data", (d) => chunks.push(d));
          res.on("end", () => {
            const body = Buffer.concat(chunks).toString("utf8");
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(body));
              } catch {
                resolve({ success: true, message: body });
              }
            } else {
              reject(new Error(body || `HTTP ${res.statusCode}`));
            }
          });
        });
        req.on("error", reject);
        formData.pipe(req);
      };
      if (isAzureBlobUrl(blobPath)) {
        let testUrl = blobPath;
        if (!AZURE_SAS_DISABLED) {
          const { token: sas } = resolveSasToken();
          if (sas && String(sas).trim()) {
            testUrl = appendSAS(blobPath);
          }
        }
        try {
          const u = new URL(testUrl);
          const optionsHead = { method: 'HEAD', hostname: u.hostname, path: u.pathname + u.search };
          const clientHead = u.protocol === 'https:' ? https : http;
          const reqHead = clientHead.request(optionsHead, (resp) => {
            const ok = (resp.statusCode || 0) >= 200 && (resp.statusCode || 0) < 300;
            if (!ok) {
              return reject(new Error('Azure blob not accessible'));
            }
            run();
          });
          reqHead.on('error', () => run());
          reqHead.end();
        } catch {
          run();
        }
      } else {
        run();
      }

    } catch (err) {
      reject(err);
    }
  });
};

const deleteReelAzure = (reelId) => {
    return new Promise((resolve, reject) => {
        try {
            // Construct the delete URL with the reel ID and auth code
            const deleteUrl = AZURE_REELS_ENDPOINTS.DELETE;
            const urlObj = new URL(deleteUrl);
            
            // Add the reel ID as a query parameter
            urlObj.searchParams.set('id', reelId);

            const headers = {
                'Content-Type': 'application/json'
            };

            const options = {
                method: 'DELETE',
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
                            resolve(json);
                        } catch {
                            resolve({ success: true, message: body });
                        }
                    } else {
                        reject(new Error(body || String(res.statusCode)));
                    }
                });
            });

            req.on('error', reject);
            req.end();
        } catch (err) {
            reject(err);
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

            const sanitizedFilename = sanitizeFilename(filename);
            const urlObj = new URL(AZURE_UPLOAD_URL);

            const headers = {
                'Content-Type': mimetype || 'video/mp4',
                'x-filename': sanitizedFilename,
                'Content-Length': fs.statSync(filePath).size
            };

            const functionKey = process.env.AZURE_FUNCTION_KEY;
            if (functionKey) headers['x-functions-key'] = functionKey;

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
}

// Get all sellers from oc_vendor table in sagar database
const getSellers = async (req, res) => {
    try {
        const query = `
            SELECT vendor_id, firstname, lastname, email 
            FROM oc_vendor 
            WHERE approved = 1
            ORDER BY firstname, lastname
        `;
        
        dbSagar.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching sellers:', err)
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching sellers',
                    error: err.message 
                })
            }
            
            return res.status(200).json({
                success: true,
                data: results
            })
        })
    } catch (error) {
        console.error('Get sellers error:', error)
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch sellers',
            error: error.message 
        })
    }
}

// Get all product names from sagar database for autocomplete
const getAllProductNames = async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT p.product_id as id, pd.name
            FROM oc_product p
            JOIN oc_product_description pd ON p.product_id = pd.product_id
            WHERE pd.language_id = 1
            ORDER BY pd.name
        `;
        
        dbSagar.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching all product names:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching product names',
                    error: err.message 
                });
            }
            
            return res.status(200).json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('Get all product names error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch product names',
            error: error.message 
        });
    }
};

// Get products for a specific seller from oc_vendor_to_product and oc_product tables in sagar database
const getSellerProducts = async (req, res) => {
    const { vendorId } = req.params;
    
    if (!vendorId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Vendor ID is required' 
        })
    }
    
    try {
        const query = `
            SELECT p.product_id, p.model, pd.name, p.price
            FROM oc_vendor_to_product vtp
            JOIN oc_product p ON vtp.product_id = p.product_id
            JOIN oc_product_description pd ON p.product_id = pd.product_id
            WHERE vtp.vendor_id = ? AND pd.language_id = 1
            ORDER BY pd.name
        `;
        
        dbSagar.query(query, [vendorId], (err, results) => {
            if (err) {
                console.error('Error fetching seller products:', err)
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching seller products',
                    error: err.message 
                })
            }
            
            return res.status(200).json({
                success: true,
                data: results
            })
        })
    } catch (error) {
        console.error('Get seller products error:', error)
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch seller products',
            error: error.message 
        })
    }
};

// Get all manufacturers/brands from oc_manufacturer table in sagar database
const getBrands = async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT m.manufacturer_id as id, m.name
            FROM oc_manufacturer m
            JOIN oc_product p ON m.manufacturer_id = p.manufacturer_id
            WHERE p.status = 1
            ORDER BY m.name
        `;
        
        dbSagar.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching brands:', err)
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching brands',
                    error: err.message 
                })
            }
            
            return res.status(200).json({
                success: true,
                data: results
            })
        })
    } catch (error) {
        console.error('Get brands error:', error)
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch brands',
            error: error.message 
        })
    }
}

// Get products for a specific brand/manufacturer from product table in sagar database
const getBrandProducts = async (req, res) => {
    const { brandId } = req.params;
    
    if (!brandId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Brand ID is required' 
        })
    }
    
    try {
        const query = `
            SELECT p.product_id as id, p.model, pd.name, p.price
            FROM oc_product p
            JOIN oc_product_description pd ON p.product_id = pd.product_id
            WHERE p.manufacturer_id = ? AND pd.language_id = 1
            ORDER BY pd.name
        `;
        
        dbSagar.query(query, [brandId], (err, results) => {
            if (err) {
                console.error('Error fetching brand products:', err)
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching brand products',
                    error: err.message 
                })
            }
            
            return res.status(200).json({
                success: true,
                data: results
            })
        })
    } catch (error) {
        console.error('Get brand products error:', error)
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch brand products',
            error: error.message 
        })
    }
};

// Get all products from sagar database
const getAllProducts = async (req, res) => {
    try {
        const query = `
            SELECT p.product_id as id, p.model, pd.name, p.price
            FROM oc_product p
            JOIN oc_product_description pd ON p.product_id = pd.product_id
            WHERE pd.language_id = 1
            ORDER BY pd.name
        `;
        
        dbSagar.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching all products:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching products',
                    error: err.message 
                });
            }
            
            return res.status(200).json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('Get all products error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch products',
            error: error.message 
        });
    }
};

// Get categories from ipshopy_reels database
// Get categories from ipshopy_reels database
const getCategories = async (req, res) => {
    try {
        // Only include active categories (status = 1)
        const query = `
            SELECT reel_category_id as id, name, status
            FROM oc_reel_category
            WHERE status = 1
            ORDER BY sort_order, name
        `;
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching categories:', err)
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching categories',
                    error: err.message 
                })
            }
            
            return res.status(200).json({
                success: true,
                data: results
            })
        })
    } catch (error) {
        console.error('Get categories error:', error)
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch categories',
            error: error.message 
        })
    }
};

// Get related products based on selected products
const getRelatedProducts = async (req, res) => {
    const { selectedProductIds, associationType, vendorId, brandId } = req.body;
    
    if (!selectedProductIds || !Array.isArray(selectedProductIds) || selectedProductIds.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Selected product IDs are required' 
        })
    }
    
    if (!associationType || (associationType !== 'seller' && associationType !== 'brand')) {
        return res.status(400).json({ 
            success: false, 
            message: 'Valid association type (seller or brand) is required' 
        })
    }
    
    if (associationType === 'seller' && !vendorId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Vendor ID is required for seller association' 
        })
    }
    
    if (associationType === 'brand' && !brandId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Brand ID is required for brand association' 
        })
    }
    
    try {
        let query = '';
        let queryParams = [];
        
        if (associationType === 'seller') {
            // For sellers, get other products from the same vendor
            query = `
                SELECT p.product_id, p.model, pd.name, p.price
                FROM oc_vendor_to_product vtp
                JOIN oc_product p ON vtp.product_id = p.product_id
                JOIN oc_product_description pd ON p.product_id = pd.product_id
                WHERE vtp.vendor_id = ? 
                AND vtp.product_id NOT IN (?)
                AND pd.language_id = 1
                ORDER BY RAND()
                LIMIT 3
            `;
            queryParams = [vendorId, selectedProductIds];
        } else {
            // For brands, get other products from the same brand
            query = `
                SELECT p.product_id as id, p.model, pd.name, p.price
                FROM oc_product p
                JOIN oc_product_description pd ON p.product_id = pd.product_id
                WHERE p.manufacturer_id = ?
                AND p.product_id NOT IN (?)
                AND pd.language_id = 1
                ORDER BY RAND()
                LIMIT 3
            `;
            queryParams = [brandId, selectedProductIds];
        }
        
        dbSagar.query(query, queryParams, (err, results) => {
            if (err) {
                console.error('Error fetching related products:', err)
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching related products',
                    error: err.message 
                })
            }
            
            return res.status(200).json({
                success: true,
                data: results
            })
        })
    } catch (error) {
        console.error('Get related products error:', error)
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch related products',
            error: error.message 
        })
    }
};

// Get product names by IDs from sagar database
const getProductNamesByIds = async (req, res) => {
    const { productIds } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'Product IDs are required' 
        });
    }
    
    try {
        // Create placeholders for the IN clause
        const placeholders = productIds.map(() => '?').join(',');
        // Prefer language_id = 1, but gracefully fall back to any available description
        const query = `
            SELECT 
                p.product_id AS id,
                COALESCE(pd1.name, pd_any.name) AS name
            FROM oc_product p
            LEFT JOIN oc_product_description pd1 
                ON p.product_id = pd1.product_id AND pd1.language_id = 1
            LEFT JOIN oc_product_description pd_any 
                ON p.product_id = pd_any.product_id
            WHERE p.product_id IN (${placeholders})
            GROUP BY p.product_id
        `;
        
        dbSagar.query(query, productIds, (err, results) => {
            if (err) {
                console.error('Error fetching product names:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching product names',
                    error: err.message 
                });
            }
            
            // Create a map of found products
            const foundProductsMap = {};
            results.forEach(product => {
                foundProductsMap[product.id] = product.name || 'Unknown Product';
            });
            
            // Return results as an array for easier frontend processing
            // Include all requested product IDs, even if not found in database
            const productArray = productIds.map(pid => ({
                id: pid,
                product_id: pid, // Include both for compatibility
                name: foundProductsMap[pid] || `Product ${pid}` // Fallback name if not found
            }));
            
            return res.status(200).json({
                success: true,
                data: productArray
            });
        });
    } catch (error) {
        console.error('Get product names error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch product names',
            error: error.message 
        });
    }
};

// Increment view count for a reel
const incrementReelView = async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ 
            success: false, 
            message: 'Reel ID is required' 
        });
    }
    
    try {
        // First, check if the reel exists
        const checkQuery = `
            SELECT reel_id FROM (
                SELECT reel_id FROM oc_influencer_reels WHERE reel_id = ?
                UNION ALL
                SELECT reel_id FROM oc_seller_reels WHERE reel_id = ?
            ) AS reels
        `;
        
        db.query(checkQuery, [id, id], (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Error checking reel existence:', checkErr);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error processing view increment',
                    error: checkErr.message 
                });
            }
            
            if (checkResults.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Reel not found' 
                });
            }
            
            // Try to increment view count in oc_influencer_reels first
            const incrementInfluencerQuery = `
                UPDATE oc_influencer_reels
                SET views = views + 1 
                WHERE reel_id = ?
            `;
            
            db.query(incrementInfluencerQuery, [id], (incErr, incResult) => {
                if (incErr) {
                    console.error('Error incrementing influencer reel views:', incErr);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error incrementing view count',
                        error: incErr.message 
                    });
                }
                
                // If no rows were affected, try oc_seller_reels
                if (incResult.affectedRows === 0) {
                    const incrementSellerQuery = `
                        UPDATE oc_seller_reels
                        SET views = views + 1 
                        WHERE reel_id = ?
                    `;
                    
                    db.query(incrementSellerQuery, [id], (sellErr, sellResult) => {
                        if (sellErr) {
                            console.error('Error incrementing seller reel views:', sellErr);
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Error incrementing view count',
                                error: sellErr.message 
                            });
                        }
                        
                        if (sellResult.affectedRows === 0) {
                            return res.status(404).json({ 
                                success: false, 
                                message: 'Reel not found' 
                            });
                        }
                        
                        return res.status(200).json({
                            success: true,
                            message: 'View count incremented successfully'
                        });
                    });
                } else {
                    return res.status(200).json({
                        success: true,
                        message: 'View count incremented successfully'
                    });
                }
            });
        });
    } catch (error) {
        console.error('Increment reel view error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to increment view count',
            error: error.message 
        });
    }
};

// Toggle like for a reel
const toggleReelLike = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!id) {
        return res.status(400).json({ 
            success: false, 
            message: 'Reel ID is required' 
        });
    }
    
    if (!userId) {
        return res.status(400).json({ 
            success: false, 
            message: 'User ID is required' 
        });
    }
    
    try {
        // Check if user has already liked this reel
        const checkLikeQuery = `
            SELECT * FROM reel_likes 
            WHERE reel_id = ? AND user_id = ?
        `;
        
        db.query(checkLikeQuery, [id, userId], (checkErr, checkResults) => {
            if (checkErr) {
                console.error('Error checking existing like:', checkErr);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error processing like',
                    error: checkErr.message 
                });
            }
            
            if (checkResults.length > 0) {
                // User has already liked this reel, so remove the like (unlike)
                const removeLikeQuery = `
                    DELETE FROM reel_likes 
                    WHERE reel_id = ? AND user_id = ?
                `;
                
                db.query(removeLikeQuery, [id, userId], (removeErr, removeResult) => {
                    if (removeErr) {
                        console.error('Error removing like:', removeErr);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Error removing like',
                            error: removeErr.message 
                        });
                    }
                    
                    // Decrement like count in the appropriate table
                    const decrementLikesQuery = `
                        UPDATE oc_influencer_reels
                        SET likes = likes - 1 
                        WHERE reel_id = ?
                    `;
                    
                    db.query(decrementLikesQuery, [id], (decErr, decResult) => {
                        if (decErr) {
                            console.error('Error decrementing influencer reel likes:', decErr);
                            // Try seller reels
                            const decrementSellerLikesQuery = `
                                UPDATE oc_seller_reels
                                SET likes = likes - 1 
                                WHERE reel_id = ?
                            `;
                            
                            db.query(decrementSellerLikesQuery, [id], (sellDecErr, sellDecResult) => {
                                if (sellDecErr) {
                                    console.error('Error decrementing seller reel likes:', sellDecErr);
                                }
                                // We still return success even if decrement fails
                            });
                        }
                        
                        return res.status(200).json({
                            success: true,
                            message: 'Reel unliked successfully',
                            liked: false
                        });
                    });
                });
            } else {
                // User hasn't liked this reel yet, so add the like
                const addLikeQuery = `
                    INSERT INTO reel_likes (reel_id, user_id, created_at)
                    VALUES (?, ?, NOW())
                `;
                
                db.query(addLikeQuery, [id, userId], (addErr, addResult) => {
                    if (addErr) {
                        console.error('Error adding like:', addErr);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Error adding like',
                            error: addErr.message 
                        });
                    }
                    
                    // Increment like count in the appropriate table
                    const incrementLikesQuery = `
                        UPDATE oc_influencer_reels
                        SET likes = likes + 1 
                        WHERE reel_id = ?
                    `;
                    
                    db.query(incrementLikesQuery, [id], (incErr, incResult) => {
                        if (incErr) {
                            console.error('Error incrementing influencer reel likes:', incErr);
                            // Try seller reels
                            const incrementSellerLikesQuery = `
                                UPDATE oc_seller_reels
                                SET likes = likes + 1 
                                WHERE reel_id = ?
                            `;
                            
                            db.query(incrementSellerLikesQuery, [id], (sellIncErr, sellIncResult) => {
                                if (sellIncErr) {
                                    console.error('Error incrementing seller reel likes:', sellIncErr);
                                }
                                // We still return success even if increment fails
                            });
                        }
                        
                        return res.status(200).json({
                            success: true,
                            message: 'Reel liked successfully',
                            liked: true
                        });
                    });
                });
            }
        });
    } catch (error) {
        console.error('Toggle reel like error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to toggle reel like',
            error: error.message 
        });
    }
};

// Toggle follow for a reel creator
const toggleCreatorFollow = async (req, res) => {
    const { id } = req.params; // This is the reel ID
    const userId = req.user.id; // This is the follower ID
    
    if (!id) {
        return res.status(400).json({ 
            success: false, 
            message: 'Reel ID is required' 
        });
    }
    
    if (!userId) {
        return res.status(400).json({ 
            success: false, 
            message: 'User ID is required' 
        });
    }
    
    try {
        // First, get the creator ID from the reel
        const getCreatorQuery = `
            SELECT influencer_id as creator_id FROM oc_influencer_reels WHERE reel_id = ?
            UNION
            SELECT seller_id as creator_id FROM oc_seller_reels WHERE reel_id = ?
        `;
        
        db.query(getCreatorQuery, [id, id], (creatorErr, creatorResults) => {
            if (creatorErr) {
                console.error('Error fetching creator:', creatorErr);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error processing follow',
                    error: creatorErr.message 
                });
            }
            
            if (creatorResults.length === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Reel not found' 
                });
            }
            
            const creatorId = creatorResults[0].creator_id;
            
            // Check if user is already following this creator
            const checkFollowQuery = `
                SELECT * FROM follows 
                WHERE follower_id = ? AND following_id = ?
            `;
            
            db.query(checkFollowQuery, [userId, creatorId], (checkErr, checkResults) => {
                if (checkErr) {
                    console.error('Error checking existing follow:', checkErr);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error processing follow',
                        error: checkErr.message 
                    });
                }
                
                if (checkResults.length > 0) {
                    // User is already following, so unfollow
                    const unfollowQuery = `
                        DELETE FROM follows 
                        WHERE follower_id = ? AND following_id = ?
                    `;
                    
                    db.query(unfollowQuery, [userId, creatorId], (unfollowErr, unfollowResult) => {
                        if (unfollowErr) {
                            console.error('Error unfollowing creator:', unfollowErr);
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Error unfollowing creator',
                                error: unfollowErr.message 
                            });
                        }
                        
                        return res.status(200).json({
                            success: true,
                            message: 'Unfollowed creator successfully',
                            following: false
                        });
                    });
                } else {
                    // User is not following, so follow
                    // First check if trying to follow self
                    if (userId == creatorId) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Cannot follow yourself' 
                        });
                    }
                    
                    const followQuery = `
                        INSERT INTO follows (follower_id, following_id, created_at)
                        VALUES (?, ?, NOW())
                    `;
                    
                    db.query(followQuery, [userId, creatorId], (followErr, followResult) => {
                        if (followErr) {
                            console.error('Error following creator:', followErr);
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Error following creator',
                                error: followErr.message 
                            });
                        }
                        
                        return res.status(200).json({
                            success: true,
                            message: 'Followed creator successfully',
                            following: true
                        });
                    });
                }
            });
        });
    } catch (error) {
        console.error('Toggle creator follow error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to toggle creator follow',
            error: error.message 
        });
    }
};

// Upload a new influencer reel
const uploadInfluencerReel = async (req, res) => {
    // Log the received data for debugging
    console.log('=== NEW INFLUENCER REEL UPLOAD REQUEST ===')
    console.log('Request headers:', req.headers)
    console.log('Request content-type:', req.headers['content-type'])
    console.log('Received upload request data:', {
        body: req.body,
        files: req.files
    })
    
    // Log the structure of req.files if it exists
    if (req.files) {
        console.log('Files structure:', Object.keys(req.files));
        if (req.files.video) {
            console.log('Video file info:', req.files.video)
        }
        if (req.files.thumbnail) {
            console.log('Thumbnail file info:', req.files.thumbnail)
        }
    }
    
    // Check if any form data was received at all
    if (!req.body || Object.keys(req.body).length === 0) {
        console.log('ERROR: No form data received in request body')
        console.log('Request object keys:', Object.keys(req))
        if (req.body) {
            console.log('Request body keys:', Object.keys(req.body))
        }
        return res.status(400).json({ 
            success: false, 
            message: 'No form data received' 
        })
    }
    
    // Log individual fields for debugging
    console.log('Individual fields in req.body:', {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        associationType: req.body.associationType,
        selectedBrand: req.body.selectedBrand,
        selectedProducts: req.body.selectedProducts
    })
    
    // Extract text fields from req.body
    const { 
        title, 
        description, 
        category,  // Using 'category' as it's sent from frontend
        associationType = 'product', // Default to 'product' if not provided
        selectedBrand
    } = req.body;
    const otherCategoryName = req.body.otherCategoryName ? String(req.body.otherCategoryName).trim() : '';
    
    // Extract selected products (may be sent as JSON string, CSV string, or array)
    let selectedProducts = req.body.selectedProducts;
    if (typeof selectedProducts === 'string') {
        try {
            const parsed = JSON.parse(selectedProducts);
            selectedProducts = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            selectedProducts = String(selectedProducts)
                .split(',')
                .map(id => parseInt(String(id).trim(), 10))
                .filter(id => !Number.isNaN(id));
        }
    }
    if (Array.isArray(selectedProducts)) {
        selectedProducts = selectedProducts
            .map(id => parseInt(id, 10))
            .filter(id => !Number.isNaN(id));
    }
    
    const userId = req.user ? req.user.id : 1; // From auth middleware, fallback to 1 for testing
    const uploaderType = 'influencer'; // Influencers always have 'influencer' uploader type
    
    // Log parsed data
    console.log('Parsed data:', {
        title,
        description,
        category,
        associationType,
        selectedBrand,
        selectedProducts,
        userId,
        uploaderType
    })
    
    // Validation with detailed logging
    console.log('Starting validation checks...')
    
    if (!title) {
        console.log('Title validation failed - title is:', title)
        return res.status(400).json({ 
            success: false, 
            message: 'Title is required' 
        })
    }
    
    if (!category) {
        console.log('Category validation failed - category is:', category)
        return res.status(400).json({ 
            success: false, 
            message: 'Category is required' 
        })
    }
    
    // Association type validation
    if (associationType !== 'product' && associationType !== 'brand') {
        console.log('Association type validation failed:', associationType)
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid association type. Must be product or brand.' 
        })
    }
    
    console.log('Basic validation passed:', { title, category, associationType })
    
    // Check if video file is provided
    // Check if video file is provided (multer stores as array with upload.fields())
    const hasVideoFile = req.files && 
                        req.files.video && 
                        Array.isArray(req.files.video) && 
                        req.files.video.length > 0 && 
                        req.files.video[0];
    
    if (!hasVideoFile) {
        console.log('Video file validation failed - files:', req.files)
        console.log('Video file structure:', {
            hasFiles: !!req.files,
            hasVideo: !!(req.files && req.files.video),
            videoType: req.files && req.files.video ? typeof req.files.video : 'N/A',
            isArray: req.files && req.files.video ? Array.isArray(req.files.video) : false,
            videoLength: req.files && req.files.video && Array.isArray(req.files.video) ? req.files.video.length : 0
        });

        return res.status(400).json({ 
            success: false, 
            message: 'Video file is required' 
        })
    }
    
    // Validate video file format
    const videoFile = req.files.video[0];
    const allowedMimeTypes = [
        'video/mp4',
        'video/x-m4v',
        'video/quicktime', // .mov
        'video/x-msvideo', // .avi
        'video/x-matroska', // .mkv
        'video/webm',
        'video/x-flv',
        'video/x-ms-wmv', // .wmv
        'video/3gpp',
        'video/3gpp2'
    ];
    
    const allowedExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v', '.3gp', '.3g2'];
    const fileExtension = videoFile.originalname ? 
        videoFile.originalname.substring(videoFile.originalname.lastIndexOf('.')).toLowerCase() : '';
    
    const isValidMimeType = videoFile.mimetype && allowedMimeTypes.includes(videoFile.mimetype);
    const isValidExtension = fileExtension && allowedExtensions.includes(fileExtension);
    
    if (!isValidMimeType && !isValidExtension) {
        console.log('Invalid video file format:', {
            mimetype: videoFile.mimetype,
            extension: fileExtension,
            filename: videoFile.originalname
        });
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid video file format. Please upload MP4, MOV, AVI, MKV, WebM, FLV, or WMV format.' 
        });
    }
    
    console.log('Video file format validated:', {
        mimetype: videoFile.mimetype,
        extension: fileExtension,
        filename: videoFile.originalname,
        size: videoFile.size
    });
    // Enforce max 30s duration (client-provided metadata)
    const videoDurationClientInf = req.body.videoDuration ? parseFloat(String(req.body.videoDuration)) : NaN;
    if (!Number.isNaN(videoDurationClientInf) && videoDurationClientInf > 30.0) {
        return res.status(400).json({
            success: false,
            message: 'Video must be 30 seconds or less'
        });
    }
    
    // For 'brand' association type, brand is required
    if (associationType === 'brand' && !selectedBrand) {
        console.log('Brand validation failed for brand association type')
        return res.status(400).json({ 
            success: false, 
            message: 'Please select a brand for brand association' 
        })
    }
    
    if (!selectedProducts || selectedProducts.length === 0) {
        console.log('Products validation failed:', selectedProducts)
        return res.status(400).json({ 
            success: false, 
            message: 'Please select at least one product' 
        })
    }
    
    if (selectedProducts.length > 3) {
        return res.status(400).json({ 
            success: false, 
            message: 'You can select maximum 3 products' 
        })
    }
    
    // Handle file uploads
    // Save actual file paths to database
    // videoFile is already defined above in validation section (line 1095)
    let videoUrl = null;
    if (videoFile) {
        try {
            videoUrl = await uploadToAzure(videoFile.path, videoFile.originalname || videoFile.filename, videoFile.mimetype || 'application/octet-stream');
        } catch (e) {
            console.error('Azure upload failed:', e && e.message ? e.message : e);
        }
        if (videoUrl) {
            videoUrl = appendSAS(videoUrl)
            try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
        } else {
            try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
            return res.status(502).json({ success: false, message: 'Azure upload failed' });
        }
    }
    
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
    const thumbnailUrl = thumbnailFile ? `/uploads/${thumbnailFile.filename}` : null;
    
    // Log file information
    if (videoFile) {
        console.log('Video file details:', {
            originalname: videoFile.originalname,
            mimetype: videoFile.mimetype,
            size: videoFile.size,
            filename: videoFile.filename
        })
    }
    
    if (thumbnailFile) {
        console.log('Thumbnail file details:', {
            originalname: thumbnailFile.originalname,
            mimetype: thumbnailFile.mimetype,
            size: thumbnailFile.size,
            filename: thumbnailFile.filename
        })
    }
    
    // Start a database transaction to ensure data consistency
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting database connection:', err)
            return res.status(500).json({ 
                success: false, 
                message: 'Database connection error' 
            })
        }
        
        connection.beginTransaction((err) => {
            if (err) {
                connection.release()
                console.error('Error starting transaction:', err)
                return res.status(500).json({ 
                    success: false, 
                    message: 'Transaction error' 
                })
            }
            
            try {
                // Helper to process reel success (category + products + commit)
                const processReelSuccess = (reelId) => {
                    const proceedToProductsAndCommit = () => {
                        if (selectedProducts && selectedProducts.length > 0) {
                            const productQuery = `
                                INSERT INTO oc_influencer_reel_product
                                (reel_id, product_id) 
                                VALUES ?
                            `;
                            const productValues = selectedProducts.map(productId => [reelId, productId]);
                            
                            connection.query(productQuery, [productValues], (err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error('Database error inserting product associations:', err);
                                        return res.status(500).json({ 
                                            success: false, 
                                            message: 'Error saving product associations',
                                            error: err.message 
                                        });
                                    });
                                }
                                commitTransaction();
                            });
                        } else {
                            commitTransaction();
                        }
                    };

                    const commitTransaction = () => {
                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error('Error committing transaction:', err);
                                    return res.status(500).json({ 
                                        success: false, 
                                        message: 'Error saving reel data' 
                                    });
                                });
                            }
                            
                            connection.release();
                            
                            return res.status(201).json({
                                success: true,
                                message: 'Reel uploaded successfully',
                                data: { reelId }
                            });
                        });
                    };

                    const insertCategoryAssociation = (catId) => {
                        const categoryQuery = `
                            INSERT INTO oc_influencer_reel_to_category
                            (reel_id, category_id) 
                            VALUES (?, ?)
                        `;
                        connection.query(categoryQuery, [reelId, catId], (err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error('Database error inserting category association:', err);
                                    return res.status(500).json({ 
                                        success: false, 
                                        message: 'Error saving category association',
                                        error: err.message 
                                    });
                                });
                            }
                            proceedToProductsAndCommit();
                        });
                    };

                    if (String(category) === 'other' && otherCategoryName) {
                        const suggestQuery = `
                            INSERT INTO oc_reel_category (name, description, sort_order, status, date_added)
                            VALUES (?, NULL, 0, 0, NOW())
                        `;
                        connection.query(suggestQuery, [otherCategoryName], (err, result) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error('Database error inserting new category:', err);
                                    return res.status(500).json({
                                        success: false,
                                        message: 'Error saving new category',
                                        error: err.message
                                    });
                                });
                            }
                            insertCategoryAssociation(result.insertId);
                        });
                    } else {
                        const catIdInf = parseInt(category, 10);
                        if (!Number.isNaN(catIdInf)) {
                            insertCategoryAssociation(catIdInf);
                        } else {
                            proceedToProductsAndCommit();
                        }
                    }
                };

                // Insert the reel into the database (using oc_influencer_reels table)
                const influencerId = userId;
                const reelQuery = `
                    INSERT INTO oc_influencer_reels
                    (influencer_id, title, description, video_url, thumbnail, brand_id, status, date_added) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `;
                
                const descriptionToSaveInfluencer = description || null;
                const reelValues = [
                    influencerId,
                    title,
                    descriptionToSaveInfluencer,
                    videoUrl,
                    thumbnailUrl,
                    associationType === 'brand' ? selectedBrand : null,
                    0
                ];
                
                console.log('Inserting influencer reel with values:', {
                    influencerId,
                    title,
                    description: descriptionToSaveInfluencer,
                    videoUrl: videoUrl ? (videoUrl.substring(0, 100) + '...') : null,
                    thumbnailUrl,
                    brandId: associationType === 'brand' ? selectedBrand : null,
                    status: 0
                });
                console.log('Full video URL being saved:', videoUrl);
                
                connection.query(reelQuery, reelValues, (err, result) => {
                    if (err) {
                        const altQuery = `
                            INSERT INTO oc_influencer_reels
                            (influencer_id, title, description, video_url, thumbnail, status, date_added) 
                            VALUES (?, ?, ?, ?, ?, ?, NOW())
                        `;
                        const altValues = [
                            influencerId,
                            title,
                            descriptionToSaveInfluencer,
                            videoUrl,
                            thumbnailUrl,
                            0
                        ];
                        const needsAlt = (err && err.code === 'ER_BAD_FIELD_ERROR') || (err && /brand_id/i.test(err.message || ''));
                        if (needsAlt) {
                            connection.query(altQuery, altValues, (altErr, altResult) => {
                                if (altErr) {
                                    return connection.rollback(() => {
                                        connection.release()
                                        console.error('Database error inserting influencer reel:', altErr)
                                        return res.status(500).json({ 
                                            success: false, 
                                            message: 'Error saving reel',
                                            error: altErr.message 
                                        })
                                    })
                                }
                                const reelId = altResult.insertId;
                                console.log('Influencer reel inserted successfully, ID:', reelId)
                                processReelSuccess(reelId);
                            })
                        } else {
                            return connection.rollback(() => {
                                connection.release()
                                console.error('Database error inserting influencer reel:', err)
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Error saving reel',
                                    error: err.message 
                                })
                            })
                        }
                    }
                    
                    const reelId = result.insertId;
                    console.log('Influencer reel inserted successfully, ID:', reelId)
                    
                    if (String(category) === 'other' && otherCategoryName) {
                        const suggestQuery = `
                            INSERT INTO oc_reel_category (name, description, sort_order, status, date_added)
                            VALUES (?, NULL, 0, 0, NOW())
                        `;
                        connection.query(suggestQuery, [otherCategoryName], () => {});
                    }

                    // Insert category association
                    const categoryQuery = `
                        INSERT INTO oc_influencer_reel_to_category
                        (reel_id, category_id) 
                        VALUES (?, ?)
                    `;
                    const catIdInf = parseInt(category, 10);
                    if (!Number.isNaN(catIdInf)) {
                        connection.query(categoryQuery, [reelId, catIdInf], (err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release()
                                    console.error('Database error inserting category association:', err)
                                    return res.status(500).json({ 
                                        success: false, 
                                        message: 'Error saving category association',
                                        error: err.message 
                                    });
                                });
                            }
                            
                            // Insert product associations
                            if (selectedProducts && selectedProducts.length > 0) {
                                const productQuery = `
                                    INSERT INTO oc_influencer_reel_product
                                    (reel_id, product_id) 
                                    VALUES ?
                                `;
                                
                                const productValues = selectedProducts.map(productId => [reelId, productId]);
                                
                                connection.query(productQuery, [productValues], (err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release()
                                            console.error('Database error inserting product associations:', err)
                                            return res.status(500).json({ 
                                                success: false, 
                                                message: 'Error saving product associations',
                                                error: err.message 
                                            });
                                        });
                                    }
                                    
                                    // Commit the transaction
                                    connection.commit((err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release()
                                                console.error('Error committing transaction:', err)
                                                return res.status(500).json({ 
                                                    success: false, 
                                                    message: 'Error saving reel data' 
                                                })
                                            })
                                        }
                                        
                                        connection.release()
                                        
                                        return res.status(201).json({
                                            success: true,
                                            message: 'Reel uploaded successfully',
                                            data: { reelId }
                                        })
                                    })
                                })
                            } else {
                                // No products to associate, just commit the transaction
                                connection.commit((err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release()
                                            console.error('Error committing transaction:', err)
                                            return res.status(500).json({ 
                                                success: false, 
                                                message: 'Error saving reel data' 
                                            });
                                        });
                                    }
                                    
                                    connection.release()
                                    
                                    return res.status(201).json({
                                        success: true,
                                        message: 'Reel uploaded successfully',
                                        data: { reelId }
                                    });
                                })
                            }
                        })
                    } else {
                        // Insert product associations
                        if (selectedProducts && selectedProducts.length > 0) {
                            const productQuery = `
                                INSERT INTO oc_influencer_reel_product
                                (reel_id, product_id) 
                                VALUES ?
                            `;
                            
                            const productValues = selectedProducts.map(productId => [reelId, productId]);
                            
                            connection.query(productQuery, [productValues], (err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release()
                                        console.error('Database error inserting product associations:', err)
                                        return res.status(500).json({ 
                                            success: false, 
                                            message: 'Error saving product associations',
                                            error: err.message 
                                        });
                                    });
                                }
                                
                                // Commit the transaction
                                connection.commit((err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release()
                                            console.error('Error committing transaction:', err)
                                            return res.status(500).json({ 
                                                success: false, 
                                                message: 'Error saving reel data' 
                                            })
                                        })
                                    }
                                    
                                    connection.release()
                                    
                                    return res.status(201).json({
                                        success: true,
                                        message: 'Reel uploaded successfully',
                                        data: { reelId }
                                    })
                                })
                            })
                        } else {
                            // No products to associate, just commit the transaction
                            connection.commit((err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release()
                                        console.error('Error committing transaction:', err)
                                        return res.status(500).json({ 
                                            success: false, 
                                            message: 'Error saving reel data' 
                                        });
                                    });
                                }
                                
                                connection.release()
                                
                                return res.status(201).json({
                                    success: true,
                                    message: 'Reel uploaded successfully',
                                    data: { reelId }
                                });
                            })
                        }
                    }
                })
            } catch (error) {
                // Rollback the transaction on error
                connection.rollback(() => {
                    connection.release()
                    console.error('Error uploading reel:', error)
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error uploading reel',
                        error: error.message 
                    })
                })
            }
        })
    });
};

// Upload a new seller reel
const uploadSellerReel = async (req, res) => {
    // Similar implementation for seller reels using oc_seller_reels table
    // Log the received data for debugging
    console.log('=== NEW SELLER REEL UPLOAD REQUEST ===')
    console.log('Request headers:', req.headers)
    console.log('Request content-type:', req.headers['content-type'])
    console.log('Received upload request data:', {
        body: req.body,
        files: req.files
    })
    
    // Log the structure of req.files if it exists
    if (req.files) {
        console.log('Files structure:', Object.keys(req.files));
        if (req.files.video) {
            console.log('Video file info:', req.files.video)
        }
        if (req.files.thumbnail) {
            console.log('Thumbnail file info:', req.files.thumbnail)
        }
    }
    
    // Check if any form data was received at all
    if (!req.body || Object.keys(req.body).length === 0) {
        console.log('ERROR: No form data received in request body')
        console.log('Request object keys:', Object.keys(req))
        if (req.body) {
            console.log('Request body keys:', Object.keys(req.body))
        }
        return res.status(400).json({ 
            success: false, 
            message: 'No form data received' 
        })
    }
    
    // Log individual fields for debugging
    console.log('Individual fields in req.body:', {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        associationType: req.body.associationType,
        selectedBrand: req.body.selectedBrand,
        selectedProducts: req.body.selectedProducts
    })
    
    // Extract text fields from req.body
    const { 
        title, 
        description, 
        category,  // Using 'category' as it's sent from frontend
        associationType = 'product', // Default to 'product' if not provided
        selectedBrand,
        selectedSeller,  // Seller vendor_id from frontend
        otherCategoryName
    } = req.body;
    
    // Extract selected products (may be sent as JSON string, CSV string, or array)
    let selectedProducts = req.body.selectedProducts;
    if (typeof selectedProducts === 'string') {
        try {
            const parsed = JSON.parse(selectedProducts);
            selectedProducts = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
            selectedProducts = String(selectedProducts)
                .split(',')
                .map(id => parseInt(String(id).trim(), 10))
                .filter(id => !Number.isNaN(id));
        }
    }
    if (Array.isArray(selectedProducts)) {
        selectedProducts = selectedProducts
            .map(id => parseInt(id, 10))
            .filter(id => !Number.isNaN(id));
    }
    
    const userId = req.user ? req.user.id : 1; // From auth middleware, fallback to 1 for testing
    const uploaderType = 'seller'; // Sellers always have 'seller' uploader type
    
    // Log parsed data
    console.log('Parsed data:', {
        title,
        description,
        category,
        associationType,
        selectedBrand,
        selectedProducts,
        userId,
        uploaderType
    })
    
    // Validation with detailed logging
    console.log('Starting validation checks...')
    
    if (!title) {
        console.log('Title validation failed - title is:', title)
        return res.status(400).json({ 
            success: false, 
            message: 'Title is required' 
        })
    }
    
    if (!category) {
        console.log('Category validation failed - category is:', category)
        return res.status(400).json({ 
            success: false, 
            message: 'Category is required' 
        })
    }
    
    // Association type validation
    if (associationType !== 'product' && associationType !== 'brand') {
        console.log('Association type validation failed:', associationType)
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid association type. Must be product or brand.' 
        })
    }
    
    console.log('Basic validation passed:', { title, category, associationType })
    
    // Check if video file is provided (multer stores as array with upload.fields())
    const hasVideoFile = req.files && 
                        req.files.video && 
                        Array.isArray(req.files.video) && 
                        req.files.video.length > 0 && 
                        req.files.video[0];
    
    if (!hasVideoFile) {
        console.log('Video file validation failed:', {
            hasFiles: !!req.files,
            hasVideo: !!(req.files && req.files.video),
            videoType: req.files && req.files.video ? typeof req.files.video : 'N/A',
            isArray: req.files && req.files.video ? Array.isArray(req.files.video) : false,
            videoLength: req.files && req.files.video && Array.isArray(req.files.video) ? req.files.video.length : 0,
            filesKeys: req.files ? Object.keys(req.files) : []
        });

        return res.status(400).json({ 
            success: false, 
            message: 'Video file is required' 
        })
    }
    // Enforce max 30s duration (client-provided metadata)
    const videoDurationClientSel = req.body.videoDuration ? parseFloat(String(req.body.videoDuration)) : NaN;
    if (!Number.isNaN(videoDurationClientSel) && videoDurationClientSel > 30.0) {
        return res.status(400).json({
            success: false,
            message: 'Video must be 30 seconds or less'
        });
    }
    
    // For 'brand' association type, brand is required
    if (associationType === 'brand' && !selectedBrand) {
        console.log('Brand validation failed for brand association type')
        return res.status(400).json({ 
            success: false, 
            message: 'Please select a brand for brand association' 
        })
    }
    
    if (!selectedProducts || selectedProducts.length === 0) {
        console.log('Products validation failed:', selectedProducts)
        return res.status(400).json({ 
            success: false, 
            message: 'Please select at least one product' 
        })
    }
    
    if (selectedProducts.length > 3) {
        return res.status(400).json({ 
            success: false, 
            message: 'You can select maximum 3 products' 
        })
    }
    
    // Handle file uploads
    // Save actual file paths to database
    const videoFile = req.files.video ? req.files.video[0] : null;
    let videoUrl = null;
    if (videoFile) {
        try {
            videoUrl = await uploadToAzure(videoFile.path, videoFile.originalname || videoFile.filename, videoFile.mimetype || 'application/octet-stream');
        } catch (e) {
            console.error('Azure upload failed:', e && e.message ? e.message : e);
        }
        if (videoUrl) {
            // IMPORTANT: Save video URL WITHOUT SAS token to database
            // SAS tokens expire, so we append them dynamically when retrieving
            videoUrl = stripSASToken(videoUrl);
            console.log('[uploadSellerReel] Saving video URL to database (without SAS token):', videoUrl.substring(0, 100));
            try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
        } else {
            try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
            return res.status(502).json({ success: false, message: 'Azure upload failed' });
        }
    }
    
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
    const thumbnailUrl = thumbnailFile ? `/uploads/${thumbnailFile.filename}` : null;
    
    // Log file information
    if (videoFile) {
        console.log('Video file details:', {
            originalname: videoFile.originalname,
            mimetype: videoFile.mimetype,
            size: videoFile.size,
            filename: videoFile.filename
        })
    }
    
    if (thumbnailFile) {
        console.log('Thumbnail file details:', {
            originalname: thumbnailFile.originalname,
            mimetype: thumbnailFile.mimetype,
            size: thumbnailFile.size,
            filename: thumbnailFile.filename
        })
    }
    
    // Start a database transaction to ensure data consistency
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting database connection:', err)
            return res.status(500).json({ 
                success: false, 
                message: 'Database connection error' 
            })
        }
        
        connection.beginTransaction((err) => {
            if (err) {
                connection.release()
                console.error('Error starting transaction:', err)
                return res.status(500).json({ 
                    success: false, 
                    message: 'Transaction error' 
                })
            }
            
            try {
                // Determine vendorId based on user role
                let vendorId = null;
                
                // Debug logging to see what's in req.user
                console.log('Debug - req.user:', req.user);
                
                // Check if user is a seller (has vendor_id in token)
                if (req.user && req.user.vendor_id) {
                    // Authenticated seller - use their vendor_id
                    vendorId = parseInt(req.user.vendor_id, 10);
                    console.log('Using vendor_id from authenticated seller:', vendorId);
                } else if (req.user && (req.user.role === 'admin' || req.user.role === 1)) {
                    // Authenticated admin - they must specify which seller
                    console.log('Admin user detected, checking for selectedSeller parameter');
                    if (!selectedSeller) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error('Admin must specify selectedSeller for seller reel upload');
                            return res.status(400).json({ 
                                success: false, 
                                message: 'Admin must specify seller for reel upload' 
                            });
                        });
                    }
                    vendorId = parseInt(selectedSeller, 10);
                    console.log('Using vendor_id from selectedSeller parameter:', vendorId);
                } else {
                    // Neither seller nor admin - authentication issue
                    return connection.rollback(() => {
                        connection.release();
                        console.error('Could not determine seller information from authentication token');
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Could not determine seller information. Please log in again.' 
                        });
                    });
                }
                
                // Validate vendorId
                if (!vendorId || isNaN(vendorId)) {
                    return connection.rollback(() => {
                        connection.release();
                        console.error('Invalid seller ID:', vendorId);
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Invalid seller ID' 
                        });
                    });
                }
                
                // Verify seller exists in oc_sellers table
                const sellerCheckQuery = `SELECT id, vendor_id FROM oc_sellers WHERE vendor_id = ?`;
                
                db.query(sellerCheckQuery, [vendorId], (sellerErr, sellerResults) => {
                    if (sellerErr) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error('Database error checking seller:', sellerErr);
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Error verifying seller information',
                                error: sellerErr.message 
                            });
                        });
                    }
                    
                    if (sellerResults.length === 0) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error('Seller not found in oc_sellers table for vendor_id:', vendorId);
                            return res.status(404).json({ 
                                success: false, 
                                message: 'Seller not found' 
                            });
                        });
                    }
                    
                    console.log('Verified seller exists - vendor_id:', vendorId);
                    
                    // Insert the reel
                    const reelQuery = `
                        INSERT INTO oc_seller_reels
                        (seller_id, title, description, video_url, thumbnail, brand_id, status, date_added) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                    `;
                    
                    const descriptionToSave = description || null;

                    const reelValues = [
                        vendorId,  // Use vendor_id instead of user id
                        title,
                        descriptionToSave,
                        videoUrl,
                        thumbnailUrl,
                        associationType === 'brand' ? parseInt(selectedBrand, 10) || null : null,
                        0 // Default status (0 = pending)
                    ];
                    
                    console.log('Inserting seller reel with values:', reelValues)
                    
                    connection.query(reelQuery, reelValues, (err, result) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release()
                                console.error('Database error inserting seller reel:', err)
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Error saving reel',
                                    error: err.message 
                                })
                            })
                        }
                        
                        const reelId = result.insertId;
                        console.log('Seller reel inserted successfully, ID:', reelId)
                        // Handle category association, including creating 'other' category and linking it
                        const handleCategoryAndContinue = () => {
                            const insertProductsAndCommit = () => {
                                if (selectedProducts && selectedProducts.length > 0) {
                                    const productQuery = `
                                        INSERT INTO oc_seller_reel_product
                                        (reel_id, product_id) 
                                        VALUES ?
                                    `;
                                    const productValues = selectedProducts.map(productId => [reelId, productId]);
                                    connection.query(productQuery, [productValues], (err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release()
                                                console.error('Database error inserting product associations:', err)
                                                return res.status(500).json({ 
                                                    success: false, 
                                                    message: 'Error saving product associations',
                                                    error: err.message 
                                                })
                                            })
                                        }
                                        connection.commit((err) => {
                                            if (err) {
                                                return connection.rollback(() => {
                                                    connection.release()
                                                    console.error('Error committing transaction:', err)
                                                    return res.status(500).json({ 
                                                        success: false, 
                                                        message: 'Error saving reel data' 
                                                    })
                                                })
                                            }
                                            connection.release()
                                            return res.status(201).json({
                                                success: true,
                                                message: 'Reel uploaded successfully',
                                                data: { 
                                                    reelId,
                                                    video_url: videoUrl,
                                                    thumbnail_url: thumbnailUrl
                                                }
                                            })
                                        })
                                    })
                                } else {
                                    connection.commit((err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release()
                                                console.error('Error committing transaction:', err)
                                                return res.status(500).json({ 
                                                    success: false, 
                                                    message: 'Error saving reel data' 
                                                });
                                            });
                                        }
                                        connection.release()
                                        return res.status(201).json({
                                            success: true,
                                            message: 'Reel uploaded successfully',
                                            data: { 
                                                reelId,
                                                video_url: videoUrl,
                                                thumbnail_url: thumbnailUrl
                                            }
                                        });
                                    })
                                }
                            };

                            const catId = parseInt(category, 10);
                            if (!Number.isNaN(catId)) {
                                const categoryQuery = `
                                    INSERT INTO oc_seller_reel_to_category
                                    (reel_id, category_id) 
                                    VALUES (?, ?)
                                `;
                                connection.query(categoryQuery, [reelId, catId], (err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release()
                                            console.error('Database error inserting category association:', err)
                                            return res.status(500).json({ 
                                                success: false, 
                                                message: 'Error saving category association',
                                                error: err.message 
                                            });
                                        });
                                    }
                                    insertProductsAndCommit();
                                });
                            } else if (String(category) === 'other' && otherCategoryName) {
                                const suggestQuery = `
                                    INSERT INTO oc_reel_category (name, description, sort_order, status, date_added)
                                    VALUES (?, NULL, 0, 0, NOW())
                                `;
                                connection.query(suggestQuery, [otherCategoryName], (catErr, catResult) => {
                                    if (catErr) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error('Database error creating other category:', catErr);
                                            return res.status(500).json({
                                                success: false,
                                                message: 'Error creating category',
                                                error: catErr.message
                                            });
                                        });
                                    }
                                    const newCatId = catResult.insertId;
                                    const insOtherCat = `INSERT INTO oc_seller_reel_to_category (reel_id, category_id) VALUES (?, ?)`;
                                    connection.query(insOtherCat, [reelId, newCatId], (linkErr) => {
                                        if (linkErr) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                console.error('Database error linking other category:', linkErr);
                                                return res.status(500).json({
                                                    success: false,
                                                    message: 'Error saving category association',
                                                    error: linkErr.message
                                                });
                                            });
                                        }
                                        insertProductsAndCommit();
                                    });
                                });
                            } else {
                                insertProductsAndCommit();
                            }
                        };

                        handleCategoryAndContinue();
                        
                        
                    })
                });
            } catch (error) {
                // Rollback the transaction on error
                connection.rollback(() => {
                    connection.release()
                    console.error('Error uploading reel:', error)
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error uploading reel',
                        error: error.message 
                    })
                })
            }
        })
    })
};

const editReel = async (req, res) => {
    const { id } = req.params;
    
    // Validate reel ID
    if (!id) {
        return res.status(400).json({ success: false, message: 'Reel ID is required' });
    }
    
    const { title, description, category, associationType, selectedBrand, otherCategoryName } = req.body;
    let selectedProducts = req.body.selectedProducts;

    if (!title || !category) {
        return res.status(400).json({ success: false, message: 'Title and category are required' });
    }

    if (String(category) === 'other' && (!otherCategoryName || !String(otherCategoryName).trim())) {
        return res.status(400).json({ success: false, message: 'Please enter a category name' });
    }

    if (associationType && associationType !== 'product' && associationType !== 'brand') {
        return res.status(400).json({ success: false, message: 'Invalid association type. Must be product or brand.' });
    }

    if (associationType === 'brand' && !selectedBrand) {
        return res.status(400).json({ success: false, message: 'Please select a brand for brand association' });
    }

    if (typeof selectedProducts === 'string') {
        try {
            const parsed = JSON.parse(selectedProducts);
            selectedProducts = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
            selectedProducts = String(selectedProducts)
                .split(',')
                .map(v => parseInt(String(v).trim(), 10))
                .filter(v => !Number.isNaN(v));
        }
    } else if (Array.isArray(selectedProducts)) {
        selectedProducts = selectedProducts
            .map(v => parseInt(v, 10))
            .filter(v => !Number.isNaN(v));
    } else if (selectedProducts && typeof selectedProducts === 'object') {
        const vals = Object.values(selectedProducts);
        selectedProducts = vals
            .map(v => parseInt(v, 10))
            .filter(v => !Number.isNaN(v));
    } else if (selectedProducts != null) {
        const n = parseInt(selectedProducts, 10);
        selectedProducts = Number.isNaN(n) ? [] : [n];
    } else {
        selectedProducts = [];
    }

    if (!selectedProducts || selectedProducts.length === 0) {
        return res.status(400).json({ success: false, message: 'Please select at least one product' });
    }

    if (selectedProducts.length > 3) {
        return res.status(400).json({ success: false, message: 'You can select maximum 3 products' });
    }

    // Handle files as optional - only process if they exist
    const videoFile = req.files && req.files.video ? req.files.video[0] : null;
    const thumbnailFile = req.files && req.files.thumbnail ? req.files.thumbnail[0] : null;
    let videoUrl = null;
    
    // Process video file only if it exists
    if (videoFile) {
        try {
            videoUrl = await uploadToAzure(videoFile.path, videoFile.originalname || videoFile.filename);
            // IMPORTANT: Save video URL WITHOUT SAS token to database
            // SAS tokens expire, so we append them dynamically when retrieving
            if (videoUrl && videoUrl.startsWith('http')) {
                videoUrl = stripSASToken(videoUrl);
                console.log('[editReel] Saving video URL to database (without SAS token):', videoUrl.substring(0, 100));
            }
            // Delete local file after successful Azure upload
            try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
        } catch (e) {
            console.error('Azure upload failed:', e && e.message ? e.message : e);
            // Use local file path as fallback when Azure upload fails
            videoUrl = `/uploads/${videoFile.filename}`;
        }
        
        // Additional check to ensure videoUrl is never null
        if (!videoUrl) {
            videoUrl = `/uploads/${videoFile.filename}`;
        }
    }
    
    // Validate that we have a video URL if a video file was provided
    if (videoFile && !videoUrl) {
        return res.status(400).json({ 
            success: false, 
            message: 'Video upload failed. Please try again.' 
        });
    }
    
    // Process thumbnail file only if it exists
    const thumbnailUrl = thumbnailFile ? `/uploads/${thumbnailFile.filename}` : null;

    // Wrap all database operations in try-catch for proper error handling
    try {
        db.getConnection((err, connection) => {
            if (err) {
                console.error('Database connection error:', err);
                return res.status(500).json({ success: false, message: 'Database connection error' });
            }

            connection.beginTransaction(err => {
                if (err) {
                    connection.release();
                    console.error('Transaction error:', err);
                    return res.status(500).json({ success: false, message: 'Transaction error' });
                }

                const checkInfluencer = `SELECT reel_id FROM oc_influencer_reels WHERE reel_id = ?`;
                connection.query(checkInfluencer, [id], (err, results) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error('Error checking reel type:', err);
                            return res.status(500).json({ success: false, message: 'Error checking reel type', error: err.message });
                        });
                    }

                    const isInfluencerReel = results.length > 0;
                    const tableName = isInfluencerReel ? 'oc_influencer_reels' : 'oc_seller_reels';
                    const categoryTable = isInfluencerReel ? 'oc_influencer_reel_to_category' : 'oc_seller_reel_to_category';
                    const productTable = isInfluencerReel ? 'oc_influencer_reel_product' : 'oc_seller_reel_product';

                    const updateFields = [];
                    const updateValues = [];

                    updateFields.push('title = ?');
                    updateValues.push(title);

                    const descToSave = description || null;
                    updateFields.push('description = ?');
                    updateValues.push(descToSave);

                    if (videoUrl) {
                        updateFields.push('video_url = ?');
                        updateValues.push(videoUrl);
                    }

                    if (thumbnailUrl) {
                        updateFields.push('thumbnail = ?');
                        updateValues.push(thumbnailUrl);
                    }

                    // Convert brand ID to integer for safer handling
                    const brandIdInt = selectedBrand ? parseInt(selectedBrand, 10) : null;
                    if (associationType === 'brand') {
                        updateFields.push('brand_id = ?');
                        updateValues.push(!isNaN(brandIdInt) ? brandIdInt : null);
                    } else {
                        updateFields.push('brand_id = ?');
                        updateValues.push(null);
                    }

                    const updateQuery = `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE reel_id = ?`;
                    updateValues.push(id);

                    connection.query(updateQuery, updateValues, (err, result) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                console.error('Error updating reel:', err);
                                return res.status(500).json({ success: false, message: 'Error updating reel', error: err.message });
                            });
                        }

                        if (result.affectedRows === 0) {
                            return connection.rollback(() => {
                                connection.release();
                                return res.status(404).json({ success: false, message: 'Reel not found' });
                            });
                        }

                        const proceedProducts = () => {
                            const delProd = `DELETE FROM ${productTable} WHERE reel_id = ?`;
                            connection.query(delProd, [id], err => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error('Error updating products:', err);
                                        return res.status(500).json({ success: false, message: 'Error updating products', error: err.message });
                                    });
                                }

                                if (selectedProducts && selectedProducts.length > 0) {
                                    const insProd = `INSERT INTO ${productTable} (reel_id, product_id) VALUES ?`;
                                    const values = selectedProducts.map(pid => [id, parseInt(pid, 10)]);
                                    connection.query(insProd, [values], err => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                console.error('Error updating products:', err);
                                                return res.status(500).json({ success: false, message: 'Error updating products', error: err.message });
                                            });
                                        }

                                        connection.commit(err => {
                                            if (err) {
                                                return connection.rollback(() => {
                                                    connection.release();
                                                    console.error('Error saving changes:', err);
                                                    return res.status(500).json({ success: false, message: 'Error saving changes' });
                                                });
                                            }

                                            connection.release();
                                            return res.status(200).json({ success: true, message: 'Reel updated successfully' });
                                        });
                                    });
                                } else {
                                    connection.commit(err => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                console.error('Error saving changes:', err);
                                                return res.status(500).json({ success: false, message: 'Error saving changes' });
                                            });
                                        }
                                        connection.release();
                                        return res.status(200).json({ success: true, message: 'Reel updated successfully' });
                                    });
                                }
                            });
                        };

                        // Convert category to integer for safer handling
                        const categoryId = parseInt(category, 10);
                        if (!Number.isNaN(categoryId)) {
                            const delCat = `DELETE FROM ${categoryTable} WHERE reel_id = ?`;
                            connection.query(delCat, [id], err => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error('Error updating category:', err);
                                        return res.status(500).json({ success: false, message: 'Error updating category', error: err.message });
                                    });
                                }

                                const insCat = `INSERT INTO ${categoryTable} (reel_id, category_id) VALUES (?, ?)`;
                                connection.query(insCat, [id, categoryId], err => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error('Error updating category:', err);
                                            return res.status(500).json({ success: false, message: 'Error updating category', error: err.message });
                                        });
                                    }
                                    proceedProducts();
                                });
                            });
                        } else if (String(category) === 'other' && otherCategoryName) {
                            const suggestQuery = `
                                INSERT INTO oc_reel_category (name, description, sort_order, status, date_added)
                                VALUES (?, NULL, 0, 0, NOW())
                            `;
                            connection.query(suggestQuery, [String(otherCategoryName).trim()], (catErr, catResult) => {
                                if (catErr) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error('Error creating category:', catErr);
                                        return res.status(500).json({ success: false, message: 'Error creating category', error: catErr.message });
                                    });
                                }
                                const newCatId = catResult.insertId;
                                const delCat = `DELETE FROM ${categoryTable} WHERE reel_id = ?`;
                                connection.query(delCat, [id], err => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            console.error('Error updating category:', err);
                                            return res.status(500).json({ success: false, message: 'Error updating category', error: err.message });
                                        });
                                    }
                                    const insCat = `INSERT INTO ${categoryTable} (reel_id, category_id) VALUES (?, ?)`;
                                    connection.query(insCat, [id, newCatId], err => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                console.error('Error updating category:', err);
                                                return res.status(500).json({ success: false, message: 'Error updating category', error: err.message });
                                            });
                                        }
                                        proceedProducts();
                                    });
                                });
                            });
                        } else {
                            proceedProducts();
                        }
                    });
                });
            });
        });
    } catch (error) {
        console.error('Unexpected error in editReel:', error);
        return res.status(500).json({ success: false, message: 'An unexpected error occurred', error: error.message });
    }
}

const createReel = async (req, res) => {
    // Log the structure of req.files if it exists
    if (req.files) {
        console.log('Files structure:', Object.keys(req.files))
        if (req.files.video) {
            console.log('Video file info:', req.files.video)
        }
        if (req.files.thumbnail) {
            console.log('Thumbnail file info:', req.files.thumbnail)
        }
    }
    
    // Check if any form data was received at all
    if (!req.body || Object.keys(req.body).length === 0) {
        console.log('ERROR: No form data received in request body')
        console.log('Request object keys:', Object.keys(req))
        if (req.body) {
            console.log('Request body keys:', Object.keys(req.body))
        }
        return res.status(400).json({ 
            success: false, 
            message: 'No form data received' 
        })
    }
    
    // Log individual fields for debugging
    console.log('Individual fields in req.body:', {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        associationType: req.body.associationType,
        selectedSeller: req.body.selectedSeller,
        selectedBrand: req.body.selectedBrand,
        selectedProducts: req.body.selectedProducts
    })
    
    // Extract text fields from req.body
    const { 
        title, 
        description, 
        category,  // Using 'category' as it's sent from frontend
        associationType, 
        selectedSeller, 
        selectedBrand
    } = req.body;
    
    // Extract selected products (may be sent as JSON string or array)
    let selectedProducts = req.body.selectedProducts;
    if (typeof selectedProducts === 'string') {
        try {
            selectedProducts = JSON.parse(selectedProducts)
        } catch (e) {
            // If parsing fails, treat as array or single value
            selectedProducts = Array.isArray(selectedProducts) ? selectedProducts : [selectedProducts];
        }
    }
    
    const userId = req.user ? req.user.id : 1; // From auth middleware, fallback to 1 for testing
    const uploaderType = 'seller'; // Sellers always have 'seller' uploader type
    
    // Log parsed data
    console.log('Parsed data:', {
        title,
        description,
        category,
        associationType,
        selectedSeller,
        selectedBrand,
        selectedProducts,
        userId,
        uploaderType
    })
    
    // Validation with detailed logging
    console.log('Starting validation checks...')
    
    if (!title) {
        console.log('Title validation failed - title is:', title)
        return res.status(400).json({ 
            success: false, 
            message: 'Title is required' 
        })
    }
    
    if (!category) {
        console.log('Category validation failed - category is:', category)
        return res.status(400).json({ 
            success: false, 
            message: 'Category is required' 
        })
    }
    
    // Association type is now optional and defaults to 'product'
    
    console.log('Basic validation passed:', { title, category, associationType })
    
    // Check if video file is provided
    if (!req.files || !req.files.video) {
        console.log('Video file validation failed - files:', req.files)
        return res.status(400).json({ 
            success: false, 
            message: 'Video file is required' 
        })
    }
    
    // For 'product' association type, neither seller nor brand is required
    if (associationType !== 'product' && ((associationType === 'seller' && !selectedSeller) || 
        (associationType === 'brand' && !selectedBrand))) {
        console.log('Seller/Brand validation failed:', {
            associationType,
            selectedSeller: !!selectedSeller,
            selectedBrand: !!selectedBrand
        })
        return res.status(400).json({ 
            success: false, 
            message: 'Please select a seller or brand' 
        })
    }
    
    if (!selectedProducts || selectedProducts.length === 0) {
        console.log('Products validation failed:', selectedProducts)
        return res.status(400).json({ 
            success: false, 
            message: 'Please select at least one product' 
        })
    }
    
    if (selectedProducts.length > 3) {
        console.log('Products validation failed:', selectedProducts)
        return res.status(400).json({ 
            success: false, 
            message: 'You can select maximum 3 products' 
        })
    }
    
    // Create a new reel instance
    const reel = new Reel({
        title,
        description,
        category,
        associationType,
        selectedSeller,
        selectedBrand,
        selectedProducts,
        userId,
        uploaderType,
        files: req.files
    })
    
    try {
        await reel.save();
        return res.status(201).json({ 
            success: true, 
            message: 'Reel created successfully', 
            data: reel 
        })
    } catch (error) {
        console.error('Error creating reel:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Please select at least one product' 
        })
    }
    
    if (selectedProducts.length > 3) {
        return res.status(400).json({ 
            success: false, 
            message: 'You can select maximum 3 products' 
        })
    }
    
    // For 'product' association type, neither seller nor brand is required
    // For 'brand' association type, brand is required
    if ((associationType === 'seller' && !selectedSeller) || 
        (associationType === 'brand' && !selectedBrand)) {
        console.log('Seller/Brand validation failed:', {
            associationType,
            selectedSeller: !!selectedSeller,
            selectedBrand: !!selectedBrand
        })
        return res.status(400).json({ 
            success: false, 
            message: 'Please select a seller or brand' 
        })
    }
    
    // Handle file uploads
    // Save actual file paths to database
    const videoFile = req.files.video ? req.files.video[0] : null;
    const videoUrl = videoFile ? 
        `/uploads/${videoFile.filename}` : 
        null;
    
    const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
    const thumbnailUrl = thumbnailFile ? 
        `/uploads/${thumbnailFile.filename}` : 
        null;
    
    // Log file information
    if (videoFile) {
        console.log('Video file details:', {
            originalname: videoFile.originalname,
            mimetype: videoFile.mimetype,
            size: videoFile.size,
            filename: videoFile.filename
        })
    }
    
    if (thumbnailFile) {
        console.log('Thumbnail file details:', {
            originalname: thumbnailFile.originalname,
            mimetype: thumbnailFile.mimetype,
            size: thumbnailFile.size,
            filename: thumbnailFile.filename
        })
    }
    
    // Start a database transaction to ensure data consistency
    db.getConnection((err, connection) => {
        if (err) {
            console.error('Error getting database connection:', err)
            return res.status(500).json({ 
                success: false, 
                message: 'Database connection error' 
            })
        }
        
        connection.beginTransaction((err) => {
            if (err) {
                connection.release()
                console.error('Error starting transaction:', err)
                return res.status(500).json({ 
                    success: false, 
                    message: 'Transaction error' 
                })
            }
            
            try {
                // Get the vendor_id for the seller from oc_sellers table
                const vendorQuery = `SELECT vendor_id FROM oc_sellers WHERE id = ?`;
                
                db.query(vendorQuery, [userId], (vendorErr, vendorResults) => {
                    if (vendorErr) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error('Database error fetching vendor ID:', vendorErr);
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Error fetching seller information',
                                error: vendorErr.message 
                            });
                        });
                    }
                    
                    if (vendorResults.length === 0) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error('Seller not found in oc_sellers table for user ID:', userId);
                            return res.status(404).json({ 
                                success: false, 
                                message: 'Seller not found' 
                            });
                        });
                    }
                    
                    const vendorId = vendorResults[0].vendor_id;
                    console.log('Found vendor ID for user:', userId, 'is:', vendorId);
                    
                    // Insert the reel into the database (using oc_seller_reels table)
                    const reelQuery = `
                        INSERT INTO oc_seller_reels
                        (seller_id, title, description, video_url, thumbnail, status, date_added) 
                        VALUES (?, ?, ?, ?, ?, ?, NOW())
                    `;
                    
                    const reelValues = [
                        vendorId,  // Use vendor_id instead of user id
                        title,
                        description || null,
                        videoUrl,
                        thumbnailUrl,
                        0 // Default status (0 = pending)
                    ];
                    
                    console.log('Inserting seller reel with values:', reelValues)
                    
                    connection.query(reelQuery, reelValues, (err, result) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release()
                                console.error('Database error inserting seller reel:', err)
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Error saving reel',
                                    error: err.message 
                                })
                            })
                        }
                        
                        const reelId = result.insertId;
                        console.log('Seller reel inserted successfully, ID:', reelId)
                        
                        // Insert category association
                        const categoryQuery = `
                            INSERT INTO oc_seller_reel_to_category
                            (reel_id, category_id) 
                            VALUES (?, ?)
                        `;
                        
                        connection.query(categoryQuery, [reelId, category], (err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release()
                                    console.error('Database error inserting category association:', err)
                                    return res.status(500).json({ 
                                        success: false, 
                                        message: 'Error saving category association',
                                        error: err.message 
                                    });
                                });
                            }
                            
                            // Insert product associations
                            if (selectedProducts && selectedProducts.length > 0) {
                                const productQuery = `
                                    INSERT INTO oc_seller_reel_product
                                    (reel_id, product_id) 
                                    VALUES ?
                                `;
                                
                                const productValues = selectedProducts.map(productId => [reelId, productId]);
                                
                                connection.query(productQuery, [productValues], (err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release()
                                            console.error('Database error inserting product associations:', err)
                                            return res.status(500).json({ 
                                                success: false, 
                                                message: 'Error saving product associations',
                                                error: err.message 
                                            })
                                        })
                                    }
                                    
                                    // Commit the transaction
                                    connection.commit((err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release()
                                                console.error('Error committing transaction:', err)
                                                return res.status(500).json({ 
                                                    success: false, 
                                                    message: 'Error saving reel data' 
                                                })
                                            })
                                        }
                                        
                                        connection.release()
                                        
                                        return res.status(201).json({
                                            success: true,
                                            message: 'Reel uploaded successfully',
                                            data: { reelId }
                                        })
                                    })
                                })
                            } else {
                                // No products to associate, just commit the transaction
                                connection.commit((err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release()
                                            console.error('Error committing transaction:', err)
                                            return res.status(500).json({ 
                                                success: false, 
                                                message: 'Error saving reel data' 
                                            });
                                        });
                                    }
                                    
                                    connection.release()
                                    
                                    return res.status(201).json({
                                        success: true,
                                        message: 'Reel uploaded successfully',
                                        data: { reelId }
                                    });
                                })
                            }
                        })
                    })
                });
            } catch (error) {
                // Rollback the transaction on error
                connection.rollback(() => {
                    connection.release()
                    console.error('Error uploading reel:', error)
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error uploading reel',
                        error: error.message 
                    })
                })
            }
        })
    })
};

// Get reels for the authenticated influencer
const getInfluencerReels = async (req, res) => {
    try {
        const userId = req.user.id;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // Get filter parameters from query
        const { title, category, date, product, status } = req.query;        
        // Build dynamic query with filters
        let query = `
            SELECT 
                ir.reel_id as id,
                ir.title,
                orc.name as category_name,
                CASE 
                    WHEN ir.status = 1 THEN 'approved'
                    WHEN ir.status = 0 THEN 'pending'
                    WHEN ir.status = 2 THEN 'rejected'
                    ELSE 'unknown'
                END as status,
                0 as views,
                0 as likes,
                ir.date_added as created_at,
                ir.video_url,
                ir.thumbnail,
                GROUP_CONCAT(irp.product_id) as product_ids
            FROM oc_influencer_reels ir
            LEFT JOIN oc_influencer_reel_to_category irtc ON ir.reel_id = irtc.reel_id
            LEFT JOIN oc_reel_category orc ON irtc.category_id = orc.reel_category_id
            LEFT JOIN oc_influencer_reel_product irp ON ir.reel_id = irp.reel_id
            WHERE ir.influencer_id = ?
        `;
        
        const queryParams = [userId];
        
        // Add filters if provided
        if (title) {
            query += ` AND ir.title LIKE ?`;
            queryParams.push(`%${title}%`);
        }
        
        if (category) {
            query += ` AND orc.reel_category_id = ?`;
            queryParams.push(category);
        }        
        if (date) {
            // Assuming date is in YYYY-MM-DD format
            query += ` AND DATE(ir.date_added) = ?`;
            queryParams.push(date);
        }
        
        if (product) {
            // For product filtering, we need to do it in a different way since product tables are in sagar database
            // We'll filter after getting the results
            // Store the product filter for later use
        }
        
        // Add status filter if provided
        if (status) {
            // Map status values to database values
            let statusValue;
            switch (status) {
                case 'approved':
                    statusValue = 1;
                    break;
                case 'pending':
                    statusValue = 0;
                    break;
                case 'rejected':
                    statusValue = 2;
                    break;
                default:
                    statusValue = null;
            }
            
            if (statusValue !== null) {
                query += ` AND ir.status = ?`;
                queryParams.push(statusValue);
            }
        }        
        query += `
            GROUP BY ir.reel_id
            ORDER BY ir.date_added DESC
        `;
        
        db.query(query, queryParams, (err, results) => {
            if (err) {
                console.error('Error fetching influencer reels:', err)
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching influencer reels',
                    error: err.message 
                })
            }
            
            // Process results to format product information
            let formattedResults = results.map(reel => {
                let productIds = [];
                let productCount = 0;
                
                if (reel.product_ids) {
                    productIds = reel.product_ids.split(',').map(id => parseInt(id))
                    productCount = productIds.length;
                }
                
                    // Construct full URLs for video and thumbnail
                    let fullVideoUrl = null;
                    let fullThumbnailUrl = null;
                    
                    if (reel.video_url) {
                        // Check if it's already a full URL (Azure or external)
                        if (reel.video_url.startsWith('http')) {
                            fullVideoUrl = reel.video_url;
                        } else {
                            // It's a relative path - construct full URL
                            fullVideoUrl = `${baseUrl}${reel.video_url}`;
                        }
                    }
                    if (reel.thumbnail) {
                        fullThumbnailUrl = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                    }
                    
                    // Append SAS token only for Azure URLs
                    const videoUrlWithSAS = fullVideoUrl ? appendSAS(fullVideoUrl) : null;
                    
                    // Log video URL for debugging (only for Azure URLs)
                    if (videoUrlWithSAS && isAzureBlobUrl(videoUrlWithSAS)) {
                        const hasSasToken = videoUrlWithSAS.includes('?') || videoUrlWithSAS.includes('&');
                        const { token: sasToken, source: sasSource } = resolveSasToken();
                        console.log(`[getInfluencerReels] Azure video URL for reel ${reel.id}:`, {
                            original: reel.video_url?.substring(0, 100),
                            withSAS: videoUrlWithSAS.substring(0, 100),
                            hasSasToken: hasSasToken,
                            fullLength: videoUrlWithSAS.length,
                            sasConfigured: Boolean(sasToken),
                            sasSource: sasSource || 'none'
                        });
                        if (!hasSasToken) {
                            console.warn(`[getInfluencerReels] WARNING: Azure video URL missing SAS token for reel ${reel.id}`);
                            if (!sasToken) {
                                console.warn('[getInfluencerReels] SAS token not configured in environment.');
                            }
                        }
                    }
                
                return {
                    ...reel,
                    video_url: videoUrlWithSAS,
                    thumbnail: fullThumbnailUrl,
                    product_ids: productIds,
                    product_count: productCount,
                    related_products_count: productCount,
                    product_names: []
                };
            })
            
            // Apply product name filter if provided
            if (product) {
                // Get all unique product IDs from the results
                const allProductIds = new Set();
                formattedResults.forEach(reel => {
                    if (reel.product_ids && Array.isArray(reel.product_ids)) {
                        reel.product_ids.forEach(id => allProductIds.add(id));
                    }
                });
                
                // If we have product IDs, filter by product name
                if (allProductIds.size > 0) {
                    // Create placeholders for the IN clause
                    const placeholders = Array.from(allProductIds).map(() => '?').join(',');
                    const productQuery = `
                        SELECT p.product_id as id, pd.name
                        FROM oc_product p
                        JOIN oc_product_description pd ON p.product_id = pd.product_id
                        WHERE p.product_id IN (${placeholders}) AND pd.language_id = 1
                    `;
                    
                    dbSagar.query(productQuery, Array.from(allProductIds), (productErr, productResults) => {
                        if (productErr) {
                            console.error('Error fetching product names:', productErr);
                            // If there's an error, return the results without filtering
                            return res.status(200).json({
                                success: true,
                                data: formattedResults
                            });
                        }
                        
                        // Create a map of product IDs to names
                        const productNamesMap = {};
                        productResults.forEach(product => {
                            productNamesMap[product.id] = product.name;
                        });
                        
                        // Filter results based on product name
                        const filteredResults = formattedResults.filter(reel => {
                            if (!reel.product_ids || !Array.isArray(reel.product_ids) || reel.product_ids.length === 0) {
                                return false;
                            }
                            
                            // Check if any product name matches the filter
                            return reel.product_ids.some(productId => {
                                const productName = productNamesMap[productId];
                                return productName && productName.toLowerCase().includes(product.toLowerCase());
                            });
                        });
                        
                        return res.status(200).json({
                            success: true,
                            data: filteredResults
                        });
                    });
                    return; // Exit early to avoid duplicate response
                }
            }
            
            return res.status(200).json({
                success: true,
                data: formattedResults
            })
        })
    } catch (error) {
        console.error('Get influencer reels error:', error)
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch influencer reels',
            error: error.message 
        })
    }
};

// Get reels for a specific seller
const getSellerReels = async (req, res) => {
    const { vendorId } = req.params;
    const { title, category, date, product, status } = req.query; // Get filter parameters from query string
    
    console.log('Backend - Received filters:', { title, category, date, product });
    
    // Validate vendorId
    if (!vendorId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Vendor ID is required' 
        })
    }
    
    try {
        // First, verify that the vendorId corresponds to a valid seller in oc_sellers
        const sellerQuery = `SELECT id FROM oc_sellers WHERE vendor_id = ?`;
        
        db.query(sellerQuery, [vendorId], (sellerErr, sellerResults) => {
            if (sellerErr) {
                console.error('Error fetching seller:', sellerErr);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching seller information',
                    error: sellerErr.message 
                });
            }
            
            if (sellerResults.length === 0) {
                console.log('Seller not found for vendorId:', vendorId);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Seller not found' 
                });
            }
            
            const sellerId = sellerResults[0].id;
            console.log('Found seller ID:', sellerId, 'for vendor ID:', vendorId);
            
            // Build dynamic query with filters
            let query = `
                SELECT 
                    sr.reel_id as id,
                    sr.title,
                    orc.name as category_name,
                    CASE 
                        WHEN sr.status = 1 THEN 'approved'
                        WHEN sr.status = 0 THEN 'pending'
                        WHEN sr.status = 2 THEN 'rejected'
                        ELSE 'unknown'
                    END as status,
                    0 as views,
                    0 as likes,
                    sr.date_added as created_at,
                    sr.video_url,
                    sr.thumbnail,
                    GROUP_CONCAT(srp.product_id) as product_ids
                FROM oc_seller_reels sr
                LEFT JOIN oc_seller_reel_to_category srtc ON sr.reel_id = srtc.reel_id
                LEFT JOIN oc_reel_category orc ON srtc.category_id = orc.reel_category_id
                LEFT JOIN oc_seller_reel_product srp ON sr.reel_id = srp.reel_id
                WHERE sr.seller_id = ?
            `;
            
            const queryParams = [vendorId];
            
            // Add filters to query
            if (title) {
                query += ' AND sr.title LIKE ?';
                queryParams.push(`%${title}%`);
            }
            
            if (category) {
                query += ' AND orc.reel_category_id = ?';
                queryParams.push(category);
            }
            
            if (date) {
                // Filter by date (assuming date is in YYYY-MM-DD format)
                query += ' AND DATE(sr.date_added) = ?';
                queryParams.push(date);
            }
            
            if (product) {
                // Join with product table to filter by product name
                // Using sagar database for oc_product table
                query += ' AND sr.reel_id IN (SELECT DISTINCT srp2.reel_id FROM oc_seller_reel_product srp2 LEFT JOIN sagar.oc_product op ON srp2.product_id = op.product_id LEFT JOIN sagar.oc_product_description opd ON op.product_id = opd.product_id WHERE opd.name LIKE ? AND opd.language_id = 1)';
                queryParams.push(`%${product}%`);
            }

            if (status) {
                let statusValue = null;
                switch (status) {
                    case 'approved':
                        statusValue = 1;
                        break;
                    case 'pending':
                        statusValue = 0;
                        break;
                    case 'rejected':
                        statusValue = 2;
                        break;
                    default:
                        statusValue = null;
                }
                if (statusValue !== null) {
                    query += ' AND sr.status = ?';
                    queryParams.push(statusValue);
                }
            }
            
            query += ' GROUP BY sr.reel_id ORDER BY sr.date_added DESC';
            
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            
            db.query(query, queryParams, (err, results) => {
                if (err) {
                    console.error('Error fetching seller reels:', err)
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error fetching seller reels',
                        error: err.message 
                    })
                }
                
                // Process results to format product information
                const formattedResults = results.map(reel => {
                    let productIds = [];
                    let productCount = 0;
                    
                    // Handle product_ids which might be a comma-separated string or null
                    if (reel.product_ids) {
                        if (typeof reel.product_ids === 'string') {
                            // Split comma-separated string into array of integers
                            productIds = reel.product_ids.split(',').map(id => {
                                const numId = parseInt(id.trim());
                                return isNaN(numId) ? null : numId;
                            }).filter(id => id !== null);
                        } else if (Array.isArray(reel.product_ids)) {
                            // Already an array, ensure all elements are integers
                            productIds = reel.product_ids.map(id => {
                                const numId = parseInt(id);
                                return isNaN(numId) ? null : numId;
                            }).filter(id => id !== null);
                        } else {
                            // Single value, convert to array
                            const numId = parseInt(reel.product_ids);
                            productIds = isNaN(numId) ? [] : [numId];
                        }
                        
                        productCount = productIds.length;
                    }
                    
                    // Construct full URLs for video and thumbnail
                    let fullVideoUrl = null;
                    let fullThumbnailUrl = null;
                    
                    if (reel.video_url) {
                        // Check if it's already a full URL (Azure or external)
                        if (reel.video_url.startsWith('http')) {
                            fullVideoUrl = reel.video_url;
                        } else {
                            // It's a relative path - construct full URL
                            fullVideoUrl = `${baseUrl}${reel.video_url}`;
                        }
                    }
                    if (reel.thumbnail) {
                        fullThumbnailUrl = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                    }
                    
                    // Append SAS token only for Azure URLs
                    const videoUrlWithSAS = fullVideoUrl ? appendSAS(fullVideoUrl) : null;
                    
                    // Log video URL for debugging (only for Azure URLs)
                    if (videoUrlWithSAS && isAzureBlobUrl(videoUrlWithSAS)) {
                        const hasSasToken = videoUrlWithSAS.includes('?') || videoUrlWithSAS.includes('&');
                        console.log(`[getSellerReels] Azure video URL for reel ${reel.id}:`, {
                            original: reel.video_url?.substring(0, 100),
                            withSAS: videoUrlWithSAS.substring(0, 100),
                            hasSasToken: hasSasToken,
                            fullLength: videoUrlWithSAS.length
                        });
                        if (!hasSasToken) {
                            console.warn(`[getSellerReels] WARNING: Azure video URL missing SAS token for reel ${reel.id}`);
                        }
                    }
                    
                    return {
                        ...reel,
                        video_url: videoUrlWithSAS,
                        thumbnail: fullThumbnailUrl,
                        product_ids: productIds,
                        product_count: productCount,
                        related_products_count: Math.min(3, Math.max(0, productCount > 0 ? 3 : 0)),
                        product_names: [],
                        brand_names: []
                    };
                })
                
                // If there are product IDs, fetch their names and associated brands from sagar DB
                const allProductIds = Array.from(new Set(formattedResults.flatMap(r => r.product_ids || []))).filter(id => !!id);
                if (allProductIds.length === 0) {
                    return res.status(200).json({
                        success: true,
                        data: formattedResults
                    })
                }
                
                const namesQuery = `
                    SELECT p.product_id as id, pd.name, p.manufacturer_id as brand_id
                    FROM oc_product p
                    JOIN oc_product_description pd ON p.product_id = pd.product_id AND pd.language_id = 1
                    WHERE p.product_id IN (${allProductIds.map(() => '?').join(',')})
                `;
                dbSagar.query(namesQuery, allProductIds, (nErr, rows) => {
                    if (nErr) {
                        console.error('Error fetching product names:', nErr);
                        return res.status(200).json({ success: true, data: formattedResults });
                    }
                    const productNameMap = {};
                    const brandIdSet = new Set();
                    rows.forEach(r => {
                        productNameMap[r.id] = r.name;
                        if (r.brand_id) brandIdSet.add(r.brand_id);
                    });
                    
                    const brandIds = Array.from(brandIdSet);
                    if (brandIds.length === 0) {
                        const withNames = formattedResults.map(reel => ({
                            ...reel,
                            product_names: (reel.product_ids || []).map(pid => productNameMap[pid]).filter(Boolean)
                        }));
                        return res.status(200).json({ success: true, data: withNames });
                    }
                    
                    const brandQuery = `SELECT manufacturer_id as id, name FROM oc_manufacturer WHERE manufacturer_id IN (${brandIds.map(() => '?').join(',')})`;
                    dbSagar.query(brandQuery, brandIds, (bErr, bRows) => {
                        if (bErr) {
                            console.error('Error fetching brand names:', bErr);
                            const withNames = formattedResults.map(reel => ({
                                ...reel,
                                product_names: (reel.product_ids || []).map(pid => productNameMap[pid]).filter(Boolean)
                            }));
                            return res.status(200).json({ success: true, data: withNames });
                        }
                        const brandNameMap = {};
                        bRows.forEach(b => { brandNameMap[b.id] = b.name; });
                        const withNamesBrands = formattedResults.map(reel => {
                            const brandNamesFromProducts = (reel.product_ids || [])
                                .map(pid => {
                                    const row = rows.find(r => r.id === pid);
                                    return row && brandNameMap[row.brand_id];
                                })
                                .filter(Boolean);
                            const uniqueBrandNames = Array.from(new Set(brandNamesFromProducts));
                            return {
                                ...reel,
                                product_names: (reel.product_ids || []).map(pid => productNameMap[pid]).filter(Boolean),
                                brand_names: uniqueBrandNames
                            };
                        });
                        return res.status(200).json({ success: true, data: withNamesBrands });
                    });
                });
            })
        });
    } catch (error) {
        console.error('Get seller reels error:', error)
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch seller reels',
            error: error.message 
        })
    }
};



// Delete a reel
const deleteReel = async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ 
            success: false, 
            message: 'Reel ID is required' 
        })
    }
    
    try {
        // Start a database transaction to ensure data consistency
        db.getConnection((err, connection) => {
            if (err) {
                console.error('Error getting database connection:', err)
                return res.status(500).json({ 
                    success: false, 
                    message: 'Database connection error' 
                })
            }
            
            connection.beginTransaction((err) => {
                if (err) {
                    connection.release()
                    console.error('Error starting transaction:', err)
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Transaction error' 
                    })
                }
                
                try {
                    // First, determine if this is an influencer or seller reel by checking both tables
                    const checkInfluencerQuery = `SELECT reel_id FROM oc_influencer_reels WHERE reel_id = ?`;
                    connection.query(checkInfluencerQuery, [id], (err, results) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release()
                                console.error('Database error checking reel type:', err)
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Error checking reel type',
                                    error: err.message 
                                })
                            })
                        }
                        
                        const isInfluencerReel = results.length > 0;
                        const tableName = isInfluencerReel ? 'oc_influencer_reels' : 'oc_seller_reels';
                        const categoryTable = isInfluencerReel ? 'oc_influencer_reel_to_category' : 'oc_seller_reel_to_category';
                        const productTable = isInfluencerReel ? 'oc_influencer_reel_product' : 'oc_seller_reel_product';
                        
                        // Delete product associations first
                        const deleteProductsQuery = `DELETE FROM ${productTable} WHERE reel_id = ?`;
                        connection.query(deleteProductsQuery, [id], (err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release()
                                    console.error('Database error deleting product associations:', err)
                                    return res.status(500).json({ 
                                        success: false, 
                                        message: 'Error deleting reel',
                                        error: err.message 
                                    })
                                })
                            }
                            
                            // Delete category associations
                            const deleteCategoryQuery = `DELETE FROM ${categoryTable} WHERE reel_id = ?`;
                            connection.query(deleteCategoryQuery, [id], (err) => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release()
                                        console.error('Database error deleting category associations:', err)
                                        return res.status(500).json({ 
                                            success: false, 
                                            message: 'Error deleting reel',
                                            error: err.message 
                                        })
                                    });
                                }
                                
                                // Delete the reel itself
                                const reelQuery = `DELETE FROM ${tableName} WHERE reel_id = ?`;
                                connection.query(reelQuery, [id], (err, result) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release()
                                            console.error('Database error deleting reel:', err)
                                            return res.status(500).json({ 
                                                success: false, 
                                                message: 'Error deleting reel',
                                                error: err.message 
                                            })
                                        })
                                    }
                                    
                                    if (result.affectedRows === 0) {
                                        return connection.rollback(() => {
                                            connection.release()
                                            return res.status(404).json({ 
                                                success: false, 
                                                message: 'Reel not found' 
                                            })
                                        })
                                    }
                                    
                                    // Commit the transaction
                                    connection.commit((err) => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release()
                                                console.error('Error committing transaction:', err)
                                                return res.status(500).json({ 
                                                    success: false, 
                                                    message: 'Error deleting reel' 
                                                })
                                            })
                                        }
                                        
                                        connection.release()
                                        
                                        return res.status(200).json({
                                            success: true,
                                            message: 'Reel deleted successfully'
                                        })
                                    })
                                })
                            })
                        })
                    })
                } catch (error) {
                    // Rollback the transaction on error
                    connection.rollback(() => {
                        connection.release()
                        console.error('Error deleting reel:', error)
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Error deleting reel',
                            error: error.message 
                        })
                    })
                }
            })
        })
    } catch (error) {
        console.error('Delete reel error:', error)
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to delete reel',
            error: error.message 
        })
    }
};

// Get a specific reel by ID
const getReelById = async (req, res) => {
    const { id } = req.params;
    
    if (!id) {
        return res.status(400).json({ 
            success: false, 
            message: 'Reel ID is required' 
        })
    }
    
    try {
        // First try to get influencer reel
        let query = `
            SELECT 
                ir.reel_id as id,
                ir.title,
                ir.description,
                ir.video_url,
                ir.thumbnail,
                ir.brand_id,  -- Add brand_id to the query
                orc.reel_category_id as category_id,
                orc.name as category_name,
                CASE 
                    WHEN ir.status = 1 THEN 'approved'
                    WHEN ir.status = 0 THEN 'pending'
                    WHEN ir.status = 2 THEN 'rejected'
                    ELSE 'unknown'
                END as status,
                0 as views,
                0 as likes,
                ir.date_added as created_at,
                GROUP_CONCAT(irp.product_id) as product_ids,
                ir.influencer_id as influencer_id
            FROM oc_influencer_reels ir
            LEFT JOIN oc_influencer_reel_to_category irtc ON ir.reel_id = irtc.reel_id
            LEFT JOIN oc_reel_category orc ON irtc.category_id = orc.reel_category_id
            LEFT JOIN oc_influencer_reel_product irp ON ir.reel_id = irp.reel_id
            WHERE ir.reel_id = ?
            GROUP BY ir.reel_id
        `;
        
        db.query(query, [id], (err, results) => {
            if (err) {
                console.error('Error fetching influencer reel:', err)
                // Try seller reel instead
                const sellerQuery = `
                    SELECT 
                        sr.reel_id as id,
                        sr.title,
                        sr.description,
                        sr.video_url,
                        sr.thumbnail,
                        sr.brand_id,  -- Add brand_id to the query
                        orc.reel_category_id as category_id,
                        orc.name as category_name,
                        CASE 
                            WHEN sr.status = 1 THEN 'approved'
                            WHEN sr.status = 0 THEN 'pending'
                            WHEN sr.status = 2 THEN 'rejected'
                            ELSE 'unknown'
                        END as status,
                        0 as views,
                        0 as likes,
                        sr.date_added as created_at,
                        GROUP_CONCAT(srp.product_id) as product_ids,
                        sr.seller_id as seller_id
                    FROM oc_seller_reels sr
                    LEFT JOIN oc_seller_reel_to_category srtc ON sr.reel_id = srtc.reel_id
                    LEFT JOIN oc_reel_category orc ON srtc.category_id = orc.reel_category_id
                    LEFT JOIN oc_seller_reel_product srp ON sr.reel_id = srp.reel_id
                    WHERE sr.reel_id = ?
                    GROUP BY sr.reel_id
                `;
                
                db.query(sellerQuery, [id], (err, results) => {
                    if (err) {
                        console.error('Error fetching seller reel:', err)
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Error fetching reel',
                            error: err.message 
                        });
                    }
                    
                        if (results.length === 0) {
                            // Try brand reel instead
                            const brandReelQuery = `
                                SELECT 
                                    br.id,
                                    br.brand_id,
                                    br.category_id,
                                    c.name as category_name,
                                    br.product_id,
                                    br.title,
                                    br.description,
                                    br.video_url,
                                    br.thumbnail_url as thumbnail,
                                    br.views,
                                    br.likes,
                                    br.comments,
                                    CASE 
                                        WHEN br.status = 1 THEN 'approved'
                                        WHEN br.status = 2 THEN 'rejected'
                                        ELSE 'pending'
                                    END as status,
                                    br.created_at,
                                    'brand' as reel_type
                                FROM oc_brand_reels br
                                LEFT JOIN oc_reel_category c ON br.category_id = c.reel_category_id
                                WHERE br.id = ?
                            `;
                            
                            db.query(brandReelQuery, [id], (brErr, brResults) => {
                                if (brErr) {
                                    console.error('Error fetching brand reel:', brErr);
                                    return res.status(500).json({ 
                                        success: false, 
                                        message: 'Error fetching reel',
                                        error: brErr.message 
                                    });
                                }
                                
                                if (brResults.length === 0) {
                                    return res.status(404).json({ 
                                        success: false, 
                                        message: 'Reel not found' 
                                    });
                                }
                                
                                const reel = brResults[0];
                                
                                // Get brand name from sagar database
                                const brandNameQuery = `SELECT name FROM oc_manufacturer WHERE manufacturer_id = ?`;
                                dbSagar.query(brandNameQuery, [reel.brand_id], (bnErr, bnResults) => {
                                    const brandName = (bnResults && bnResults.length > 0) ? bnResults[0].name : 'Unknown Brand';
                                    
                                    // Get all product IDs from junction table
                                    const productIdsQuery = `
                                        SELECT product_id 
                                        FROM oc_brand_reel_product 
                                        WHERE reel_id = ?
                                    `;
                                    db.query(productIdsQuery, [reel.id], (pidErr, pidResults) => {
                                    let productIds = [];
                                        if (!pidErr && pidResults && pidResults.length > 0) {
                                            productIds = pidResults.map(row => parseInt(row.product_id)).filter(id => !isNaN(id));
                                        } else if (reel.product_id) {
                                            // Fallback to single product_id if junction table has no results
                                        const numId = parseInt(reel.product_id);
                                        if (!isNaN(numId)) {
                                            productIds = [numId];
                                        }
                                    }
                                    
                                    // Construct full URLs for video and thumbnail
                                    const baseUrl = `${req.protocol}://${req.get('host')}`;
                                    const fullReel = {
                                        ...reel,
                                        product_ids: productIds,
                                        brand_name: brandName,
                                        thumbnail: reel.thumbnail || reel.thumbnail_url
                                    };
                                    
                                    // Add full URLs if paths exist (handle Azure URLs)
                                    if (reel.video_url) {
                                        fullReel.video_url = reel.video_url.startsWith('http') ? appendSAS(reel.video_url) : `${baseUrl}${reel.video_url}`;
                                    }
                                    if (fullReel.thumbnail) {
                                        fullReel.thumbnail = fullReel.thumbnail.startsWith('http') ? fullReel.thumbnail : `${baseUrl}${fullReel.thumbnail}`;
                                    }
                                    
                                    return res.status(200).json({
                                        success: true,
                                        data: fullReel
                                        });
                                    });
                                });
                            });
                        } else {
                            const reel = results[0];
                            
                            // Get all product IDs from junction table (more reliable than GROUP_CONCAT)
                            const productIdsQuery = `
                                SELECT product_id 
                                FROM oc_seller_reel_product 
                                WHERE reel_id = ?
                            `;
                            db.query(productIdsQuery, [reel.reel_id || reel.id], (pidErr, pidResults) => {
                            let productIds = [];
                                if (!pidErr && pidResults && pidResults.length > 0) {
                                    productIds = pidResults.map(row => parseInt(row.product_id)).filter(id => !isNaN(id));
                                } else if (reel.product_ids) {
                                    // Fallback to GROUP_CONCAT result if junction table has no results
                                if (typeof reel.product_ids === 'string') {
                                    productIds = reel.product_ids.split(',').map(id => {
                                        const numId = parseInt(id.trim());
                                        return isNaN(numId) ? null : numId;
                                    }).filter(id => id !== null);
                                } else if (Array.isArray(reel.product_ids)) {
                                    productIds = reel.product_ids.map(id => {
                                        const numId = parseInt(id);
                                        return isNaN(numId) ? null : numId;
                                    }).filter(id => id !== null);
                                }
                            }
                            
                            // Construct full URLs for video and thumbnail
                            const baseUrl = `${req.protocol}://${req.get('host')}`;
                            const fullReel = {
                                ...reel,
                                product_ids: productIds,
                                seller_id: reel.seller_id
                            };
                            
                            // Add full URLs if paths exist
                            if (reel.video_url) {
                                // Check if it's already a full URL (Azure or external)
                                if (reel.video_url.startsWith('http')) {
                                    fullReel.video_url = appendSAS(reel.video_url);
                                } else {
                                    // For relative paths like /uploads/filename, construct full URL
                                    // Local URLs don't need SAS tokens
                                    if (reel.video_url.startsWith('/uploads')) {
                                        // Local upload - construct full URL without SAS token
                                        fullReel.video_url = `${baseUrl}${reel.video_url}`;
                                    } else {
                                        // Other relative paths - construct full URL and check if Azure
                                        const fullUrl = `${baseUrl}${reel.video_url}`;
                                        fullReel.video_url = appendSAS(fullUrl);
                                    }
                                }
                            }
                            if (reel.thumbnail) {
                                // Check if it's already a full URL
                                if (reel.thumbnail.startsWith('http')) {
                                    fullReel.thumbnail = reel.thumbnail;
                                } else {
                                    // For relative paths like /uploads/filename, we need to ensure they're accessible
                                    // The uploads are served at /uploads, not /api/studio/reels/uploads
                                    fullReel.thumbnail = reel.thumbnail.startsWith('/uploads') ? 
                                        // `http://localhost:3189${reel.thumbnail}` : 
                                        `https://studio-api.ipshopy.com${reel.thumbnail}` : 
                                        `${baseUrl}${reel.thumbnail}`;
                                }
                            }
                            
                            if ((!fullReel.brand_id || fullReel.brand_id === null) && productIds.length > 0) {
                                const firstProductId = productIds[0];
                                const brandLookupQuery = `SELECT manufacturer_id FROM oc_product WHERE product_id = ?`;
                                dbSagar.query(brandLookupQuery, [firstProductId], (bErr, bRows) => {
                                    if (!bErr && bRows && bRows.length > 0) {
                                        fullReel.brand_id = bRows[0].manufacturer_id || null;
                                    }
                                    return res.status(200).json({
                                        success: true,
                                        data: fullReel
                                    })
                                });
                            } else {
                                return res.status(200).json({
                                    success: true,
                                    data: fullReel
                                })
                            }
                            });
                        }
                    })
            } else {
                if (results.length === 0) {
                    // Try seller reel instead
                    const sellerQuery = `
                        SELECT 
                            sr.reel_id as id,
                            sr.title,
                            sr.description,
                            sr.video_url,
                            sr.thumbnail,
                            sr.brand_id,
                            orc.reel_category_id as category_id,
                            orc.name as category_name,
                            CASE 
                                WHEN sr.status = 1 THEN 'approved'
                                WHEN sr.status = 0 THEN 'pending'
                                WHEN sr.status = 2 THEN 'rejected'
                                ELSE 'unknown'
                            END as status,
                            0 as views,
                            0 as likes,
                            sr.date_added as created_at,
                            GROUP_CONCAT(srp.product_id) as product_ids,
                            sr.seller_id as seller_id
                        FROM oc_seller_reels sr
                        LEFT JOIN oc_seller_reel_to_category srtc ON sr.reel_id = srtc.reel_id
                        LEFT JOIN oc_reel_category orc ON srtc.category_id = orc.reel_category_id
                        LEFT JOIN oc_seller_reel_product srp ON sr.reel_id = srp.reel_id
                        WHERE sr.reel_id = ?
                        GROUP BY sr.reel_id
                    `;
                    
                    db.query(sellerQuery, [id], (err, results) => {
                        if (err) {
                            console.error('Error fetching seller reel:', err)
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Error fetching reel',
                                error: err.message 
                            });
                        }
                        
                        if (results.length === 0) {
                            // Try brand reel instead
                            const brandReelQuery = `
                                SELECT 
                                    br.id,
                                    br.brand_id,
                                    br.category_id,
                                    c.name as category_name,
                                    br.product_id,
                                    br.title,
                                    br.description,
                                    br.video_url,
                                    br.thumbnail_url as thumbnail,
                                    br.views,
                                    br.likes,
                                    br.comments,
                                    CASE 
                                        WHEN br.status = 1 THEN 'approved'
                                        WHEN br.status = 2 THEN 'rejected'
                                        ELSE 'pending'
                                    END as status,
                                    br.created_at,
                                    'brand' as reel_type
                                FROM oc_brand_reels br
                                LEFT JOIN oc_reel_category c ON br.category_id = c.reel_category_id
                                WHERE br.id = ?
                            `;
                            
                            db.query(brandReelQuery, [id], (brErr, brResults) => {
                                if (brErr) {
                                    console.error('Error fetching brand reel:', brErr);
                                    return res.status(500).json({ 
                                        success: false, 
                                        message: 'Error fetching reel',
                                        error: brErr.message 
                                    });
                                }
                                
                                if (brResults.length === 0) {
                                    return res.status(404).json({ 
                                        success: false, 
                                        message: 'Reel not found' 
                                    });
                                }
                                
                                const reel = brResults[0];
                                
                                // Get brand name from sagar database
                                const brandNameQuery = `SELECT name FROM oc_manufacturer WHERE manufacturer_id = ?`;
                                dbSagar.query(brandNameQuery, [reel.brand_id], (bnErr, bnResults) => {
                                    const brandName = (bnResults && bnResults.length > 0) ? bnResults[0].name : 'Unknown Brand';
                                    
                                    // Get all product IDs from junction table
                                    const productIdsQuery = `
                                        SELECT product_id 
                                        FROM oc_brand_reel_product 
                                        WHERE reel_id = ?
                                    `;
                                    db.query(productIdsQuery, [reel.id], (pidErr, pidResults) => {
                                    let productIds = [];
                                        if (!pidErr && pidResults && pidResults.length > 0) {
                                            productIds = pidResults.map(row => parseInt(row.product_id)).filter(id => !isNaN(id));
                                        } else if (reel.product_id) {
                                            // Fallback to single product_id if junction table has no results
                                        const numId = parseInt(reel.product_id);
                                        if (!isNaN(numId)) {
                                            productIds = [numId];
                                        }
                                    }
                                    
                                    // Construct full URLs for video and thumbnail
                                    const baseUrl = `${req.protocol}://${req.get('host')}`;
                                    const fullReel = {
                                        ...reel,
                                        product_ids: productIds,
                                        brand_name: brandName,
                                        thumbnail: reel.thumbnail || reel.thumbnail_url
                                    };
                                    
                                    // Add full URLs if paths exist (handle Azure URLs)
                                    if (reel.video_url) {
                                        fullReel.video_url = reel.video_url.startsWith('http') ? appendSAS(reel.video_url) : `${baseUrl}${reel.video_url}`;
                                    }
                                    if (fullReel.thumbnail) {
                                        fullReel.thumbnail = fullReel.thumbnail.startsWith('http') ? fullReel.thumbnail : `${baseUrl}${fullReel.thumbnail}`;
                                    }
                                    
                                    return res.status(200).json({
                                        success: true,
                                        data: fullReel
                                        });
                                    });
                                });
                            });
                        } else {
                            const reel = results[0];
                            
                            // Process product IDs
                            let productIds = [];
                            if (reel.product_ids) {
                                // Handle product_ids which might be a comma-separated string or null
                                if (typeof reel.product_ids === 'string') {
                                    // Split comma-separated string into array of integers
                                    productIds = reel.product_ids.split(',').map(id => {
                                        const numId = parseInt(id.trim());
                                        return isNaN(numId) ? null : numId;
                                    }).filter(id => id !== null);
                                } else if (Array.isArray(reel.product_ids)) {
                                    // Already an array, ensure all elements are integers
                                    productIds = reel.product_ids.map(id => {
                                        const numId = parseInt(id);
                                        return isNaN(numId) ? null : numId;
                                    }).filter(id => id !== null);
                                } else {
                                    // Single value, convert to array
                                    const numId = parseInt(reel.product_ids);
                                    productIds = isNaN(numId) ? [] : [numId];
                                }
                            }
                            
                            // Construct full URLs for video and thumbnail
                            const baseUrl = `${req.protocol}://${req.get('host')}`;
                            const fullReel = {
                                ...reel,
                                product_ids: productIds,
                                seller_id: reel.seller_id
                            };
                            
                            // Add full URLs if paths exist
                            if (reel.video_url) {
                                // Check if it's already a full URL (Azure URL)
                                if (reel.video_url.startsWith('http')) {
                                    fullReel.video_url = appendSAS(reel.video_url);
                                } else {
                                    // For relative paths, construct full URL and append SAS token if it's an Azure URL
                                    const fullUrl = `${baseUrl}${reel.video_url}`;
                                    // Check if it's an Azure URL pattern (even if relative)
                                    if (reel.video_url.includes('blob.core.windows.net') || fullUrl.includes('blob.core.windows.net')) {
                                        fullReel.video_url = appendSAS(fullUrl);
                                    } else {
                                        fullReel.video_url = fullUrl;
                                    }
                                }
                            }
                            if (reel.thumbnail) {
                                fullReel.thumbnail = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                            }
                            
                            return res.status(200).json({
                                success: true,
                                data: fullReel
                            });
                        }
                    })
                } else {
                    const reel = results[0];
                    
                    // Process product IDs
                    let productIds = [];
                    if (reel.product_ids) {
                        // Handle product_ids which might be a comma-separated string or null
                        if (typeof reel.product_ids === 'string') {
                            // Split comma-separated string into array of integers
                            productIds = reel.product_ids.split(',').map(id => {
                                const numId = parseInt(id.trim());
                                return isNaN(numId) ? null : numId;
                            }).filter(id => id !== null);
                        } else if (Array.isArray(reel.product_ids)) {
                            // Already an array, ensure all elements are integers
                            productIds = reel.product_ids.map(id => {
                                const numId = parseInt(id);
                                return isNaN(numId) ? null : numId;
                            }).filter(id => id !== null);
                        } else {
                            // Single value, convert to array
                            const numId = parseInt(reel.product_ids);
                            productIds = isNaN(numId) ? [] : [numId];
                        }
                    }
                                        
                    // Construct full URLs for video and thumbnail
                    const baseUrl = `${req.protocol}://${req.get('host')}`;
                    const fullReel = {
                        ...reel,
                        product_ids: productIds,
                        influencer_id: reel.influencer_id
                    };
                    
                    // Add full URLs if paths exist
                    if (reel.video_url) {
                        console.log('Retrieving influencer reel video URL:', reel.video_url.substring(0, 100) + '...');
                        // Check if it's already a full URL (Azure or external)
                        if (reel.video_url.startsWith('http')) {
                            fullReel.video_url = appendSAS(reel.video_url);
                            if (isAzureBlobUrl(fullReel.video_url)) {
                                console.log('Azure video URL after appending SAS:', fullReel.video_url.substring(0, 100) + '...');
                            }
                        } else {
                            // For relative paths, construct full URL
                            // appendSAS will handle whether it needs a SAS token or not
                            const fullUrl = `${baseUrl}${reel.video_url}`;
                            fullReel.video_url = appendSAS(fullUrl);
                        }
                    } else {
                        console.warn('No video_url found for influencer reel ID:', id);
                    }
                    if (reel.thumbnail) {
                        fullReel.thumbnail = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                    }
                    
                    return res.status(200).json({
                        success: true,
                        data: fullReel
                    })
                }
            }
        })
    } catch (error) {
        console.error('Get reel by ID error:', error)
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch reel',
            error: error.message 
        })
    }
};

// Get all brand reels (combines oc_brand_reels and oc_seller_reels with brand_id)
// Added by Vaishnavi
const getBrandReels = async (req, res) => {
    try {
        // First, get all manufacturers from sagar database
        const manufacturersQuery = `
            SELECT manufacturer_id as id, name
            FROM oc_manufacturer
            ORDER BY name
        `;

        dbSagar.query(manufacturersQuery, (err, manufacturers) => {
            if (err) {
                console.error('Error fetching manufacturers:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching manufacturers',
                    error: err.message
                });
            }

            // Create a map for quick lookup
            const manufacturerMap = {};
            manufacturers.forEach(manufacturer => {
                manufacturerMap[manufacturer.id] = manufacturer.name;
            });

            // Query to fetch brand reels from oc_brand_reels table
            const brandReelsQuery = `
                SELECT 
                    br.id,
                    br.brand_id,
                    br.category_id,
                    c.name as category_name,
                    br.product_id,
                    NULL as product_name,
                    br.title,
                    br.description,
                    br.video_url,
                    br.thumbnail_url,
                    br.views,
                    br.likes,
                    br.comments,
                    CASE 
                        WHEN br.status = 1 THEN 'approved'
                        WHEN br.status = 2 THEN 'rejected'
                        ELSE 'pending'
                    END as status,
                    br.created_at,
                    'brand' as reel_type
                FROM oc_brand_reels br
                LEFT JOIN oc_reel_category c ON br.category_id = c.reel_category_id
            `;

            // Execute brand reels query
            db.query(brandReelsQuery, (err, brandResults) => {
                if (err) {
                    console.error('Error fetching brand reels:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error fetching brand reels',
                        error: err.message
                    });
                }

                // Add brand names to brand reels
                const brandedResults = brandResults.map(reel => ({
                    ...reel,
                    brand_name: manufacturerMap[reel.brand_id] || 'Unknown Brand'
                }));

                // Query to fetch seller reels that have a brand_id
                const sellerReelsQuery = `
                    SELECT 
                        sr.reel_id as id,
                        sr.seller_id as brand_id,
                        CONCAT(s.firstname, ' ', s.lastname) as brand_name,
                        0 as category_id,
                        'Uncategorized' as category_name,
                        NULL as product_id,
                        NULL as product_name,
                        sr.title,
                        sr.description,
                        sr.video_url,
                        sr.thumbnail as thumbnail_url,
                        0 as views,
                        0 as likes,
                        0 as comments,
                        CASE 
                            WHEN sr.status = 1 THEN 'approved'
                            WHEN sr.status = 2 THEN 'rejected'
                            ELSE 'pending'
                        END as status,
                        sr.date_added as created_at,
                        'seller' as reel_type
                    FROM oc_seller_reels sr
                    LEFT JOIN oc_sellers s ON sr.seller_id = s.vendor_id
                    WHERE sr.status = 1
                `;

                // Execute seller reels query
                db.query(sellerReelsQuery, (err, sellerResults) => {
                    if (err) {
                        console.error('Error fetching seller reels:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Error fetching seller reels',
                            error: err.message
                        });
                    }

                    // Combine both results
                    const allReels = [...brandedResults, ...sellerResults];

                    // Shuffle the results to display them randomly
                    const shuffledReels = allReels.sort(() => Math.random() - 0.5);

                    return res.status(200).json({
                        success: true,
                        data: shuffledReels
                    });
                });
            });
        });
    } catch (error) {
        console.error('Get brand reels error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch brand reels',
            error: error.message
        });
    }
};// Reject a specific influencer reel

// Get seller dashboard statistics
const getSellerDashboardStats = async (req, res) => {
    const { vendorId } = req.params;
    
    console.log('getSellerDashboardStats called with vendorId:', vendorId);
    
    if (!vendorId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Vendor ID is required' 
        })
    }
    
    try {
        // First, verify that the vendorId corresponds to a valid seller in oc_sellers
        const sellerQuery = `SELECT id FROM oc_sellers WHERE vendor_id = ?`;
        
        db.query(sellerQuery, [vendorId], (sellerErr, sellerResults) => {
            if (sellerErr) {
                console.error('Error fetching seller:', sellerErr);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching seller information',
                    error: sellerErr.message 
                });
            }
            
            if (sellerResults.length === 0) {
                console.log('Seller not found for vendorId:', vendorId);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Seller not found' 
                });
            }
            
            const sellerId = sellerResults[0].id;
            console.log('Found seller ID:', sellerId, 'for vendor ID:', vendorId);
            
            // Get total reels count
            const totalReelsQuery = `
                SELECT COUNT(*) as totalReels
                FROM oc_seller_reels
                WHERE seller_id = ?
            `;
            
            // Get approved reels count
            const approvedReelsQuery = `
                SELECT COUNT(*) as approvedReels
                FROM oc_seller_reels
                WHERE seller_id = ? AND status = 1
            `;
            
            // Get pending reels count
            const pendingReelsQuery = `
                SELECT COUNT(*) as pendingReels
                FROM oc_seller_reels
                WHERE seller_id = ? AND status = 0
            `;
            
            // Get rejected reels count
            const rejectedReelsQuery = `
                SELECT COUNT(*) as rejectedReels
                FROM oc_seller_reels
                WHERE seller_id = ? AND status = 2
            `;
            
            console.log('Executing queries for vendorId:', vendorId);
            
            // Execute all queries
            db.query(totalReelsQuery, [vendorId], (err, totalResults) => {
                if (err) {
                    console.error('Error fetching total reels:', err)
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error fetching total reels',
                        error: err.message 
                    })
                }
                
                console.log('Total reels query result:', totalResults);
                
                db.query(approvedReelsQuery, [vendorId], (err, approvedResults) => {
                    if (err) {
                        console.error('Error fetching approved reels:', err)
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Error fetching approved reels',
                            error: err.message 
                        })
                    }
                    
                    console.log('Approved reels query result:', approvedResults);
                    
                    db.query(pendingReelsQuery, [vendorId], (err, pendingResults) => {
                        if (err) {
                            console.error('Error fetching pending reels:', err)
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Error fetching pending reels',
                                error: err.message 
                            })
                        }
                        
                        console.log('Pending reels query result:', pendingResults);
                        
                        db.query(rejectedReelsQuery, [vendorId], (err, rejectedResults) => {
                            if (err) {
                                console.error('Error fetching rejected reels:', err)
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Error fetching rejected reels',
                                    error: err.message 
                                })
                            }
                            
                            console.log('Rejected reels query result:', rejectedResults);
                            
                            // Combine all results
                            const stats = {
                                totalReels: totalResults[0]?.totalReels || 0,
                                approvedReels: approvedResults[0]?.approvedReels || 0,
                                pendingReels: pendingResults[0]?.pendingReels || 0,
                                rejectedReels: rejectedResults[0]?.rejectedReels || 0
                            };
                            
                            console.log('Final stats result:', stats);
                            
                            return res.status(200).json({
                                success: true,
                                data: stats
                            })
                        })
                    })
                })
            })
        });
    } catch (error) {
        console.error('Get seller dashboard stats error:', error)
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch seller dashboard stats',
            error: error.message 
        })
    }
};

const deleteBrandReel = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Reel ID is required' });
    }
    try {
        db.getConnection((err, connection) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Database connection error' });
            }
            connection.beginTransaction(err => {
                if (err) {
                    connection.release();
                    return res.status(500).json({ success: false, message: 'Transaction error' });
                }
                const q = `DELETE FROM oc_brand_reels WHERE id = ?`;
                connection.query(q, [id], (err, result) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            return res.status(500).json({ success: false, message: 'Error deleting reel', error: err.message });
                        });
                    }
                    if ((result.affectedRows || 0) === 0) {
                        return connection.rollback(() => {
                            connection.release();
                            return res.status(404).json({ success: false, message: 'Reel not found' });
                        });
                    }
                    connection.commit(err => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                return res.status(500).json({ success: false, message: 'Error deleting reel' });
                            });
                        }
                        connection.release();
                        return res.status(200).json({ success: true, message: 'Reel deleted successfully' });
                    });
                });
            });
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to delete reel', error: error.message });
    }
};

// Get recent seller reels for dashboard
const getRecentSellerReels = async (req, res) => {
    const { vendorId } = req.params;
    const limit = req.query.limit || 5; // Default to 5 recent reels
    
    if (!vendorId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Vendor ID is required' 
        })
    }
    
    try {
        // First, verify that the vendorId corresponds to a valid seller in oc_sellers
        const sellerQuery = `SELECT id FROM oc_sellers WHERE vendor_id = ?`;
        
        db.query(sellerQuery, [vendorId], (sellerErr, sellerResults) => {
            if (sellerErr) {
                console.error('Error fetching seller:', sellerErr);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching seller information',
                    error: sellerErr.message 
                });
            }
            
            if (sellerResults.length === 0) {
                console.log('Seller not found for vendorId:', vendorId);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Seller not found' 
                });
            }
            
            const sellerId = sellerResults[0].id;
            console.log('Found seller ID:', sellerId, 'for vendor ID:', vendorId);
            
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            // Query that gets recent seller reels with product information
            const query = `
                SELECT 
                    sr.reel_id as id,
                    sr.title,
                    orc.name as category_name,
                    CASE 
                        WHEN sr.status = 1 THEN 'approved'
                        WHEN sr.status = 0 THEN 'pending'
                        WHEN sr.status = 2 THEN 'rejected'
                        ELSE 'unknown'
                    END as status,
                    0 as views,
                    0 as likes,
                    sr.date_added as created_at,
                    sr.video_url,
                    sr.thumbnail,
                    GROUP_CONCAT(srp.product_id) as product_ids
                FROM oc_seller_reels sr
                LEFT JOIN oc_seller_reel_to_category srtc ON sr.reel_id = srtc.reel_id
                LEFT JOIN oc_reel_category orc ON srtc.category_id = orc.reel_category_id
                LEFT JOIN oc_seller_reel_product srp ON sr.reel_id = srp.reel_id
                WHERE sr.seller_id = ?
                GROUP BY sr.reel_id
                ORDER BY sr.date_added DESC
                LIMIT ?
            `;
            
            db.query(query, [vendorId, parseInt(limit)], (err, results) => {
                if (err) {
                    console.error('Error fetching recent seller reels:', err)
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error fetching recent seller reels',
                        error: err.message 
                    })
                }
                
                // Process results to format product information
                const formattedResults = results.map(reel => {
                    let productIds = [];
                    let productCount = 0;
                    
                    // Handle product_ids which might be a comma-separated string or null
                    if (reel.product_ids) {
                        if (typeof reel.product_ids === 'string') {
                            // Split comma-separated string into array of integers
                            productIds = reel.product_ids.split(',').map(id => {
                                const numId = parseInt(id.trim());
                                return isNaN(numId) ? null : numId;
                            }).filter(id => id !== null);
                        } else if (Array.isArray(reel.product_ids)) {
                            // Already an array, ensure all elements are integers
                            productIds = reel.product_ids.map(id => {
                                const numId = parseInt(id);
                                return isNaN(numId) ? null : numId;
                            }).filter(id => id !== null);
                        } else {
                            // Single value, convert to array
                            const numId = parseInt(reel.product_ids);
                            productIds = isNaN(numId) ? [] : [numId];
                        }
                        
                        productCount = productIds.length;
                    }
                    
                    // Construct full URLs for video and thumbnail
                    let fullVideoUrl = null;
                    let fullThumbnailUrl = null;
                    
                    if (reel.video_url) {
                        fullVideoUrl = reel.video_url.startsWith('http') ? reel.video_url : `${baseUrl}${reel.video_url}`;
                    }
                    if (reel.thumbnail) {
                        fullThumbnailUrl = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                    }
                    
                    return {
                        ...reel,
                        video_url: fullVideoUrl,
                        thumbnail: fullThumbnailUrl,
                        product_ids: productIds,
                        product_count: productCount
                    };
                })
                
                return res.status(200).json({
                    success: true,
                    data: formattedResults
                })
            })
        });
    } catch (error) {
        console.error('Get recent seller reels error:', error)
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch recent seller reels',
            error: error.message 
        })
    }
};

// Get approved reels count across all sellers and influencers
const getApprovedReelsCount = async (req, res) => {
    try {
        // Get approved seller reels count
        const sellerApprovedQuery = `
            SELECT COUNT(*) as approvedReels
            FROM oc_seller_reels
            WHERE status = 1
        `;
        
        // Get approved influencer reels count
        const influencerApprovedQuery = `
            SELECT COUNT(*) as approvedReels
            FROM oc_influencer_reels
            WHERE status = 1
        `;
        
        // Get total sellers count
        const sellersQuery = `
            SELECT COUNT(*) as totalSellers
            FROM oc_sellers
        `;
        
        // Get total influencers count
        const influencersQuery = `
            SELECT COUNT(*) as totalInfluencers
            FROM oc_influencers
        `;
        
        // Get today's approved reels count for seller reels
        const todaySellerApprovedQuery = `
            SELECT COUNT(*) as todayApprovedReels
            FROM oc_seller_reels
            WHERE status = 1 AND DATE(date_added) = CURDATE()
        `;
        
        // Get today's approved reels count for influencer reels
        const todayInfluencerApprovedQuery = `
            SELECT COUNT(*) as todayApprovedReels
            FROM oc_influencer_reels
            WHERE status = 1 AND DATE(date_added) = CURDATE()
        `;        
        // Get today's pending reels count for seller reels
        const todaySellerPendingQuery = `
            SELECT COUNT(*) as todayPendingReels
            FROM oc_seller_reels
            WHERE status = 0 AND DATE(date_added) = CURDATE()
        `;
        
        // Get today's pending reels count for influencer reels
        const todayInfluencerPendingQuery = `
            SELECT COUNT(*) as todayPendingReels
            FROM oc_influencer_reels
            WHERE status = 0 AND DATE(date_added) = CURDATE()
        `;        
        // Get today's rejected reels count for seller reels
        const todaySellerRejectedQuery = `
            SELECT COUNT(*) as todayRejectedReels
            FROM oc_seller_reels
            WHERE status = 2 AND DATE(date_added) = CURDATE()
        `;
        
        // Get today's rejected reels count for influencer reels
        const todayInfluencerRejectedQuery = `
            SELECT COUNT(*) as todayRejectedReels
            FROM oc_influencer_reels
            WHERE status = 2 AND DATE(date_added) = CURDATE()
        `;        
        // Get total reels count for seller reels
        const totalSellerReelsQuery = `
            SELECT COUNT(*) as totalReels
            FROM oc_seller_reels
        `;
        
        // Get total reels count for influencer reels
        const totalInfluencerReelsQuery = `
            SELECT COUNT(*) as totalReels
            FROM oc_influencer_reels
        `;
        
        // Get pending reels count for seller reels
        const pendingSellerReelsQuery = `
            SELECT COUNT(*) as pendingReels
            FROM oc_seller_reels
            WHERE status = 0
        `;
        
        // Get pending reels count for influencer reels
        const pendingInfluencerReelsQuery = `
            SELECT COUNT(*) as pendingReels
            FROM oc_influencer_reels
            WHERE status = 0
        `;
        
        // Get rejected reels count for seller reels
        const rejectedSellerReelsQuery = `
            SELECT COUNT(*) as rejectedReels
            FROM oc_seller_reels
            WHERE status = 2
        `;
        
        // Get rejected reels count for influencer reels
        const rejectedInfluencerReelsQuery = `
            SELECT COUNT(*) as rejectedReels
            FROM oc_influencer_reels
            WHERE status = 2
        `;
        
        // Execute all queries
        db.query(sellerApprovedQuery, (err, sellerApprovedResults) => {
            if (err) {
                console.error('Error fetching seller approved reels:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching seller approved reels',
                    error: err.message 
                });
            }
            
            db.query(influencerApprovedQuery, (err, influencerApprovedResults) => {
                if (err) {
                    console.error('Error fetching influencer approved reels:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error fetching influencer approved reels',
                        error: err.message 
                    });
                }
                
                db.query(sellersQuery, (err, sellersResults) => {
                    if (err) {
                        console.error('Error fetching sellers count:', err);
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Error fetching sellers count',
                            error: err.message 
                        });
                    }
                    
                    db.query(influencersQuery, (err, influencersResults) => {
                        if (err) {
                            console.error('Error fetching influencers count:', err);
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Error fetching influencers count',
                                error: err.message 
                            });
                        }
                        
                        db.query(todaySellerApprovedQuery, (err, todaySellerApprovedResults) => {
                            if (err) {
                                console.error('Error fetching today seller approved reels:', err);
                                return res.status(500).json({ 
                                    success: false, 
                                    message: 'Error fetching today seller approved reels',
                                    error: err.message 
                                });
                            }
                            
                            db.query(todayInfluencerApprovedQuery, (err, todayInfluencerApprovedResults) => {
                                if (err) {
                                    console.error('Error fetching today influencer approved reels:', err);
                                    return res.status(500).json({ 
                                        success: false, 
                                        message: 'Error fetching today influencer approved reels',
                                        error: err.message 
                                    });
                                }
                                
                                db.query(todaySellerPendingQuery, (err, todaySellerPendingResults) => {
                                    if (err) {
                                        console.error('Error fetching today seller pending reels:', err);
                                        return res.status(500).json({ 
                                            success: false, 
                                            message: 'Error fetching today seller pending reels',
                                            error: err.message 
                                        });
                                    }
                                    
                                    db.query(todayInfluencerPendingQuery, (err, todayInfluencerPendingResults) => {
                                        if (err) {
                                            console.error('Error fetching today influencer pending reels:', err);
                                            return res.status(500).json({ 
                                                success: false, 
                                                message: 'Error fetching today influencer pending reels',
                                                error: err.message 
                                            });
                                        }
                                        
                                        db.query(todaySellerRejectedQuery, (err, todaySellerRejectedResults) => {
                                            if (err) {
                                                console.error('Error fetching today seller rejected reels:', err);
                                                return res.status(500).json({ 
                                                    success: false, 
                                                    message: 'Error fetching today seller rejected reels',
                                                    error: err.message 
                                                });
                                            }
                                            
                                            db.query(todayInfluencerRejectedQuery, (err, todayInfluencerRejectedResults) => {
                                                if (err) {
                                                    console.error('Error fetching today influencer rejected reels:', err);
                                                    return res.status(500).json({ 
                                                        success: false, 
                                                        message: 'Error fetching today influencer rejected reels',
                                                        error: err.message 
                                                    });
                                                }
                                                
                                                db.query(totalSellerReelsQuery, (err, totalSellerReelsResults) => {
                                                    if (err) {
                                                        console.error('Error fetching total seller reels:', err);
                                                        return res.status(500).json({ 
                                                            success: false, 
                                                            message: 'Error fetching total seller reels',
                                                            error: err.message 
                                                        });
                                                    }
                                                    
                                                    db.query(totalInfluencerReelsQuery, (err, totalInfluencerReelsResults) => {
                                                        if (err) {
                                                            console.error('Error fetching total influencer reels:', err);
                                                            return res.status(500).json({ 
                                                                success: false, 
                                                                message: 'Error fetching total influencer reels',
                                                                error: err.message 
                                                            });
                                                        }
                                                        
                                                        db.query(pendingSellerReelsQuery, (err, pendingSellerReelsResults) => {
                                                            if (err) {
                                                                console.error('Error fetching pending seller reels:', err);
                                                                return res.status(500).json({ 
                                                                    success: false, 
                                                                    message: 'Error fetching pending seller reels',
                                                                    error: err.message 
                                                                });
                                                            }
                                                            
                                                            db.query(pendingInfluencerReelsQuery, (err, pendingInfluencerReelsResults) => {
                                                                if (err) {
                                                                    console.error('Error fetching pending influencer reels:', err);
                                                                    return res.status(500).json({ 
                                                                        success: false, 
                                                                        message: 'Error fetching pending influencer reels',
                                                                        error: err.message 
                                                                    });
                                                                }
                                                                
                                                                db.query(rejectedSellerReelsQuery, (err, rejectedSellerReelsResults) => {
                                                                    if (err) {
                                                                        console.error('Error fetching rejected seller reels:', err);
                                                                        return res.status(500).json({ 
                                                                            success: false, 
                                                                            message: 'Error fetching rejected seller reels',
                                                                            error: err.message 
                                                                        });
                                                                    }
                                                                    
                                                                    db.query(rejectedInfluencerReelsQuery, (err, rejectedInfluencerReelsResults) => {
                                                                        if (err) {
                                                                            console.error('Error fetching rejected influencer reels:', err);
                                                                            return res.status(500).json({ 
                                                                                success: false, 
                                                                                message: 'Error fetching rejected influencer reels',
                                                                                error: err.message 
                                                                            });
                                                                        }
                                                                        
                                                                        // Combine all results
                                                                        const sellerReels = sellerApprovedResults[0]?.approvedReels || 0;
                                                                        const influencerReels = influencerApprovedResults[0]?.approvedReels || 0;
                                                                        const brandReels = 0; // Assuming no brand reels for now
                                                                        
                                                                        const totalApprovedReels = sellerReels + influencerReels + brandReels;
                                                                        const totalPendingReels = (pendingSellerReelsResults[0]?.pendingReels || 0) + (pendingInfluencerReelsResults[0]?.pendingReels || 0);
                                                                        const totalRejectedReels = (rejectedSellerReelsResults[0]?.rejectedReels || 0) + (rejectedInfluencerReelsResults[0]?.rejectedReels || 0);
                                                                        const totalAllReels = (totalSellerReelsResults[0]?.totalReels || 0) + (totalInfluencerReelsResults[0]?.totalReels || 0);
                                                                        
                                                                        const todayAllReels = (todaySellerApprovedResults[0]?.todayApprovedReels || 0) + (todayInfluencerApprovedResults[0]?.todayApprovedReels || 0) + (todaySellerPendingResults[0]?.todayPendingReels || 0) + (todayInfluencerPendingResults[0]?.todayPendingReels || 0) + (todaySellerRejectedResults[0]?.todayRejectedReels || 0) + (todayInfluencerRejectedResults[0]?.todayRejectedReels || 0);
                                                                        const todayApprovedReels = (todaySellerApprovedResults[0]?.todayApprovedReels || 0) + (todayInfluencerApprovedResults[0]?.todayApprovedReels || 0);
                                                                        const todayPendingReels = (todaySellerPendingResults[0]?.todayPendingReels || 0) + (todayInfluencerPendingResults[0]?.todayPendingReels || 0);
                                                                        const todayRejectedReels = (todaySellerRejectedResults[0]?.todayRejectedReels || 0) + (todayInfluencerRejectedResults[0]?.todayRejectedReels || 0);
                                                                        
                                                                        const totalSellers = sellersResults[0]?.totalSellers || 0;
                                                                        const totalInfluencers = influencersResults[0]?.totalInfluencers || 0;
                                                                        
                                                                        const responseData = {
                                                                            sellerReels,
                                                                            influencerReels,
                                                                            brandReels,
                                                                            totalApprovedReels,
                                                                            totalPendingReels,
                                                                            totalRejectedReels,
                                                                            totalAllReels,
                                                                            todayAllReels,
                                                                            todayApprovedReels,
                                                                            todayPendingReels,
                                                                            todayRejectedReels,
                                                                            totalSellers,
                                                                            totalInfluencers
                                                                        };
                                                                        
                                                                        console.log('Approved reels count result:', responseData);
                                                                        
                                                                        return res.status(200).json({
                                                                            success: true,
                                                                            data: responseData
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    } catch (error) {
        console.error('Get approved reels count error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch approved reels count',
            error: error.message 
        });
    }
};

// Get recent approved reels across sellers and influencers for dashboard
const getRecentApprovedReels = async (req, res) => {
    const limit = Number(req.query.limit) || 8;
    try {
        const query = `
            SELECT * FROM (
                SELECT 
                    sr.reel_id,
                    sr.title,
                    'seller' AS reel_type,
                    CONCAT(s.firstname, ' ', s.lastname) AS owner_name,
                    sr.status,
                    sr.date_added
                FROM oc_seller_reels sr
                JOIN oc_sellers s ON sr.seller_id = s.vendor_id
                WHERE sr.status = 1
                
                UNION ALL
                
                SELECT 
                    ir.reel_id,
                    ir.title,
                    'influencer' AS reel_type,
                    CONCAT(oi.firstname, ' ', oi.lastname) AS owner_name,
                    ir.status,
                    ir.date_added
                FROM oc_influencer_reels ir
                JOIN oc_influencers oi ON ir.influencer_id = oi.id
                WHERE ir.status = 1
            ) AS combined
            ORDER BY date_added DESC
            LIMIT ?
        `;

        db.query(query, [limit], (err, results) => {
            if (err) {
                console.error('Error fetching recent approved reels:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching recent approved reels',
                    error: err.message
                });
            }

            return res.status(200).json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('Get recent approved reels error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch recent approved reels',
            error: error.message
        });
    }
};

// Approve a seller reel
const approveSellerReel = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Reel ID is required'
            });
        }
        
        console.log('=== APPROVE SELLER REEL ENDPOINT CALLED ===');
        console.log('Reel ID:', id);
        
        // First, fetch reel data
        const reelQuery = `SELECT reel_id, title, seller_id FROM oc_seller_reels WHERE reel_id = ?`;
        
        db.query(reelQuery, [id], async (reelErr, reelResults) => {
            if (reelErr) {
                console.error('Error fetching seller reel:', reelErr);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching reel information',
                    error: reelErr.message
                });
            }
            
            if (reelResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Reel not found'
                });
            }
            
            const reel = reelResults[0];
            console.log('Fetched reel:', { reel_id: reel.reel_id, title: reel.title, seller_id: reel.seller_id });
            
            // Fetch seller data from dbSagar (oc_vendor is in sagar database)
            const sellerQuery = `
                SELECT 
                    vendor_id,
                    firstname,
                    lastname,
                    email,
                    telephone
                FROM oc_vendor
                WHERE vendor_id = ?
            `;
            
            dbSagar.query(sellerQuery, [reel.seller_id], async (fetchErr, fetchResults) => {
                if (fetchErr) {
                    console.error('Error fetching seller data:', fetchErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Error fetching seller information',
                        error: fetchErr.message
                    });
                }
                
                if (fetchResults.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Seller not found'
                    });
                }
                
                const seller = fetchResults[0];
                
                // Get phone number - try telephone, mobile, or phone fields
                const phoneNumber = seller.telephone || seller.mobile || seller.phone || null;
                
                console.log('Raw seller data from database:', JSON.stringify(seller, null, 2));
                console.log('Extracted phone number:', phoneNumber);
                console.log('Phone number fields available:', {
                    telephone: seller.telephone,
                    mobile: seller.mobile,
                    phone: seller.phone
                });
                
                const reelData = {
                    reel_id: reel.reel_id,
                    title: reel.title,
                    vendor_id: seller.vendor_id,
                    firstname: seller.firstname,
                    lastname: seller.lastname,
                    email: seller.email,
                    telephone: phoneNumber  // Use the extracted phone number
                };
                
                console.log('Fetched seller data for notification:', {
                    reel_id: reelData.reel_id,
                    title: reelData.title,
                    vendor_id: reelData.vendor_id,
                    name: `${reelData.firstname} ${reelData.lastname}`,
                    phone: reelData.telephone,
                    email: reelData.email
                });
                
                // Validate phone number before proceeding
                if (!reelData.telephone || reelData.telephone.trim() === '') {
                    console.error('❌ CRITICAL: Phone number is missing or empty for seller:', reelData.vendor_id);
                    console.error('Cannot send WhatsApp notification without phone number');
                    // Continue with the approval/rejection but log the issue
                }
            
            // Update the status to approved (1)
            const updateQuery = `
                UPDATE oc_seller_reels
                SET status = 1, date_modified = CURRENT_TIMESTAMP 
                WHERE reel_id = ?
            `;
            
            db.query(updateQuery, [id], async (err, result) => {
                if (err) {
                    console.error('Error approving seller reel:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Failed to approve reel',
                        error: err.message
                    });
                }
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Reel not found'
                    });
                }
                
                console.log('✅✅✅ Reel approved successfully. Starting WhatsApp notification process...');
                console.log('📊 Reel data being sent to notification service:');
                console.log(JSON.stringify(reelData, null, 2));
                console.log('📞 Phone number in reelData.telephone:', reelData.telephone);
                console.log('📞 Phone number type:', typeof reelData.telephone);
                console.log('📞 Phone number length:', reelData.telephone ? reelData.telephone.length : 'null/undefined');
                
                // Send WhatsApp notification
                try {
                    console.log('🔔 Loading notification service module...');
                    const { sendSellerReelApprovalNotification } = require('../../Services/Notifications/notificationService');
                    console.log('🔔 Notification function loaded. Calling sendSellerReelApprovalNotification...');
                    
                    const notificationResult = await sendSellerReelApprovalNotification(reelData);
                    
                    console.log('✅✅✅ WhatsApp reel approval notification COMPLETED');
                    console.log('📬 Notification result:', JSON.stringify(notificationResult, null, 2));
                    
                    if (!notificationResult || !notificationResult.success) {
                        console.error('⚠️⚠️⚠️ Notification returned unsuccessful or no result');
                        console.error('Result object:', notificationResult);
                        console.error('Error message:', notificationResult?.message || notificationResult?.error || 'Unknown error');
                    } else {
                        console.log('✅✅✅ Notification sent successfully!');
                    }
                } catch (notifError) {
                    console.error('❌❌❌ EXCEPTION occurred while sending WhatsApp notification for reel approval');
                    console.error('❌ Error type:', notifError?.constructor?.name || 'Unknown');
                    console.error('❌ Error message:', notifError?.message || 'No message');
                    console.error('❌ Error stack:', notifError?.stack || 'No stack trace');
                    if (notifError?.response) {
                        console.error('❌ HTTP Status:', notifError.response.status);
                        console.error('❌ Response Data:', JSON.stringify(notifError.response.data, null, 2));
                    }
                    if (notifError?.request) {
                        console.error('❌ Request was made but no response received');
                    }
                    // Don't fail the request if notification fails
                }
                
                console.log('✅✅✅ Notification process finished (regardless of success/failure)');
                
                res.json({
                    success: true,
                    message: 'Reel approved successfully'
                });
            });
            });
        });
    } catch (error) {
        console.error('ApproveSellerReel error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Reject a seller reel
const rejectSellerReel = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Reel ID is required'
            });
        }
        
        console.log('=== REJECT SELLER REEL ENDPOINT CALLED ===');
        console.log('Reel ID:', id);
        
        // First, fetch reel data
        const reelQuery = `SELECT reel_id, title, seller_id FROM oc_seller_reels WHERE reel_id = ?`;
        
        db.query(reelQuery, [id], async (reelErr, reelResults) => {
            if (reelErr) {
                console.error('Error fetching seller reel:', reelErr);
                return res.status(500).json({
                    success: false,
                    message: 'Error fetching reel information',
                    error: reelErr.message
                });
            }
            
            if (reelResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Reel not found'
                });
            }
            
            const reel = reelResults[0];
            console.log('Fetched reel:', { reel_id: reel.reel_id, title: reel.title, seller_id: reel.seller_id });
            
            // Fetch seller data from dbSagar (oc_vendor is in sagar database)
            const sellerQuery = `
                SELECT 
                    vendor_id,
                    firstname,
                    lastname,
                    email,
                    telephone
                FROM oc_vendor
                WHERE vendor_id = ?
            `;
            
            dbSagar.query(sellerQuery, [reel.seller_id], async (fetchErr, fetchResults) => {
                if (fetchErr) {
                    console.error('Error fetching seller data:', fetchErr);
                    return res.status(500).json({
                        success: false,
                        message: 'Error fetching seller information',
                        error: fetchErr.message
                    });
                }
                
                if (fetchResults.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Seller not found'
                    });
                }
                
                const seller = fetchResults[0];
                
                // Get phone number - try telephone, mobile, or phone fields
                const phoneNumber = seller.telephone || seller.mobile || seller.phone || null;
                
                console.log('Raw seller data from database:', JSON.stringify(seller, null, 2));
                console.log('Extracted phone number:', phoneNumber);
                console.log('Phone number fields available:', {
                    telephone: seller.telephone,
                    mobile: seller.mobile,
                    phone: seller.phone
                });
                
                const reelData = {
                    reel_id: reel.reel_id,
                    title: reel.title,
                    vendor_id: seller.vendor_id,
                    firstname: seller.firstname,
                    lastname: seller.lastname,
                    email: seller.email,
                    telephone: phoneNumber  // Use the extracted phone number
                };
                
                console.log('Fetched seller data for notification:', {
                    reel_id: reelData.reel_id,
                    title: reelData.title,
                    vendor_id: reelData.vendor_id,
                    name: `${reelData.firstname} ${reelData.lastname}`,
                    phone: reelData.telephone,
                    email: reelData.email
                });
                
                // Validate phone number before proceeding
                if (!reelData.telephone || reelData.telephone.trim() === '') {
                    console.error('❌ CRITICAL: Phone number is missing or empty for seller:', reelData.vendor_id);
                    console.error('Cannot send WhatsApp notification without phone number');
                    // Continue with the approval/rejection but log the issue
                }
                
                // Update the status to rejected (2)
                const updateQuery = `
                    UPDATE oc_seller_reels
                    SET status = 2, date_modified = CURRENT_TIMESTAMP 
                    WHERE reel_id = ?
                `;
                
                db.query(updateQuery, [id], async (err, result) => {
                    if (err) {
                        console.error('Error rejecting seller reel:', err);
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to reject reel',
                            error: err.message
                        });
                    }
                    
                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            success: false,
                            message: 'Reel not found'
                        });
                    }
                    
                console.log('✅✅✅ Reel rejected successfully. Starting WhatsApp notification process...');
                console.log('📊 Reel data being sent to notification service:');
                console.log(JSON.stringify(reelData, null, 2));
                console.log('📞 Phone number in reelData.telephone:', reelData.telephone);
                console.log('📞 Phone number type:', typeof reelData.telephone);
                console.log('📞 Phone number length:', reelData.telephone ? reelData.telephone.length : 'null/undefined');
                
                // Send WhatsApp notification
                try {
                    console.log('🔔 Loading notification service module...');
                    const { sendSellerReelRejectionNotification } = require('../../Services/Notifications/notificationService');
                    console.log('🔔 Notification function loaded. Calling sendSellerReelRejectionNotification...');
                    
                    const notificationResult = await sendSellerReelRejectionNotification(reelData);
                    
                    console.log('✅✅✅ WhatsApp reel rejection notification COMPLETED');
                    console.log('📬 Notification result:', JSON.stringify(notificationResult, null, 2));
                    
                    if (!notificationResult || !notificationResult.success) {
                        console.error('⚠️⚠️⚠️ Notification returned unsuccessful or no result');
                        console.error('Result object:', notificationResult);
                        console.error('Error message:', notificationResult?.message || notificationResult?.error || 'Unknown error');
                    } else {
                        console.log('✅✅✅ Notification sent successfully!');
                    }
                } catch (notifError) {
                    console.error('❌❌❌ EXCEPTION occurred while sending WhatsApp notification for reel rejection');
                    console.error('❌ Error type:', notifError?.constructor?.name || 'Unknown');
                    console.error('❌ Error message:', notifError?.message || 'No message');
                    console.error('❌ Error stack:', notifError?.stack || 'No stack trace');
                    if (notifError?.response) {
                        console.error('❌ HTTP Status:', notifError.response.status);
                        console.error('❌ Response Data:', JSON.stringify(notifError.response.data, null, 2));
                    }
                    if (notifError?.request) {
                        console.error('❌ Request was made but no response received');
                    }
                    // Don't fail the request if notification fails
                }
                
                console.log('✅✅✅ Notification process finished (regardless of success/failure)');
                    
                    res.json({
                        success: true,
                        message: 'Reel rejected successfully'
                    });
                });
            });
        });
    } catch (error) {
        console.error('RejectSellerReel error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all influencer reels for admin list
// Added by Vaishnavi
const getInfluencerReelsAdmin = async (req, res) => {
    try {
        // Exact same pattern as seller reels - simple JOIN, no complex queries
        const query = `
            SELECT 
                ir.reel_id as id,
                ir.influencer_id,
                ir.title,
                ir.description,
                ir.video_url,
                ir.thumbnail,
                CASE 
                    WHEN ir.status = 1 THEN 'approved'
                    WHEN ir.status = 0 THEN 'pending'
                    WHEN ir.status = 2 THEN 'rejected'
                    ELSE 'unknown'
                END as status,
                COALESCE(ir.views, 0) as views,
                COALESCE(ir.likes, 0) as likes,
                COALESCE(ir.comments, 0) as comments,
                ir.date_added as created_at,
                CONCAT(oi.firstname, ' ', oi.lastname) as influencer_name,
                oi.firstname as influencer_firstname,
                oi.lastname as influencer_lastname,
                oi.email as influencer_email,
                oi.platform,
                oi.account_link
            FROM oc_influencer_reels ir
            JOIN oc_influencers oi ON ir.influencer_id = oi.id
            ORDER BY ir.date_added DESC
        `;
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching influencer reels:', err);
                console.error('SQL Query:', query);
                console.error('Error details:', {
                    code: err.code,
                    sqlMessage: err.sqlMessage,
                    sqlState: err.sqlState,
                    errno: err.errno
                });
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching influencer reels',
                    error: err.message,
                    sqlError: err.sqlMessage || err.message,
                    errorCode: err.code
                });
            }
            
            // Process results - add empty arrays for product_ids and category_name
            // These can be fetched separately if needed, but for now keep it simple
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const processedResults = results.map(reel => {
                // Append SAS token to video URL
                let videoUrlWithSAS = null;
                if (reel.video_url) {
                    const fullVideoUrl = reel.video_url.startsWith('http') ? reel.video_url : `${baseUrl}${reel.video_url}`;
                    videoUrlWithSAS = appendSAS(fullVideoUrl);
                    
                    // Log for debugging
                    const hasSasToken = videoUrlWithSAS.includes('?') || videoUrlWithSAS.includes('&');
                    if (!hasSasToken) {
                        console.warn(`[getInfluencerReelsAdmin] WARNING: Video URL missing SAS token for reel ${reel.id}`);
                    }
                }
                
                // Append SAS token to thumbnail URL if it's an Azure URL
                let thumbnailUrl = reel.thumbnail;
                if (thumbnailUrl && thumbnailUrl.startsWith('http') && thumbnailUrl.includes('blob.core.windows.net')) {
                    thumbnailUrl = appendSAS(thumbnailUrl);
                }
                
                return {
                    ...reel,
                    video_url: videoUrlWithSAS,
                    thumbnail: thumbnailUrl,
                    product_ids: [], // Will be empty for now - can add later if needed
                    category_name: '', // Will be empty for now - can add later if needed
                    views: Number(reel.views || 0),
                    likes: Number(reel.likes || 0),
                    comments: Number(reel.comments || 0)
                };
            });
            
            return res.status(200).json({
                success: true,
                data: processedResults
            });
        });
    } catch (error) {
        console.error('Get influencer reels error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch influencer reels',
            error: error.message 
        });
    }
};
// Get reels for a specific influencer by ID
// Added by Vaishnavi
const getInfluencerReelsById = async (req, res) => {
    try {
        const { influencerId } = req.params;
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // Validate influencerId
        if (!influencerId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Influencer ID is required' 
            });
        }
        
        // Build query to get influencer reels by influencer ID
        const query = `
            SELECT 
                ir.reel_id as id,
                ir.title,
                ir.description,
                ir.video_url,
                ir.thumbnail,
                orc.name as category_name,
                CASE 
                    WHEN ir.status = 1 THEN 'approved'
                    WHEN ir.status = 0 THEN 'pending'
                    WHEN ir.status = 2 THEN 'rejected'
                    ELSE 'unknown'
                END as status,
                0 as views,
                0 as likes,
                ir.date_added as created_at,
                GROUP_CONCAT(irp.product_id) as product_ids
            FROM oc_influencer_reels ir
            LEFT JOIN oc_influencer_reel_to_category irtc ON ir.reel_id = irtc.reel_id
            LEFT JOIN oc_reel_category orc ON irtc.category_id = orc.reel_category_id
            LEFT JOIN oc_influencer_reel_product irp ON ir.reel_id = irp.reel_id
            WHERE ir.influencer_id = ?
            GROUP BY ir.reel_id
            ORDER BY ir.date_added DESC
        `;
        
        db.query(query, [influencerId], (err, results) => {
            if (err) {
                console.error('Error fetching influencer reels by ID:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching influencer reels',
                    error: err.message 
                });
            }
            
            // Process results and append SAS tokens to video URLs
            const processedResults = results.map(reel => {
                // Append SAS token to video URL (only for Azure URLs)
                let videoUrlWithSAS = null;
                if (reel.video_url) {
                    const fullVideoUrl = reel.video_url.startsWith('http') ? reel.video_url : `${baseUrl}${reel.video_url}`;
                    videoUrlWithSAS = appendSAS(fullVideoUrl);
                    
                    // Log for debugging (only for Azure URLs)
                    if (isAzureBlobUrl(videoUrlWithSAS)) {
                        const hasSasToken = videoUrlWithSAS.includes('?') || videoUrlWithSAS.includes('&');
                        const { token: sasToken, source: sasSource } = resolveSasToken();
                        console.log(`[getInfluencerReelsById] Azure video URL for reel ${reel.id}:`, {
                            original: reel.video_url?.substring(0, 100),
                            withSAS: videoUrlWithSAS.substring(0, 100),
                            hasSasToken: hasSasToken,
                            sasConfigured: Boolean(sasToken),
                            sasSource: sasSource || 'none'
                        });
                        if (!hasSasToken) {
                            console.warn(`[getInfluencerReelsById] WARNING: Azure video URL missing SAS token for reel ${reel.id}`);
                            if (!sasToken) {
                                console.warn('[getInfluencerReelsById] SAS token not configured in environment.');
                            }
                        }
                    }
                }
                
                // Append SAS token to thumbnail URL if it's an Azure URL
                let thumbnailUrl = reel.thumbnail;
                if (thumbnailUrl && thumbnailUrl.startsWith('http') && thumbnailUrl.includes('blob.core.windows.net')) {
                    thumbnailUrl = appendSAS(thumbnailUrl);
                }
                
                return {
                    ...reel,
                    video_url: videoUrlWithSAS,
                    thumbnail: thumbnailUrl,
                    product_ids: reel.product_ids ? reel.product_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [],
                    product_names: [],
                    brand_names: []
                };
            });

            const allProductIds = Array.from(new Set(processedResults.flatMap(r => r.product_ids)));
            if (allProductIds.length === 0) {
                return res.status(200).json({ success: true, data: processedResults });
            }
            
            const namesQuery = `
                SELECT p.product_id as id, pd.name, p.manufacturer_id as brand_id
                FROM oc_product p
                JOIN oc_product_description pd ON p.product_id = pd.product_id AND pd.language_id = 1
                WHERE p.product_id IN (${allProductIds.map(() => '?').join(',')})
            `;
            dbSagar.query(namesQuery, allProductIds, (nErr, rows) => {
                if (nErr) {
                    console.error('Error fetching influencer product names:', nErr);
                    return res.status(200).json({ success: true, data: processedResults });
                }
                const productNameMap = {};
                const brandIdSet = new Set();
                rows.forEach(r => { productNameMap[r.id] = r.name; if (r.brand_id) brandIdSet.add(r.brand_id); });
                const brandIds = Array.from(brandIdSet);
                if (brandIds.length === 0) {
                    const withNames = processedResults.map(reel => ({
                        ...reel,
                        product_names: reel.product_ids.map(pid => productNameMap[pid]).filter(Boolean)
                    }));
                    return res.status(200).json({ success: true, data: withNames });
                }
                const brandQuery = `SELECT manufacturer_id as id, name FROM oc_manufacturer WHERE manufacturer_id IN (${brandIds.map(() => '?').join(',')})`;
                dbSagar.query(brandQuery, brandIds, (bErr, bRows) => {
                    if (bErr) {
                        console.error('Error fetching influencer brand names:', bErr);
                        const withNames = processedResults.map(reel => ({
                            ...reel,
                            product_names: reel.product_ids.map(pid => productNameMap[pid]).filter(Boolean)
                        }));
                        return res.status(200).json({ success: true, data: withNames });
                    }
                    const brandNameMap = {};
                    bRows.forEach(b => { brandNameMap[b.id] = b.name; });
                    const withNamesBrands = processedResults.map(reel => {
                        const brandNamesFromProducts = reel.product_ids
                            .map(pid => {
                                const row = rows.find(r => r.id === pid);
                                return row && brandNameMap[row.brand_id];
                            })
                            .filter(Boolean);
                        const uniqueBrandNames = Array.from(new Set(brandNamesFromProducts));
                        return {
                            ...reel,
                            product_names: reel.product_ids.map(pid => productNameMap[pid]).filter(Boolean),
                            brand_names: uniqueBrandNames
                        };
                    });
                    return res.status(200).json({ success: true, data: withNamesBrands });
                });
            });
        });
    } catch (error) {
        console.error('Get influencer reels by ID error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch influencer reels',
            error: error.message 
        });
    }
};
// Approve a specific influencer reel
// Added by Vaishnavi
const approveInfluencerReel = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate id
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Reel ID is required' 
            });
        }
        
        console.log('=== APPROVE INFLUENCER REEL ENDPOINT CALLED ===');
        console.log('Reel ID:', id);
        
        // First, fetch reel and influencer data before updating
        const fetchQuery = `
            SELECT 
                ir.reel_id,
                ir.title,
                ir.influencer_id,
                oi.firstname,
                oi.lastname,
                oi.email,
                oi.telephone
            FROM oc_influencer_reels ir
            JOIN oc_influencers oi ON ir.influencer_id = oi.id
            WHERE ir.reel_id = ?
        `;
        
        db.query(fetchQuery, [id], async (fetchErr, fetchResults) => {
            if (fetchErr) {
                console.error('Error fetching influencer reel data:', fetchErr);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching reel information',
                    error: fetchErr.message 
                });
            }
            
            if (fetchResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Reel not found'
                });
            }
            
            const reelData = fetchResults[0];
            console.log('Fetched reel data for notification:', {
                reel_id: reelData.reel_id,
                title: reelData.title,
                influencer_id: reelData.influencer_id,
                name: `${reelData.firstname} ${reelData.lastname}`,
                phone: reelData.telephone,
                email: reelData.email
            });
            
            // Build query to update influencer reel status to approved (1)
            const updateQuery = `UPDATE oc_influencer_reels SET status = 1 WHERE reel_id = ?`;
            
            db.query(updateQuery, [id], async (err, results) => {
                if (err) {
                    console.error('Error approving influencer reel:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error approving influencer reel',
                        error: err.message 
                    });
                }
                
                if (results.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Reel not found'
                    });
                }
                
                console.log('Reel approved successfully. Sending WhatsApp notification...');
                console.log('Reel data being sent to notification:', JSON.stringify(reelData, null, 2));
                
                // Send WhatsApp notification
                try {
                    const { sendInfluencerReelApprovalNotification } = require('../../Services/Notifications/notificationService');
                    const notificationResult = await sendInfluencerReelApprovalNotification(reelData);
                    console.log('✅ WhatsApp reel approval notification result:', JSON.stringify(notificationResult, null, 2));
                    
                    if (!notificationResult.success) {
                        console.error('⚠️ Notification returned unsuccessful:', notificationResult.message || notificationResult.error);
                    }
                } catch (notifError) {
                    console.error('❌ EXCEPTION sending WhatsApp notification for reel approval:');
                    console.error('Error type:', notifError.constructor.name);
                    console.error('Error message:', notifError.message);
                    console.error('Error stack:', notifError.stack);
                    if (notifError.response) {
                        console.error('HTTP Status:', notifError.response.status);
                        console.error('Response Data:', JSON.stringify(notifError.response.data));
                    }
                    // Don't fail the request if notification fails
                }
                
                return res.status(200).json({
                    success: true,
                    message: 'Reel approved successfully'
                });
            });
        });
    } catch (error) {
        console.error('Approve influencer reel error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to approve influencer reel',
            error: error.message 
        });
    }
};

// Reject a specific influencer reel
// Added by Vaishnavi
const rejectInfluencerReel = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate id
        if (!id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Reel ID is required' 
            });
        }
        
        console.log('=== REJECT INFLUENCER REEL ENDPOINT CALLED ===');
        console.log('Reel ID:', id);
        
        // First, fetch reel and influencer data before updating
        const fetchQuery = `
            SELECT 
                ir.reel_id,
                ir.title,
                ir.influencer_id,
                oi.firstname,
                oi.lastname,
                oi.email,
                oi.telephone
            FROM oc_influencer_reels ir
            JOIN oc_influencers oi ON ir.influencer_id = oi.id
            WHERE ir.reel_id = ?
        `;
        
        db.query(fetchQuery, [id], async (fetchErr, fetchResults) => {
            if (fetchErr) {
                console.error('Error fetching influencer reel data:', fetchErr);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching reel information',
                    error: fetchErr.message 
                });
            }
            
            if (fetchResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Reel not found'
                });
            }
            
            const reelData = fetchResults[0];
            console.log('Fetched reel data for notification:', {
                reel_id: reelData.reel_id,
                title: reelData.title,
                influencer_id: reelData.influencer_id,
                name: `${reelData.firstname} ${reelData.lastname}`,
                phone: reelData.telephone,
                email: reelData.email
            });
            
            // Build query to update influencer reel status to rejected (2)
            const updateQuery = `UPDATE oc_influencer_reels SET status = 2 WHERE reel_id = ?`;
            
            db.query(updateQuery, [id], async (err, results) => {
                if (err) {
                    console.error('Error rejecting influencer reel:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error rejecting influencer reel',
                        error: err.message 
                    });
                }
                
                if (results.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Reel not found'
                    });
                }
                
                console.log('Reel rejected successfully. Sending WhatsApp notification...');
                console.log('Reel data being sent to notification:', JSON.stringify(reelData, null, 2));
                
                // Send WhatsApp notification
                try {
                    const { sendInfluencerReelRejectionNotification } = require('../../Services/Notifications/notificationService');
                    const notificationResult = await sendInfluencerReelRejectionNotification(reelData);
                    console.log('✅ WhatsApp reel rejection notification result:', JSON.stringify(notificationResult, null, 2));
                    
                    if (!notificationResult.success) {
                        console.error('⚠️ Notification returned unsuccessful:', notificationResult.message || notificationResult.error);
                    }
                } catch (notifError) {
                    console.error('❌ EXCEPTION sending WhatsApp notification for reel rejection:');
                    console.error('Error type:', notifError.constructor.name);
                    console.error('Error message:', notifError.message);
                    console.error('Error stack:', notifError.stack);
                    if (notifError.response) {
                        console.error('HTTP Status:', notifError.response.status);
                        console.error('Response Data:', JSON.stringify(notifError.response.data));
                    }
                    // Don't fail the request if notification fails
                }
                
                return res.status(200).json({
                    success: true,
                    message: 'Reel rejected successfully'
                });
            });
        });
    } catch (error) {
        console.error('Reject influencer reel error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to reject influencer reel',
            error: error.message 
        });
    }
};

// Get all pending seller reels for admin approval
const getAllPendingSellerReels = async (req, res) => {
    try {
        const query = `
            SELECT 
                sr.reel_id,
                sr.seller_id,
                sr.title,
                sr.description,
                sr.video_url,
                sr.thumbnail,
                sr.date_added,
                CONCAT(os.firstname, ' ', os.lastname) as seller_name,
                os.email as seller_email
            FROM oc_seller_reels sr
            JOIN oc_sellers os ON sr.seller_id = os.id
            WHERE sr.status = 0
            ORDER BY sr.date_added DESC
        `;
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching pending seller reels:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching pending seller reels',
                    error: err.message 
                });
            }
            
            return res.status(200).json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('Get all pending seller reels error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch pending seller reels',
            error: error.message 
        });
    }
};

const getAllApprovedSellerReels = async (req, res) => {
    try {
        // We need to join tables from two different databases
        // oc_seller_reels is in the main db (ipshopy_reels)
        // oc_sellers is in dbSagar (sagar database)
        const query = `
            SELECT 
                sr.reel_id,
                sr.seller_id,
                sr.title,
                sr.description,
                sr.video_url,
                sr.thumbnail,
                sr.date_added,
                CONCAT(s.firstname, ' ', s.lastname) as seller_name,
                s.email as seller_email
            FROM oc_seller_reels sr
            JOIN oc_sellers s ON sr.seller_id = s.vendor_id
            WHERE sr.status = 1
            ORDER BY sr.date_added DESC
        `;
        
        // Use dbSagar for this query since we're joining with oc_sellers
        dbSagar.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching approved seller reels:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching approved seller reels',
                    error: err.message 
                });
            }
            
            return res.status(200).json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('Get all approved seller reels error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch approved seller reels',
            error: error.message 
        });
    }
};

// Get all approved influencer reels for admin
const getAllApprovedInfluencerReels = async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const query = `
            SELECT 
                ir.reel_id,
                ir.influencer_id,
                ir.title,
                ir.description,
                ir.video_url,
                ir.thumbnail,
                ir.date_added,
                0 as views,
                0 as likes,
                0 as comments,
                CONCAT(oi.firstname, ' ', oi.lastname) as influencer_name,
                oi.email as influencer_email,
                oi.platform,
                oi.account_link
            FROM oc_influencer_reels ir
            JOIN oc_influencers oi ON ir.influencer_id = oi.id
            WHERE ir.status = 1
            ORDER BY ir.date_added DESC
        `;
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching approved influencer reels:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching approved influencer reels',
                    error: err.message 
                });
            }
            
            // Fetch product and brand names for each reel
            if (results.length === 0) {
                return res.status(200).json({
                    success: true,
                    data: []
                });
            }
            
            const reelIds = results.map(r => r.reel_id);
            const placeholders = reelIds.map(() => '?').join(',');
            
            // First, get product IDs for each reel
            const productIdsQuery = `
                SELECT 
                    irp.reel_id,
                    GROUP_CONCAT(DISTINCT irp.product_id) as product_ids
                FROM oc_influencer_reel_product irp
                WHERE irp.reel_id IN (${placeholders})
                GROUP BY irp.reel_id
            `;
            
            db.query(productIdsQuery, reelIds, (productIdsErr, productIdsResults) => {
                if (productIdsErr) {
                    console.error('Error fetching product IDs:', productIdsErr);
                    // Return results without product names if query fails
                    const processedResults = results.map(reel => {
                        // Construct full URLs for video and thumbnail
                        let fullVideoUrl = null;
                        let fullThumbnailUrl = null;
                        
                        if (reel.video_url) {
                            fullVideoUrl = reel.video_url.startsWith('http') ? appendSAS(reel.video_url) : `${baseUrl}${reel.video_url}`;
                        }
                        if (reel.thumbnail) {
                            fullThumbnailUrl = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                        }
                        
                        return {
                            ...reel,
                            product_names: [],
                            brand_names: [],
                            video_url: fullVideoUrl,
                            thumbnail: fullThumbnailUrl,
                            id: reel.reel_id,
                            created_at: reel.date_added
                        };
                    });
                    return res.status(200).json({
                        success: true,
                        data: processedResults
                    });
                }
                
                // Collect all unique product IDs
                const allProductIds = new Set();
                const reelProductMap = {}; // Map reel_id to array of product_ids
                
                if (productIdsResults && productIdsResults.length > 0) {
                    productIdsResults.forEach(row => {
                        if (row.product_ids) {
                            const productIds = row.product_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0);
                            reelProductMap[row.reel_id] = productIds;
                            productIds.forEach(id => allProductIds.add(id));
                        } else {
                            reelProductMap[row.reel_id] = [];
                        }
                    });
                }
                
                // If no product IDs found, return results without product names
                if (allProductIds.size === 0) {
                    const processedResults = results.map(reel => {
                        // Construct full URLs for video and thumbnail
                        let fullVideoUrl = null;
                        let fullThumbnailUrl = null;
                        
                        if (reel.video_url) {
                            fullVideoUrl = reel.video_url.startsWith('http') ? appendSAS(reel.video_url) : `${baseUrl}${reel.video_url}`;
                        }
                        if (reel.thumbnail) {
                            fullThumbnailUrl = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                }
                
                        return {
                            ...reel,
                            product_names: [],
                            brand_names: [],
                            video_url: fullVideoUrl,
                            thumbnail: fullThumbnailUrl,
                            id: reel.reel_id,
                            created_at: reel.date_added
                        };
                    });
                    return res.status(200).json({
                        success: true,
                        data: processedResults
                    });
                }
                
                // Fetch product names from oc_product table (sagar database)
                const productNamesQuery = `
                    SELECT 
                        p.product_id as id, 
                        pd.name,
                        p.manufacturer_id as brand_id
                    FROM oc_product p
                    JOIN oc_product_description pd ON p.product_id = pd.product_id AND pd.language_id = 1
                    WHERE p.product_id IN (${Array.from(allProductIds).map(() => '?').join(',')})
                `;
                
                dbSagar.query(productNamesQuery, Array.from(allProductIds), (productNamesErr, productNamesResults) => {
                    if (productNamesErr) {
                        console.error('Error fetching product names from oc_product:', productNamesErr);
                        // Return results without product names if query fails
                        const processedResults = results.map(reel => {
                            // Construct full URLs for video and thumbnail
                            let fullVideoUrl = null;
                            let fullThumbnailUrl = null;
                            
                            if (reel.video_url) {
                                fullVideoUrl = reel.video_url.startsWith('http') ? appendSAS(reel.video_url) : `${baseUrl}${reel.video_url}`;
                            }
                            if (reel.thumbnail) {
                                fullThumbnailUrl = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                            }
                            
                            return {
                                ...reel,
                                product_names: [],
                                brand_names: [],
                                video_url: fullVideoUrl,
                                thumbnail: fullThumbnailUrl,
                                id: reel.reel_id,
                                created_at: reel.date_added
                            };
                        });
                        return res.status(200).json({
                            success: true,
                            data: processedResults
                        });
                    }
                    
                    // Create maps for product names and brand IDs
                    const productNameMap = {};
                    const brandIdsSet = new Set();
                    
                    if (productNamesResults && productNamesResults.length > 0) {
                        productNamesResults.forEach(row => {
                            productNameMap[row.id] = row.name;
                            if (row.brand_id) {
                                brandIdsSet.add(row.brand_id);
                            }
                        });
                    }
                    
                    // Fetch brand names from oc_manufacturer if we have brand IDs
                    if (brandIdsSet.size > 0) {
                        const brandNamesQuery = `
                            SELECT 
                                manufacturer_id as id,
                                name
                            FROM oc_manufacturer
                            WHERE manufacturer_id IN (${Array.from(brandIdsSet).map(() => '?').join(',')})
                        `;
                        
                        dbSagar.query(brandNamesQuery, Array.from(brandIdsSet), (brandNamesErr, brandNamesResults) => {
                            if (brandNamesErr) {
                                console.error('Error fetching brand names:', brandNamesErr);
                            }
                            
                            // Create brand name map
                            const brandNameMap = {};
                            if (brandNamesResults && brandNamesResults.length > 0) {
                                brandNamesResults.forEach(row => {
                                    brandNameMap[row.id] = row.name;
                                });
                            }
                            
                            // Map products to brands for each reel
                            const reelBrandMap = {}; // Map reel_id to array of brand names
                            
                            // Process each reel to get product names and brand names
                            const processedResults = results.map(reel => {
                                const productIds = reelProductMap[reel.reel_id] || [];
                                const productNames = productIds
                                    .map(pid => productNameMap[pid])
                                    .filter(Boolean);
                                
                                // Get unique brand names for products in this reel
                                const brandIds = productIds
                                    .map(pid => {
                                        const product = productNamesResults.find(p => p.id === pid);
                                        return product ? product.brand_id : null;
                                    })
                                    .filter(Boolean);
                                
                                const brandNames = Array.from(new Set(
                                    brandIds
                                        .map(bid => brandNameMap[bid])
                                        .filter(Boolean)
                                ));
                                
                                // Construct full URLs for video and thumbnail
                                let fullVideoUrl = null;
                                let fullThumbnailUrl = null;
                                
                                if (reel.video_url) {
                                    fullVideoUrl = reel.video_url.startsWith('http') ? appendSAS(reel.video_url) : `${baseUrl}${reel.video_url}`;
                                }
                                if (reel.thumbnail) {
                                    fullThumbnailUrl = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                                }
                                
                                return {
                        ...reel,
                                    product_names: productNames,
                                    brand_names: brandNames,
                                    video_url: fullVideoUrl,
                                    thumbnail: fullThumbnailUrl,
                        id: reel.reel_id,
                        created_at: reel.date_added
                                };
                            });
                    
                    return res.status(200).json({
                        success: true,
                        data: processedResults
                    });
                });
                    } else {
                        // No brand IDs, just return product names
                        const processedResults = results.map(reel => {
                            const productIds = reelProductMap[reel.reel_id] || [];
                            const productNames = productIds
                                .map(pid => productNameMap[pid])
                                .filter(Boolean);
                            
                            // Construct full URLs for video and thumbnail
                            let fullVideoUrl = null;
                            let fullThumbnailUrl = null;
                            
                            if (reel.video_url) {
                                fullVideoUrl = reel.video_url.startsWith('http') ? appendSAS(reel.video_url) : `${baseUrl}${reel.video_url}`;
                            }
                            if (reel.thumbnail) {
                                fullThumbnailUrl = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                            }
                            
                            return {
                                ...reel,
                                product_names: productNames,
                                brand_names: [],
                                video_url: fullVideoUrl,
                                thumbnail: fullThumbnailUrl,
                                id: reel.reel_id,
                                created_at: reel.date_added
                            };
                        });
                        
                        return res.status(200).json({
                            success: true,
                            data: processedResults
                        });
                    }
                });
            });
        });
    } catch (error) {
        console.error('Get all approved influencer reels error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch approved influencer reels',
            error: error.message 
        });
    }
};

// Get approved influencers with reel counts (for admin list page)
const getApprovedInfluencersWithReelCounts = async (req, res) => {
    try {
        // Use subqueries to get both approved reel counts and total reel counts
        const query = `
            SELECT 
                oi.id as influencer_id,
                CONCAT(oi.firstname, ' ', oi.lastname) as influencer_name,
                oi.firstname,
                oi.lastname,
                oi.email,
                oi.platform,
                oi.account_link,
                oi.status,
                COALESCE(approved_counts.reel_count, 0) as approved_reel_count,
                COALESCE(total_counts.reel_count, 0) as total_reel_count,
                0 as total_views,
                0 as total_likes,
                0 as total_comments
            FROM oc_influencers oi
            LEFT JOIN (
                SELECT 
                    influencer_id,
                    COUNT(*) as reel_count
                FROM oc_influencer_reels
                GROUP BY influencer_id
            ) as total_counts ON oi.id = total_counts.influencer_id
            LEFT JOIN (
                SELECT 
                    influencer_id,
                    COUNT(*) as reel_count
                FROM oc_influencer_reels
                WHERE status = 1
                GROUP BY influencer_id
            ) as approved_counts ON oi.id = approved_counts.influencer_id
            WHERE oi.status = 1
            ORDER BY approved_reel_count DESC, oi.firstname ASC
        `;
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching approved influencers with reel counts:', err);
                console.error('SQL Query:', query);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching approved influencers with reel counts',
                    error: err.message 
                });
            }
            
            return res.status(200).json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('Get approved influencers with reel counts error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch approved influencers with reel counts',
            error: error.message 
        });
    }
};

// Upload a new brand reel
const uploadBrandReel = async (req, res) => {
    try {
        // Log the received data for debugging
        console.log('=== NEW BRAND REEL UPLOAD REQUEST ===');
        console.log('Request headers:', req.headers);
        console.log('Request content-type:', req.headers['content-type']);
        console.log('Received upload request data:', {
            body: req.body,
            files: req.files
        });

        // Log the structure of req.files if it exists
        if (req.files) {
            console.log('Files structure:', Object.keys(req.files));
            if (req.files.video) {
                console.log('Video file info:', req.files.video);
            }
            if (req.files.thumbnail) {
                console.log('Thumbnail file info:', req.files.thumbnail);
            }
        }

        // Log what we received
        console.log('Request body type:', typeof req.body);
        console.log('Request body:', req.body);
        console.log('Request body keys:', req.body ? Object.keys(req.body) : 'No body');
        console.log('Request files:', req.files);
        console.log('Request files keys:', req.files ? Object.keys(req.files) : 'No files');
        
        // Check if any form data was received at all
        if (!req.body || Object.keys(req.body).length === 0) {
            console.log('ERROR: No form data received in request body');
            console.log('Request content-type:', req.headers['content-type']);
            return res.status(400).json({
                success: false,
                message: 'No form data received. Please ensure all required fields are filled.'
            });
        }

        // Extract text fields from req.body (handling both naming conventions)
        const title = req.body.title;
        const description = req.body.description || '';
        const category = req.body.category || req.body.category_id;
        const brandId = req.body.brandId || req.body.brand_id;
        const productId = req.body.productId || req.body.product_id;
        const otherCategoryName = req.body.otherCategoryName || req.body.new_category_name || '';
        
        // Extract multiple product IDs (may be sent as JSON string, array, or indexed array)
        let selectedProducts = [];
        if (req.body.productIds) {
            try {
                const parsed = typeof req.body.productIds === 'string' ? JSON.parse(req.body.productIds) : req.body.productIds;
                selectedProducts = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                // If parsing fails, try as comma-separated string
                selectedProducts = String(req.body.productIds).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            }
        } else if (req.body.product_ids) {
            // Handle array format product_ids[0], product_ids[1], etc.
            if (Array.isArray(req.body.product_ids)) {
                selectedProducts = req.body.product_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
            } else {
                selectedProducts = [parseInt(req.body.product_ids)].filter(id => !isNaN(id));
            }
        } else if (productId) {
            // Fallback to single product_id
            selectedProducts = [parseInt(productId)].filter(id => !isNaN(id));
        }

        // Log parsed data
        console.log('Parsed data:', {
            title,
            description,
            category,
            brandId,
            productId
        });
        
        // Log all body parameters for debugging
        console.log('All body parameters:', req.body);

        // Validation with detailed logging
        console.log('Starting validation checks...');

        if (!title || (typeof title === 'string' && title.trim() === '')) {
            console.log('Title validation failed - title is:', title);
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        // Allow 'other' as a valid category value
        if (!category || (category !== 'other' && (category === '' || category === 'undefined'))) {
            console.log('Category validation failed - category is:', category);
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }

        if (!brandId || brandId === '' || brandId === 'undefined') {
            console.log('Brand validation failed - brandId is:', brandId);
            return res.status(400).json({
                success: false,
                message: 'Brand is required'
            });
        }

        // Check if video file is provided (multer stores as array with upload.fields())
        const hasVideoFile = req.files && 
                            req.files.video && 
                            Array.isArray(req.files.video) && 
                            req.files.video.length > 0 && 
                            req.files.video[0];
        
        if (!hasVideoFile) {
            console.log('Video file validation failed:', {
                hasFiles: !!req.files,
                hasVideo: !!(req.files && req.files.video),
                videoType: req.files && req.files.video ? typeof req.files.video : 'N/A',
                isArray: req.files && req.files.video ? Array.isArray(req.files.video) : false,
                length: req.files && req.files.video && Array.isArray(req.files.video) ? req.files.video.length : 0
            });
            return res.status(400).json({
                success: false,
                message: 'Video file is required'
            });
        }
        
        // Enforce max 30s duration (client-provided metadata)
        const videoDurationClientBrand = req.body.videoDuration ? parseFloat(String(req.body.videoDuration)) : NaN;
        if (!Number.isNaN(videoDurationClientBrand) && videoDurationClientBrand > 30.0) {
            return res.status(400).json({
                success: false,
                message: 'Video must be 30 seconds or less'
            });
        }

        // Validate that the brand exists in the sagar database
        const dbSagar = require('../../Config/db_sagar');
        const brandCheckQuery = 'SELECT manufacturer_id FROM oc_manufacturer WHERE manufacturer_id = ?';
        
        dbSagar.query(brandCheckQuery, [brandId], async (err, brandResults) => {
            try {
                if (err) {
                    console.error('Database error checking brand:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Error validating brand',
                        error: err.message
                    });
                }
                
                if (brandResults.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid brand selected'
                    });
                }
                
                // Handle file uploads
                // Save actual file paths to database
                const videoFile = req.files.video ? req.files.video[0] : null;
                let videoUrl = null;
                if (videoFile) {
                    try {
                        videoUrl = await uploadToAzure(
                            videoFile.path,
                            videoFile.originalname || videoFile.filename,
                            videoFile.mimetype || 'application/octet-stream'
                        );
                    } catch (e) {
                        console.error('Azure upload failed:', e && e.message ? e.message : e);
                        try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
                        return res.status(502).json({ 
                            success: false, 
                            message: 'Azure upload failed',
                            error: e && e.message ? e.message : 'Unknown error'
                        });
                    }
                    if (videoUrl) {
                        // IMPORTANT: Save video URL WITHOUT SAS token to database
                        // SAS tokens expire, so we append them dynamically when retrieving
                        videoUrl = stripSASToken(videoUrl);
                        console.log('[uploadBrandReel] Saving video URL to database (without SAS token):', videoUrl.substring(0, 100));
                        try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
                    } else {
                        try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
                        return res.status(502).json({ success: false, message: 'Azure upload failed' });
                    }
                }

            const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;
            const thumbnailUrl = thumbnailFile ? `/uploads/${thumbnailFile.filename}` : null;

            // Log file information
            if (videoFile) {
                console.log('Video file details:', {
                    originalname: videoFile.originalname,
                    mimetype: videoFile.mimetype,
                    size: videoFile.size,
                    filename: videoFile.filename
                });
            }

            if (thumbnailFile) {
                console.log('Thumbnail file details:', {
                    originalname: thumbnailFile.originalname,
                    mimetype: thumbnailFile.mimetype,
                    size: thumbnailFile.size,
                    filename: thumbnailFile.filename
                });
            }

            // Validate videoUrl is not null before proceeding
            if (!videoUrl) {
                console.error('Video URL is null or empty after Azure upload');
                return res.status(500).json({
                    success: false,
                    message: 'Video upload failed. Please try again.',
                    error: 'Video URL is missing'
                });
            }

            // Handle category - if 'other', create new category first
            const handleCategoryAndInsert = (finalCategoryId) => {
                // Function to attempt insert (will retry after fixing constraint if needed)
                const attemptInsert = () => {
                    const brandReelQuery = `
                        INSERT INTO oc_brand_reels
                        (brand_id, category_id, product_id, title, description, video_url, thumbnail_url, views, likes, comments, status, created_at) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 1, NOW())
                    `;

                    const descriptionToSave = description || null;

                    // Use first product ID for backward compatibility with product_id column
                    const firstProductId = selectedProducts.length > 0 ? selectedProducts[0] : null;

                    // Ensure all values are properly formatted
                    const brandReelValues = [
                        parseInt(brandId, 10),  // Ensure brandId is integer
                        parseInt(finalCategoryId, 10),  // Ensure categoryId is integer
                        firstProductId ? parseInt(firstProductId, 10) : null,  // First product ID for backward compatibility
                        String(title || '').trim(),  // Ensure title is string
                        descriptionToSave ? String(descriptionToSave).trim() : null,  // Ensure description is string or null
                        String(videoUrl || ''),  // Ensure videoUrl is string
                        thumbnailUrl ? String(thumbnailUrl) : null  // Ensure thumbnailUrl is string or null
                    ];

                    console.log('Inserting brand reel with values:', brandReelValues);
                    console.log('Selected products:', selectedProducts);
                    console.log('Value types:', brandReelValues.map(v => typeof v));

                    db.query(brandReelQuery, brandReelValues, (err, result) => {
                        if (err) {
                            console.error('=== DATABASE ERROR INSERTING BRAND REEL ===');
                        console.error('Error code:', err.code);
                        console.error('Error SQL state:', err.sqlState);
                        console.error('Error message:', err.message);
                        console.error('Error SQL:', err.sql);
                        console.error('SQL Query:', brandReelQuery);
                        console.error('Values:', brandReelValues);
                        console.error('Value types:', brandReelValues.map(v => typeof v));
                        console.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)));
                        
                        // Check for foreign key constraint error
                        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                            return res.status(400).json({
                                success: false,
                                message: 'Invalid brand or category ID. Please select valid options.',
                                error: err.message
                            });
                        }
                        
                        // Check for table doesn't exist error
                        if (err.code === 'ER_NO_SUCH_TABLE' || (err.message && err.message.includes("doesn't exist"))) {
                            // Check if it's a foreign key constraint issue with 'brands' table
                            if (err.message.includes('brands') && err.message.includes("doesn't exist")) {
                                console.log('⚠️ Detected foreign key constraint issue with brands table. Attempting to fix...');
                                
                                // Try to find and drop the constraint automatically
                                const findConstraintQuery = `
                                    SELECT CONSTRAINT_NAME 
                                    FROM information_schema.KEY_COLUMN_USAGE 
                                    WHERE TABLE_SCHEMA = 'ipshopy_reels' 
                                    AND TABLE_NAME = 'oc_brand_reels' 
                                    AND REFERENCED_TABLE_NAME = 'brands'
                                    LIMIT 1
                                `;
                                
                                db.query(findConstraintQuery, (constraintErr, constraintResults) => {
                                    if (constraintErr || !constraintResults || constraintResults.length === 0) {
                                        console.error('Could not find constraint to drop:', constraintErr);
                                        return res.status(500).json({
                                            success: false,
                                            message: `Foreign key constraint error: The 'oc_brand_reels' table has a foreign key constraint referencing a 'brands' table that doesn't exist. Please run: ALTER TABLE oc_brand_reels DROP FOREIGN KEY constraint_name; (Find constraint name with: SHOW CREATE TABLE oc_brand_reels;)`,
                                            error: err.message,
                                            errorCode: err.code
                                        });
                                    }
                                    
                                    const constraintName = constraintResults[0].CONSTRAINT_NAME;
                                    console.log(`Found constraint: ${constraintName}, attempting to drop...`);
                                    
                                    const dropConstraintQuery = `ALTER TABLE \`oc_brand_reels\` DROP FOREIGN KEY \`${constraintName}\``;
                                    db.query(dropConstraintQuery, (dropErr) => {
                                        if (dropErr) {
                                            console.error('Error dropping constraint:', dropErr);
                                            return res.status(500).json({
                                                success: false,
                                                message: `Could not automatically fix foreign key constraint. Please run manually: ${dropConstraintQuery}`,
                                                error: dropErr.message
                                            });
                                        }
                                        
                                        console.log('✅ Successfully dropped foreign key constraint. Retrying insert...');
                                        // Retry the insert after dropping the constraint
                                        attemptInsert();
                                    });
                                });
                                return; // Exit early, will retry after dropping constraint
                            }
                            
                            return res.status(500).json({
                                success: false,
                                message: `Database table error: ${err.message}. Please verify the table 'oc_brand_reels' exists in the 'ipshopy_reels' database.`,
                                error: err.message,
                                errorCode: err.code,
                                sqlState: err.sqlState
                            });
                        }
                        
                        // Return detailed error for debugging
                        return res.status(500).json({
                            success: false,
                            message: 'Error saving brand reel to database',
                            error: err.message,
                            errorCode: err.code,
                            sqlState: err.sqlState,
                            sql: err.sql
                        });
                        }

                        const reelId = result.insertId;
                        console.log('✅ Brand reel inserted successfully, ID:', reelId);

                        // Insert multiple products into junction table if products are selected
                        if (selectedProducts && selectedProducts.length > 0) {
                            // First, ensure the junction table exists
                            const createJunctionTableQuery = `
                                CREATE TABLE IF NOT EXISTS oc_brand_reel_product (
                                    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                    reel_id BIGINT UNSIGNED NOT NULL,
                                    product_id BIGINT UNSIGNED NOT NULL,
                                    PRIMARY KEY (id),
                                    KEY idx_reel_id (reel_id),
                                    KEY idx_product_id (product_id),
                                    UNIQUE KEY unique_reel_product (reel_id, product_id)
                                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                            `;
                            
                            db.query(createJunctionTableQuery, (tableErr) => {
                                if (tableErr) {
                                    console.error('Error creating junction table:', tableErr);
                                    // Continue anyway, try to insert
                                }
                                
                                // Insert products into junction table
                                const productQuery = `
                                    INSERT INTO oc_brand_reel_product (reel_id, product_id) 
                                    VALUES ?
                                `;
                                const productValues = selectedProducts.map(pid => [reelId, parseInt(pid)]);
                                
                                db.query(productQuery, [productValues], (productErr) => {
                                    if (productErr) {
                                        console.error('Error inserting products into junction table:', productErr);
                                        // Still return success since main reel was inserted
                                    }
                                    console.log('✅ Products inserted into junction table');
                                    
                                    return res.status(201).json({
                                        success: true,
                                        message: 'Brand reel uploaded successfully',
                                        data: { reelId, productCount: selectedProducts.length }
                                    });
                                });
                            });
                        } else {
                        return res.status(201).json({
                            success: true,
                            message: 'Brand reel uploaded successfully',
                            data: { reelId }
                        });
                        }
                    });
                };
                
                // First verify table exists
                const checkTableQuery = `SHOW TABLES LIKE 'oc_brand_reels'`;
                db.query(checkTableQuery, (tableErr, tableResults) => {
                    if (tableErr) {
                        console.error('Error checking table existence:', tableErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Error checking database table',
                            error: tableErr.message
                        });
                    }
                    
                    if (tableResults.length === 0) {
                        console.error('Table oc_brand_reels does not exist in database');
                        return res.status(500).json({
                            success: false,
                            message: 'Table oc_brand_reels not found in ipshopy_reels database. Please create the table first.',
                            error: 'Table does not exist'
                        });
                    }
                    
                    console.log('✅ Table oc_brand_reels exists, proceeding with insert');
                    attemptInsert();
                });
            };

                // If category is 'other', create new category first
                if (String(category) === 'other' && otherCategoryName) {
                    const suggestQuery = `
                        INSERT INTO oc_reel_category (name, description, sort_order, status, date_added)
                        VALUES (?, NULL, 0, 0, NOW())
                    `;
                    db.query(suggestQuery, [otherCategoryName], (catErr, catResult) => {
                        if (catErr) {
                            console.error('Database error creating other category:', catErr);
                            return res.status(500).json({
                                success: false,
                                message: 'Error creating category',
                                error: catErr.message
                            });
                        }
                        const newCatId = catResult.insertId;
                        handleCategoryAndInsert(newCatId);
                    });
                } else {
                    // Use the provided category ID
                    const catId = parseInt(category, 10);
                    if (isNaN(catId)) {
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid category ID'
                        });
                    }
                    handleCategoryAndInsert(catId);
                }
            } catch (innerError) {
                console.error('Error in brand reel upload callback:', innerError);
                return res.status(500).json({
                    success: false,
                    message: 'Error uploading brand reel',
                    error: innerError.message
                });
            }
        });
    } catch (error) {
        console.error('Error uploading brand reel (handler catch):', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            success: false,
            message: 'Error uploading brand reel',
            error: error.message
        });
    }
};

// Update an existing brand reel
const updateBrandReel = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validate reel ID
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Reel ID is required'
            });
        }

        // Extract text fields from req.body
        const title = req.body.title;
        const description = req.body.description || '';
        const category = req.body.category || req.body.category_id;
        const brandId = req.body.brandId || req.body.brand_id;
        const otherCategoryName = req.body.otherCategoryName || req.body.new_category_name || '';
        
        // Extract multiple product IDs (same logic as uploadBrandReel)
        let selectedProducts = [];
        if (req.body.productIds) {
            try {
                const parsed = typeof req.body.productIds === 'string' ? JSON.parse(req.body.productIds) : req.body.productIds;
                selectedProducts = Array.isArray(parsed) ? parsed : [parsed];
            } catch (e) {
                selectedProducts = String(req.body.productIds).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
            }
        } else if (req.body.product_ids) {
            if (Array.isArray(req.body.product_ids)) {
                selectedProducts = req.body.product_ids.map(id => parseInt(id)).filter(id => !isNaN(id));
            } else {
                selectedProducts = [parseInt(req.body.product_ids)].filter(id => !isNaN(id));
            }
        } else if (req.body.productId || req.body.product_id) {
            selectedProducts = [parseInt(req.body.productId || req.body.product_id)].filter(id => !isNaN(id));
        }

        // Validation
        if (!title || (typeof title === 'string' && title.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        if (!category || (category !== 'other' && (category === '' || category === 'undefined'))) {
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }

        if (!brandId || brandId === '' || brandId === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'Brand is required'
            });
        }

        if (!selectedProducts || selectedProducts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one product'
            });
        }

        // Handle file uploads as optional - only process if they exist
        const videoFile = req.files && req.files.video ? req.files.video[0] : null;
        const thumbnailFile = req.files && req.files.thumbnail ? req.files.thumbnail[0] : null;
        
        // Enforce max 30s duration if a new video is being uploaded (client-provided metadata)
        if (videoFile) {
            const videoDurationClientUpdate = req.body.videoDuration ? parseFloat(String(req.body.videoDuration)) : NaN;
            if (!Number.isNaN(videoDurationClientUpdate) && videoDurationClientUpdate > 30.0) {
                return res.status(400).json({
                    success: false,
                    message: 'Video must be 30 seconds or less'
                });
            }
        }
        
        let videoUrl = null;
        
        // Process video file only if it exists
        if (videoFile) {
            try {
                videoUrl = await uploadToAzure(
                    videoFile.path,
                    videoFile.originalname || videoFile.filename,
                    videoFile.mimetype || 'application/octet-stream'
                );
                if (videoUrl) {
                    // IMPORTANT: Save video URL WITHOUT SAS token to database
                    // SAS tokens expire, so we append them dynamically when retrieving
                    videoUrl = stripSASToken(videoUrl);
                    console.log('[updateBrandReel] Saving video URL to database (without SAS token):', videoUrl.substring(0, 100));
                    try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
                } else {
                    try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
                    return res.status(502).json({ success: false, message: 'Azure upload failed' });
                }
            } catch (e) {
                console.error('Azure upload failed:', e && e.message ? e.message : e);
                try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
                return res.status(502).json({ success: false, message: 'Azure upload failed' });
            }
        }

        // Process thumbnail file only if it exists
        const thumbnailUrl = thumbnailFile ? `/uploads/${thumbnailFile.filename}` : null;

        // Validate brand exists
        const dbSagar = require('../../Config/db_sagar');
        const brandCheckQuery = 'SELECT manufacturer_id FROM oc_manufacturer WHERE manufacturer_id = ?';
        
        dbSagar.query(brandCheckQuery, [brandId], async (err, brandResults) => {
            if (err) {
                console.error('Database error checking brand:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error validating brand',
                    error: err.message
                });
            }
            
            if (brandResults.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid brand selected'
                });
            }

            // Handle category - if 'other', create new category first
            const handleCategoryAndUpdate = (finalCategoryId) => {
                db.getConnection((err, connection) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Database connection error'
                        });
                    }

                    connection.beginTransaction(err => {
                        if (err) {
                            connection.release();
                            return res.status(500).json({
                                success: false,
                                message: 'Transaction error'
                            });
                        }

                        // Update brand reel
                        const updateFields = [];
                        const updateValues = [];

                        updateFields.push('brand_id = ?');
                        // Convert brand ID to integer for safer handling
                        const brandIdInt = brandId ? parseInt(brandId, 10) : null;
                        updateValues.push(!isNaN(brandIdInt) ? brandIdInt : null);

                        updateFields.push('category_id = ?');
                        // Convert category ID to integer for safer handling
                        const categoryIdInt = finalCategoryId ? parseInt(finalCategoryId, 10) : null;
                        updateValues.push(!isNaN(categoryIdInt) ? categoryIdInt : null);

                        updateFields.push('product_id = ?');
                        // Convert first product ID to integer for safer handling
                        const firstProductId = selectedProducts.length > 0 ? parseInt(selectedProducts[0], 10) : null;
                        updateValues.push(!isNaN(firstProductId) ? firstProductId : null); // First product for backward compatibility

                        updateFields.push('title = ?');
                        updateValues.push(String(title || '').trim());

                        const descriptionToSave = description || null;
                        updateFields.push('description = ?');
                        updateValues.push(descriptionToSave ? String(descriptionToSave).trim() : null);

                        if (videoUrl) {
                            updateFields.push('video_url = ?');
                            updateValues.push(String(videoUrl));
                        }

                        if (thumbnailUrl) {
                            updateFields.push('thumbnail_url = ?');
                            updateValues.push(String(thumbnailUrl));
                        }

                        updateFields.push('updated_at = NOW()');
                        
                        const updateQuery = `UPDATE oc_brand_reels SET ${updateFields.join(', ')} WHERE id = ?`;
                        updateValues.push(id);

                        connection.query(updateQuery, updateValues, (err, result) => {
                            if (err) {
                                return connection.rollback(() => {
                                    connection.release();
                                    console.error('Error updating brand reel:', err);
                                    return res.status(500).json({
                                        success: false,
                                        message: 'Error updating brand reel',
                                        error: err.message
                                    });
                                });
                            }

                            if (result.affectedRows === 0) {
                                return connection.rollback(() => {
                                    connection.release();
                                    return res.status(404).json({
                                        success: false,
                                        message: 'Brand reel not found'
                                    });
                                });
                            }

                            // Update products in junction table
                            const deleteProductsQuery = `DELETE FROM oc_brand_reel_product WHERE reel_id = ?`;
                            connection.query(deleteProductsQuery, [id], (delErr) => {
                                if (delErr) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        console.error('Error deleting products:', delErr);
                                        return res.status(500).json({
                                            success: false,
                                            message: 'Error updating products',
                                            error: delErr.message
                                        });
                                    });
                                }

                                if (selectedProducts.length > 0) {
                                    // Ensure junction table exists
                                    const createJunctionTableQuery = `
                                        CREATE TABLE IF NOT EXISTS oc_brand_reel_product (
                                            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                                            reel_id BIGINT UNSIGNED NOT NULL,
                                            product_id BIGINT UNSIGNED NOT NULL,
                                            PRIMARY KEY (id),
                                            KEY idx_reel_id (reel_id),
                                            KEY idx_product_id (product_id),
                                            UNIQUE KEY unique_reel_product (reel_id, product_id)
                                        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
                                    `;
                                    
                                    connection.query(createJunctionTableQuery, (tableErr) => {
                                        if (tableErr) {
                                            console.error('Error creating junction table:', tableErr);
                                        }

                                        const insertProductsQuery = `
                                            INSERT INTO oc_brand_reel_product (reel_id, product_id) 
                                            VALUES ?
                                        `;
                                        // Convert all product IDs to integers for safer handling
                                        const productValues = selectedProducts.map(pid => {
                                            const productIdInt = parseInt(pid, 10);
                                            return [id, !isNaN(productIdInt) ? productIdInt : null];
                                        }).filter(([_, pid]) => pid !== null);
                                        
                                        connection.query(insertProductsQuery, [productValues], (insErr) => {
                                            if (insErr) {
                                                return connection.rollback(() => {
                                                    connection.release();
                                                    console.error('Error inserting products:', insErr);
                                                    return res.status(500).json({
                                                        success: false,
                                                        message: 'Error updating products',
                                                        error: insErr.message
                                                    });
                                                });
                                            }

                                            connection.commit((commitErr) => {
                                                connection.release();
                                                if (commitErr) {
                                                    return res.status(500).json({
                                                        success: false,
                                                        message: 'Error committing transaction',
                                                        error: commitErr.message
                                                    });
                                                }

                                                return res.status(200).json({
                                                    success: true,
                                                    message: 'Brand reel updated successfully',
                                                    data: { reelId: id, productCount: selectedProducts.length }
                                                });
                                            });
                                        });
                                    });
                                } else {
                                    connection.commit((commitErr) => {
                                        connection.release();
                                        if (commitErr) {
                                            return res.status(500).json({
                                                success: false,
                                                message: 'Error committing transaction',
                                                error: commitErr.message
                                            });
                                        }

                                        return res.status(200).json({
                                            success: true,
                                            message: 'Brand reel updated successfully'
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            };

            // Handle category
            if (String(category) === 'other' && otherCategoryName) {
                const suggestQuery = `
                    INSERT INTO oc_reel_category (name, description, sort_order, status, date_added)
                    VALUES (?, NULL, 0, 0, NOW())
                `;
                db.query(suggestQuery, [otherCategoryName], (catErr, catResult) => {
                    if (catErr) {
                        console.error('Database error creating other category:', catErr);
                        return res.status(500).json({
                            success: false,
                            message: 'Error creating category',
                            error: catErr.message
                        });
                    }
                    const newCatId = catResult.insertId;
                    handleCategoryAndUpdate(newCatId);
                });
            } else {
                // Convert category to integer for safer handling
                const catId = parseInt(category, 10);
                if (isNaN(catId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid category ID'
                    });
                }
                handleCategoryAndUpdate(catId);
            }
        });
    } catch (error) {
        console.error('Update brand reel error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update brand reel',
            error: error.message
        });
    }
};

module.exports = {
    getApprovedInfluencersWithReelCounts,
    getSellers,
    getSellerProducts,
    getBrands,
    getBrandProducts,
    getCategories,
    getRelatedProducts,
    getProductNamesByIds, // Add this new function
    getAllProducts, // Add this new function
    incrementReelView,
    toggleReelLike,
    toggleCreatorFollow,
    uploadInfluencerReel,    uploadSellerReel,
    getInfluencerReels,
    getInfluencerReelsAdmin, // Add the new admin function
    getInfluencerReelsById, // Add the new function for getting reels by influencer ID
    getSellerReels,
    editReel,
    deleteReel,
    getReelById,
    getSellerDashboardStats,
    getRecentSellerReels,
    getApprovedReelsCount,
    getRecentApprovedReels,
    approveSellerReel,
    rejectSellerReel,
    approveInfluencerReel, // Add the new function for approving influencer reels
    rejectInfluencerReel,  // Add the new function for rejecting influencer reels
    getAllPendingSellerReels,
    getAllApprovedSellerReels,
    getApprovedInfluencersWithReelCounts,
    getAllApprovedInfluencerReels,
    getBrandReels,
    uploadBrandReel,
    updateBrandReel,
    deleteBrandReel,
    editReelAzure // Export the Azure edit function
};
