const db = require('../../Config/db')
const dbSagar = require('../../Config/db_sagar')
const fs = require('fs')
const http = require('http')
const https = require('https')

const AZURE_UPLOAD_URL = process.env.AZURE_UPLOAD_URL || 'https://reels-func.azurewebsites.net/api/UploadReel?code=LsbfgoydZjIq23O2qFHcS5xCEab3_incYmQAGSk_c2JnAzFun_DN_Q=='

<<<<<<< HEAD
const appendSAS = (url) => {
    try {
        const sas = process.env.AZURE_BLOB_SAS_QUERY;
        if (!sas || !url) return url;
        const cleanSas = String(sas).replace(/^\?/, '');
        if (url.includes('?')) return `${url}&${cleanSas}`;
        return `${url}?${cleanSas}`;
    } catch (_) {
        return url;
    }
}

const uploadToAzure = (filePath, filename, mimetype = 'application/octet-stream') => {
    return new Promise((resolve, reject) => {
        try {
            const urlObj = new URL(AZURE_UPLOAD_URL)
            const boundary = '----NodeBoundary' + Math.random().toString(16).slice(2)
            const headers = {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'x-filename': filename || 'upload.mp4'
            }
            const functionKey = process.env.AZURE_FUNCTION_KEY
            if (functionKey) headers['x-functions-key'] = functionKey
            if (filename && !urlObj.searchParams.has('filename')) {
                urlObj.searchParams.append('filename', filename)
            }
=======
const uploadToAzure = (filePath, filename) => {
    return new Promise((resolve, reject) => {
        try {
            const urlObj = new URL(AZURE_UPLOAD_URL)
            const headers = { 'x-filename': filename || 'upload.bin' }
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            const options = {
                method: 'POST',
                hostname: urlObj.hostname,
                path: urlObj.pathname + urlObj.search,
                headers,
            }
            const client = urlObj.protocol === 'https:' ? https : http
            const req = client.request(options, (res) => {
                const chunks = []
                res.on('data', (d) => chunks.push(d))
                res.on('end', () => {
                    const body = Buffer.concat(chunks).toString('utf8')
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        let data = body
                        try { data = JSON.parse(body) } catch (_) {}
                        const url = typeof data === 'string' ? data : (data && (data.url || data.videoUrl || data.video_url || data.location || data.blobUrl))
                        resolve(url || body)
                    } else {
                        reject(new Error(body || String(res.statusCode)))
                    }
                })
            })
            req.on('error', (err) => reject(err))
<<<<<<< HEAD

            const CRLF = '\r\n'
            const partFileHeader = Buffer.from(
                `--${boundary}${CRLF}` +
                `Content-Disposition: form-data; name="file"; filename="${filename || 'upload.mp4'}"${CRLF}` +
                `Content-Type: ${mimetype}${CRLF}${CRLF}`
            )
            const epilogue = Buffer.from(`${CRLF}--${boundary}--${CRLF}`)

            const stream = fs.createReadStream(filePath)
            req.write(partFileHeader)
            stream.on('end', () => {
                req.write(epilogue)
                req.end()
            })
            stream.pipe(req, { end: false })
=======
            fs.createReadStream(filePath).pipe(req)
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
        } catch (err) {
            reject(err)
        }
    })
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
            SELECT manufacturer_id as id, name
            FROM oc_manufacturer
            ORDER BY name
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
};

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
const getCategories = async (req, res) => {    try {
        const query = `
            SELECT reel_category_id as id, name
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
        const query = `
            SELECT p.product_id as id, pd.name
            FROM oc_product p
            JOIN oc_product_description pd ON p.product_id = pd.product_id
            WHERE p.product_id IN (${placeholders}) AND pd.language_id = 1
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
            
            // Convert results to a map for easy lookup
            const productNamesMap = {};
            results.forEach(product => {
                productNamesMap[product.id] = product.name;
            });
            
            return res.status(200).json({
                success: true,
                data: productNamesMap
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
<<<<<<< HEAD
                SELECT reel_id FROM oc_influencer_reels WHERE reel_id = ?
                UNION ALL
                SELECT reel_id FROM oc_seller_reels WHERE reel_id = ?
=======
                SELECT reel_id FROM influencer_reels WHERE reel_id = ?
                UNION ALL
                SELECT reel_id FROM seller_reels WHERE reel_id = ?
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
            
<<<<<<< HEAD
            // Try to increment view count in oc_influencer_reels first
            const incrementInfluencerQuery = `
                UPDATE oc_influencer_reels
=======
            // Try to increment view count in influencer_reels first
            const incrementInfluencerQuery = `
                UPDATE influencer_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
                
<<<<<<< HEAD
                // If no rows were affected, try oc_seller_reels
                if (incResult.affectedRows === 0) {
                    const incrementSellerQuery = `
                        UPDATE oc_seller_reels
=======
                // If no rows were affected, try seller_reels
                if (incResult.affectedRows === 0) {
                    const incrementSellerQuery = `
                        UPDATE seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
                        UPDATE oc_influencer_reels
=======
                        UPDATE influencer_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
                        SET likes = likes - 1 
                        WHERE reel_id = ?
                    `;
                    
                    db.query(decrementLikesQuery, [id], (decErr, decResult) => {
                        if (decErr) {
                            console.error('Error decrementing influencer reel likes:', decErr);
                            // Try seller reels
                            const decrementSellerLikesQuery = `
<<<<<<< HEAD
                                UPDATE oc_seller_reels
=======
                                UPDATE seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
                        UPDATE oc_influencer_reels
=======
                        UPDATE influencer_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
                        SET likes = likes + 1 
                        WHERE reel_id = ?
                    `;
                    
                    db.query(incrementLikesQuery, [id], (incErr, incResult) => {
                        if (incErr) {
                            console.error('Error incrementing influencer reel likes:', incErr);
                            // Try seller reels
                            const incrementSellerLikesQuery = `
<<<<<<< HEAD
                                UPDATE oc_seller_reels
=======
                                UPDATE seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
            SELECT influencer_id as creator_id FROM oc_influencer_reels WHERE reel_id = ?
            UNION
            SELECT seller_id as creator_id FROM oc_seller_reels WHERE reel_id = ?
=======
            SELECT influencer_id as creator_id FROM influencer_reels WHERE reel_id = ?
            UNION
            SELECT seller_id as creator_id FROM seller_reels WHERE reel_id = ?
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
    if (!req.files || !req.files.video) {
        console.log('Video file validation failed - files:', req.files)

        return res.status(400).json({ 
            success: false, 
            message: 'Video file is required' 
        })
    }
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
    const videoFile = req.files.video ? req.files.video[0] : null;
    let videoUrl = null;
    if (videoFile) {
        try {
<<<<<<< HEAD
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
=======
            videoUrl = await uploadToAzure(videoFile.path, videoFile.originalname || videoFile.filename);
        } catch (e) {
            console.error('Azure upload failed:', e && e.message ? e.message : e)
        }
        try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
                // Insert the reel into the database (using oc_influencer_reels table)
                const influencerId = userId;
                const reelQuery = `
                    INSERT INTO oc_influencer_reels
=======
                // Insert the reel into the database (using influencer_reels table)
                const influencerId = userId;
                const reelQuery = `
                    INSERT INTO influencer_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
                    (influencer_id, title, description, video_url, thumbnail, brand_id, status, date_added) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                `;
                
                const descriptionToSaveInfluencer = (String(category) === 'other' && otherCategoryName)
                    ? ((description ? `${description} ` : '') + `[Requested category: ${otherCategoryName}]`)
                    : (description || null);
                const reelValues = [
                    influencerId,
                    title,
                    descriptionToSaveInfluencer,
                    videoUrl,
                    thumbnailUrl,
                    associationType === 'brand' ? selectedBrand : null,
                    0
                ];
                
                console.log('Inserting influencer reel with values:', reelValues)
                
                connection.query(reelQuery, reelValues, (err, result) => {
                    if (err) {
<<<<<<< HEAD
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
                                if (String(category) === 'other' && otherCategoryName) {
                                    const suggestQuery = `
                                        INSERT INTO oc_reel_category (name, description, sort_order, status, date_added)
                                        VALUES (?, NULL, 0, 0, NOW())
                                    `;
                                    connection.query(suggestQuery, [otherCategoryName], () => {});
                                }
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
=======
                        return connection.rollback(() => {
                            connection.release()
                            console.error('Database error inserting influencer reel:', err)
                            return res.status(500).json({ 
                                success: false, 
                                message: 'Error saving reel',
                                error: err.message 
                            })
                        })
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
                        INSERT INTO oc_influencer_reel_to_category
=======
                        INSERT INTO influencer_reel_to_category 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
                                    INSERT INTO oc_influencer_reel_product
=======
                                    INSERT INTO influencer_reel_product 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
                                INSERT INTO oc_influencer_reel_product
=======
                                INSERT INTO influencer_reel_product 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
    // Similar implementation for seller reels using oc_seller_reels table
=======
    // Similar implementation for seller reels using seller_reels table
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
    
    // Check if video file is provided
    if (!req.files || !req.files.video) {
        console.log('Video file validation failed - files:', req.files)

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
<<<<<<< HEAD
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
=======
            videoUrl = await uploadToAzure(videoFile.path, videoFile.originalname || videoFile.filename);
        } catch (e) {
            console.error('Azure upload failed:', e && e.message ? e.message : e)
        }
        try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
                    
                    
                    const reelQuery = `
<<<<<<< HEAD
                        INSERT INTO oc_seller_reels
=======
                        INSERT INTO seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
                        (seller_id, title, description, video_url, thumbnail, brand_id, status, date_added) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
                    `;
                    
                    const descriptionToSave = (String(category) === 'other' && otherCategoryName)
                        ? ((description ? `${description} ` : '') + `[Requested category: ${otherCategoryName}]`)
                        : (description || null);

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
<<<<<<< HEAD
                                        INSERT INTO oc_seller_reel_product
=======
                                        INSERT INTO seller_reel_product 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
                                                data: { reelId }
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
                                            data: { reelId }
                                        });
                                    })
                                }
                            };

                            const catId = parseInt(category, 10);
                            if (!Number.isNaN(catId)) {
                                const categoryQuery = `
<<<<<<< HEAD
                                    INSERT INTO oc_seller_reel_to_category
=======
                                    INSERT INTO seller_reel_to_category 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
                                    const insOtherCat = `INSERT INTO oc_seller_reel_to_category (reel_id, category_id) VALUES (?, ?)`;
=======
                                    const insOtherCat = `INSERT INTO seller_reel_to_category (reel_id, category_id) VALUES (?, ?)`;
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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

    const videoFile = req.files && req.files.video ? req.files.video[0] : null;
    const thumbnailFile = req.files && req.files.thumbnail ? req.files.thumbnail[0] : null;
    let videoUrl = null;
    if (videoFile) {
        try {
            videoUrl = await uploadToAzure(videoFile.path, videoFile.originalname || videoFile.filename);
<<<<<<< HEAD
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
    
=======
        } catch (e) {
            console.error('Azure upload failed:', e && e.message ? e.message : e)
        }
        try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
    }
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
    const thumbnailUrl = thumbnailFile ? `/uploads/${thumbnailFile.filename}` : null;

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

<<<<<<< HEAD
                const checkInfluencer = `SELECT reel_id FROM oc_influencer_reels WHERE reel_id = ?`;
=======
                const checkInfluencer = `SELECT reel_id FROM influencer_reels WHERE reel_id = ?`;
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
                connection.query(checkInfluencer, [id], (err, results) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            return res.status(500).json({ success: false, message: 'Error checking reel type', error: err.message });
                        });
                    }

                    const isInfluencerReel = results.length > 0;
<<<<<<< HEAD
                    const tableName = isInfluencerReel ? 'oc_influencer_reels' : 'oc_seller_reels';
                    const categoryTable = isInfluencerReel ? 'oc_influencer_reel_to_category' : 'oc_seller_reel_to_category';
                    const productTable = isInfluencerReel ? 'oc_influencer_reel_product' : 'oc_seller_reel_product';
=======
                    const tableName = isInfluencerReel ? 'influencer_reels' : 'seller_reels';
                    const categoryTable = isInfluencerReel ? 'influencer_reel_to_category' : 'seller_reel_to_category';
                    const productTable = isInfluencerReel ? 'influencer_reel_product' : 'seller_reel_product';
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266

                    const updateFields = [];
                    const updateValues = [];

                    updateFields.push('title = ?');
                    updateValues.push(title);

                    const descToSave = (String(category) === 'other' && otherCategoryName)
                        ? ((description ? `${description} ` : '') + `[Requested category: ${String(otherCategoryName).trim()}]`)
                        : (description || null);
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

                    if (associationType === 'brand') {
                        updateFields.push('brand_id = ?');
                        updateValues.push(parseInt(selectedBrand, 10) || null);
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
                                        return res.status(500).json({ success: false, message: 'Error updating products', error: err.message });
                                    });
                                }

                                if (selectedProducts && selectedProducts.length > 0) {
                                    const insProd = `INSERT INTO ${productTable} (reel_id, product_id) VALUES ?`;
                                    const values = selectedProducts.map(pid => [id, pid]);
                                    connection.query(insProd, [values], err => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release();
                                                return res.status(500).json({ success: false, message: 'Error updating products', error: err.message });
                                            });
                                        }

                                        connection.commit(err => {
                                            if (err) {
                                                return connection.rollback(() => {
                                                    connection.release();
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
                                                return res.status(500).json({ success: false, message: 'Error saving changes' });
                                            });
                                        }
                                        connection.release();
                                        return res.status(200).json({ success: true, message: 'Reel updated successfully' });
                                    });
                                }
                            });
                        };

                        const catId = parseInt(category, 10);
                        if (!Number.isNaN(catId)) {
                            const delCat = `DELETE FROM ${categoryTable} WHERE reel_id = ?`;
                            connection.query(delCat, [id], err => {
                                if (err) {
                                    return connection.rollback(() => {
                                        connection.release();
                                        return res.status(500).json({ success: false, message: 'Error updating category', error: err.message });
                                    });
                                }

                                const insCat = `INSERT INTO ${categoryTable} (reel_id, category_id) VALUES (?, ?)`;
                                connection.query(insCat, [id, catId], err => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
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
                                        return res.status(500).json({ success: false, message: 'Error creating category', error: catErr.message });
                                    });
                                }
                                const newCatId = catResult.insertId;
                                const delCat = `DELETE FROM ${categoryTable} WHERE reel_id = ?`;
                                connection.query(delCat, [id], err => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            return res.status(500).json({ success: false, message: 'Error updating category', error: err.message });
                                        });
                                    }
                                    const insCat = `INSERT INTO ${categoryTable} (reel_id, category_id) VALUES (?, ?)`;
                                    connection.query(insCat, [id, newCatId], err => {
                                        if (err) {
                                            return connection.rollback(() => {
                                                connection.release();
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
        return res.status(500).json({ success: false, message: 'Internal server error' });
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
                    
<<<<<<< HEAD
                    // Insert the reel into the database (using oc_seller_reels table)
                    const reelQuery = `
                        INSERT INTO oc_seller_reels
=======
                    // Insert the reel into the database (using seller_reels table)
                    const reelQuery = `
                        INSERT INTO seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
                            INSERT INTO oc_seller_reel_to_category
=======
                            INSERT INTO seller_reel_to_category 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
                                    INSERT INTO oc_seller_reel_product
=======
                                    INSERT INTO seller_reel_product 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
                    ELSE 'unknown'
                END as status,
                0 as views,
                0 as likes,
                ir.date_added as created_at,
                ir.video_url,
                ir.thumbnail,
                GROUP_CONCAT(irp.product_id) as product_ids
<<<<<<< HEAD
            FROM oc_influencer_reels ir
            LEFT JOIN oc_influencer_reel_to_category irtc ON ir.reel_id = irtc.reel_id
            LEFT JOIN oc_reel_category orc ON irtc.category_id = orc.reel_category_id
            LEFT JOIN oc_influencer_reel_product irp ON ir.reel_id = irp.reel_id
=======
            FROM influencer_reels ir
            LEFT JOIN influencer_reel_to_category irtc ON ir.reel_id = irtc.reel_id
            LEFT JOIN oc_reel_category orc ON irtc.category_id = orc.reel_category_id
            LEFT JOIN influencer_reel_product irp ON ir.reel_id = irp.reel_id
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
                    fullVideoUrl = reel.video_url.startsWith('http') ? reel.video_url : `${baseUrl}${reel.video_url}`;
                }
                if (reel.thumbnail) {
                    fullThumbnailUrl = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                }
                
                return {
                    ...reel,
<<<<<<< HEAD
                    video_url: fullVideoUrl ? appendSAS(fullVideoUrl) : null,
                    thumbnail: fullThumbnailUrl,
                    product_ids: productIds,
                    product_count: productCount,
                    related_products_count: productCount,
                    product_names: []
=======
                    video_url: fullVideoUrl,
                    thumbnail: fullThumbnailUrl,
                    product_ids: productIds,
                    product_count: productCount,
                    related_products_count: productCount, // Use actual product count instead of placeholder
                    product_names: [] // We can't get product names without cross-database join
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
                        ELSE 'unknown'
                    END as status,
                    0 as views,
                    0 as likes,
                    sr.date_added as created_at,
                    sr.video_url,
                    sr.thumbnail,
                    GROUP_CONCAT(srp.product_id) as product_ids
                FROM seller_reels sr
                LEFT JOIN seller_reel_to_category srtc ON sr.reel_id = srtc.reel_id
                LEFT JOIN oc_reel_category orc ON srtc.category_id = orc.reel_category_id
                LEFT JOIN seller_reel_product srp ON sr.reel_id = srp.reel_id
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
                query += ' AND sr.reel_id IN (SELECT DISTINCT srp2.reel_id FROM seller_reel_product srp2 LEFT JOIN sagar.oc_product op ON srp2.product_id = op.product_id LEFT JOIN sagar.oc_product_description opd ON op.product_id = opd.product_id WHERE opd.name LIKE ? AND opd.language_id = 1)';
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
                        fullVideoUrl = reel.video_url.startsWith('http') ? reel.video_url : `${baseUrl}${reel.video_url}`;
                    }
                    if (reel.thumbnail) {
                        fullThumbnailUrl = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                    }
                    
                    return {
                        ...reel,
<<<<<<< HEAD
                        video_url: fullVideoUrl ? appendSAS(fullVideoUrl) : null,
                        thumbnail: fullThumbnailUrl,
                        product_ids: productIds,
                        product_count: productCount,
                        related_products_count: Math.min(3, Math.max(0, productCount > 0 ? 3 : 0)),
                        product_names: []
=======
                        video_url: fullVideoUrl,
                        thumbnail: fullThumbnailUrl,
                        product_ids: productIds,
                        product_count: productCount,
                        related_products_count: Math.min(3, Math.max(0, productCount > 0 ? 3 : 0)), // Placeholder: show up to 3 related products
                        product_names: [] // We can't get product names without cross-database join
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
                    };
                })
                
                return res.status(200).json({
                    success: true,
                    data: formattedResults
                })
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
<<<<<<< HEAD
                    const checkInfluencerQuery = `SELECT reel_id FROM oc_influencer_reels WHERE reel_id = ?`;
=======
                    const checkInfluencerQuery = `SELECT reel_id FROM influencer_reels WHERE reel_id = ?`;
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
                        const tableName = isInfluencerReel ? 'oc_influencer_reels' : 'oc_seller_reels';
                        const categoryTable = isInfluencerReel ? 'oc_influencer_reel_to_category' : 'oc_seller_reel_to_category';
                        const productTable = isInfluencerReel ? 'oc_influencer_reel_product' : 'oc_seller_reel_product';
=======
                        const tableName = isInfluencerReel ? 'influencer_reels' : 'seller_reels';
                        const categoryTable = isInfluencerReel ? 'influencer_reel_to_category' : 'seller_reel_to_category';
                        const productTable = isInfluencerReel ? 'influencer_reel_product' : 'seller_reel_product';
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
                        
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
                    ELSE 'unknown'
                END as status,
                0 as views,
                0 as likes,
                ir.date_added as created_at,
                GROUP_CONCAT(irp.product_id) as product_ids,
                ir.influencer_id as influencer_id
<<<<<<< HEAD
            FROM oc_influencer_reels ir
            LEFT JOIN oc_influencer_reel_to_category irtc ON ir.reel_id = irtc.reel_id
            LEFT JOIN oc_reel_category orc ON irtc.category_id = orc.reel_category_id
            LEFT JOIN oc_influencer_reel_product irp ON ir.reel_id = irp.reel_id
=======
            FROM influencer_reels ir
            LEFT JOIN influencer_reel_to_category irtc ON ir.reel_id = irtc.reel_id
            LEFT JOIN oc_reel_category orc ON irtc.category_id = orc.reel_category_id
            LEFT JOIN influencer_reel_product irp ON ir.reel_id = irp.reel_id
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
                            ELSE 'unknown'
                        END as status,
                        0 as views,
                        0 as likes,
                        sr.date_added as created_at,
                        GROUP_CONCAT(srp.product_id) as product_ids,
                        sr.seller_id as seller_id
                    FROM seller_reels sr
                    LEFT JOIN seller_reel_to_category srtc ON sr.reel_id = srtc.reel_id
                    LEFT JOIN oc_reel_category orc ON srtc.category_id = orc.reel_category_id
                    LEFT JOIN seller_reel_product srp ON sr.reel_id = srp.reel_id
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
                        return res.status(404).json({ 
                            success: false, 
                            message: 'Reel not found' 
                        })
                    }
                    
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
                        // Check if it's already a full URL
                        if (reel.video_url.startsWith('http')) {
<<<<<<< HEAD
                            fullReel.video_url = appendSAS(reel.video_url);
                        } else {
                            // For relative paths like /uploads/filename, we need to ensure they're accessible
                            // The uploads are served at /uploads, not /api/studio/reels/uploads
                            fullReel.video_url = appendSAS(
                                reel.video_url.startsWith('/uploads') ? 
                                    `http://localhost:3189${reel.video_url}` : 
                                    `${baseUrl}${reel.video_url}`
                            );
=======
                            fullReel.video_url = reel.video_url;
                        } else {
                            // For relative paths like /uploads/filename, we need to ensure they're accessible
                            // The uploads are served at /uploads, not /api/studio/reels/uploads
                            fullReel.video_url = reel.video_url.startsWith('/uploads') ? 
                                `http://localhost:3189${reel.video_url}` : 
                                `${baseUrl}${reel.video_url}`;
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
                                `http://localhost:3189${reel.thumbnail}` : 
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
                                ELSE 'unknown'
                            END as status,
                            0 as views,
                            0 as likes,
                            sr.date_added as created_at,
                            GROUP_CONCAT(srp.product_id) as product_ids,
                            sr.seller_id as seller_id
                        FROM seller_reels sr
                        LEFT JOIN seller_reel_to_category srtc ON sr.reel_id = srtc.reel_id
                        LEFT JOIN oc_reel_category orc ON srtc.category_id = orc.reel_category_id
                        LEFT JOIN seller_reel_product srp ON sr.reel_id = srp.reel_id
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
                            return res.status(404).json({ 
                                success: false, 
                                message: 'Reel not found' 
                            })
                        }
                        
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
                            fullReel.video_url = reel.video_url.startsWith('http') ? reel.video_url : `${baseUrl}${reel.video_url}`;
                        }
                        if (reel.thumbnail) {
                            fullReel.thumbnail = reel.thumbnail.startsWith('http') ? reel.thumbnail : `${baseUrl}${reel.thumbnail}`;
                        }
                        
                        return res.status(200).json({
                            success: true,
                            data: fullReel
                        })
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
                        fullReel.video_url = reel.video_url.startsWith('http') ? reel.video_url : `${baseUrl}${reel.video_url}`;
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

<<<<<<< HEAD
// Get all brand reels (combines oc_brand_reels and oc_seller_reels with brand_id)
=======
// Get all brand reels (combines brand_reels and seller_reels with brand_id)
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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

<<<<<<< HEAD
            // Query to fetch brand reels from oc_brand_reels table
=======
            // Query to fetch brand reels from brand_reels table
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
                    br.status,
                    br.created_at,
                    'brand' as reel_type
<<<<<<< HEAD
                FROM oc_brand_reels br
=======
                FROM brand_reels br
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
                LEFT JOIN oc_reel_category c ON br.category_id = c.reel_category_id
                WHERE br.status = 'approved'
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
                    FROM seller_reels sr
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
<<<<<<< HEAD
                FROM oc_seller_reels
=======
                FROM seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
                WHERE seller_id = ?
            `;
            
            // Get approved reels count
            const approvedReelsQuery = `
                SELECT COUNT(*) as approvedReels
<<<<<<< HEAD
                FROM oc_seller_reels
=======
                FROM seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
                WHERE seller_id = ? AND status = 1
            `;
            
            // Get pending reels count
            const pendingReelsQuery = `
                SELECT COUNT(*) as pendingReels
<<<<<<< HEAD
                FROM oc_seller_reels
=======
                FROM seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
                WHERE seller_id = ? AND status = 0
            `;
            
            // Get rejected reels count
            const rejectedReelsQuery = `
                SELECT COUNT(*) as rejectedReels
<<<<<<< HEAD
                FROM oc_seller_reels
=======
                FROM seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
                FROM seller_reels sr
                LEFT JOIN seller_reel_to_category srtc ON sr.reel_id = srtc.reel_id
                LEFT JOIN oc_reel_category orc ON srtc.category_id = orc.reel_category_id
                LEFT JOIN seller_reel_product srp ON sr.reel_id = srp.reel_id
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
<<<<<<< HEAD
            FROM oc_seller_reels
=======
            FROM seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            WHERE status = 1
        `;
        
        // Get approved influencer reels count
        const influencerApprovedQuery = `
            SELECT COUNT(*) as approvedReels
<<<<<<< HEAD
            FROM oc_influencer_reels
=======
            FROM influencer_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
<<<<<<< HEAD
            FROM oc_seller_reels
=======
            FROM seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            WHERE status = 1 AND DATE(date_added) = CURDATE()
        `;
        
        // Get today's approved reels count for influencer reels
        const todayInfluencerApprovedQuery = `
            SELECT COUNT(*) as todayApprovedReels
<<<<<<< HEAD
            FROM oc_influencer_reels
=======
            FROM influencer_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            WHERE status = 1 AND DATE(date_added) = CURDATE()
        `;        
        // Get today's pending reels count for seller reels
        const todaySellerPendingQuery = `
            SELECT COUNT(*) as todayPendingReels
<<<<<<< HEAD
            FROM oc_seller_reels
=======
            FROM seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            WHERE status = 0 AND DATE(date_added) = CURDATE()
        `;
        
        // Get today's pending reels count for influencer reels
        const todayInfluencerPendingQuery = `
            SELECT COUNT(*) as todayPendingReels
<<<<<<< HEAD
            FROM oc_influencer_reels
=======
            FROM influencer_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            WHERE status = 0 AND DATE(date_added) = CURDATE()
        `;        
        // Get today's rejected reels count for seller reels
        const todaySellerRejectedQuery = `
            SELECT COUNT(*) as todayRejectedReels
<<<<<<< HEAD
            FROM oc_seller_reels
=======
            FROM seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            WHERE status = 2 AND DATE(date_added) = CURDATE()
        `;
        
        // Get today's rejected reels count for influencer reels
        const todayInfluencerRejectedQuery = `
            SELECT COUNT(*) as todayRejectedReels
<<<<<<< HEAD
            FROM oc_influencer_reels
=======
            FROM influencer_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            WHERE status = 2 AND DATE(date_added) = CURDATE()
        `;        
        // Get total reels count for seller reels
        const totalSellerReelsQuery = `
            SELECT COUNT(*) as totalReels
<<<<<<< HEAD
            FROM oc_seller_reels
=======
            FROM seller_reels
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
        `;
        
        // Get total reels count for influencer reels
        const totalInfluencerReelsQuery = `
            SELECT COUNT(*) as totalReels
<<<<<<< HEAD
            FROM oc_influencer_reels
=======
            FROM influencer_reels
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
        `;
        
        // Get pending reels count for seller reels
        const pendingSellerReelsQuery = `
            SELECT COUNT(*) as pendingReels
<<<<<<< HEAD
            FROM oc_seller_reels
=======
            FROM seller_reels
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            WHERE status = 0
        `;
        
        // Get pending reels count for influencer reels
        const pendingInfluencerReelsQuery = `
            SELECT COUNT(*) as pendingReels
<<<<<<< HEAD
            FROM oc_influencer_reels
=======
            FROM influencer_reels
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            WHERE status = 0
        `;
        
        // Get rejected reels count for seller reels
        const rejectedSellerReelsQuery = `
            SELECT COUNT(*) as rejectedReels
<<<<<<< HEAD
            FROM oc_seller_reels
=======
            FROM seller_reels
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            WHERE status = 2
        `;
        
        // Get rejected reels count for influencer reels
        const rejectedInfluencerReelsQuery = `
            SELECT COUNT(*) as rejectedReels
<<<<<<< HEAD
            FROM oc_influencer_reels
=======
            FROM influencer_reels
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
        
        // Update the status to approved (1)
        const query = `
<<<<<<< HEAD
            UPDATE oc_seller_reels
=======
            UPDATE seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            SET status = 1, date_modified = CURRENT_TIMESTAMP 
            WHERE reel_id = ?
        `;
        
        db.query(query, [id], (err, result) => {
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
            
            res.json({
                success: true,
                message: 'Reel approved successfully'
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
        
        // Update the status to rejected (2)
        const query = `
<<<<<<< HEAD
            UPDATE oc_seller_reels
=======
            UPDATE seller_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
            SET status = 2, date_modified = CURRENT_TIMESTAMP 
            WHERE reel_id = ?
        `;
        
        db.query(query, [id], (err, result) => {
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
            
            res.json({
                success: true,
                message: 'Reel rejected successfully'
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
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // Query that gets recent influencer reels with product information and platform details
        // Modified to ensure we get all approved influencer reels regardless of influencer status
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
                GROUP_CONCAT(irp.product_id) as product_ids,
                ir.influencer_id as influencer_id,
                oi.firstname as influencer_firstname,
                oi.lastname as influencer_lastname,
                oi.platform as platform,
                oi.account_link as account_link
            FROM influencer_reels ir
            LEFT JOIN influencer_reel_to_category irtc ON ir.reel_id = irtc.reel_id
            LEFT JOIN oc_reel_category orc ON irtc.category_id = orc.reel_category_id
            LEFT JOIN influencer_reel_product irp ON ir.reel_id = irp.reel_id
            LEFT JOIN oc_influencers oi ON ir.influencer_id = oi.id
            WHERE ir.status = 1
            GROUP BY ir.reel_id
            ORDER BY ir.date_added DESC
        `;
        
        db.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching influencer reels:', err)
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching influencer reels',
                    error: err.message 
                })
            }
            
            // Process results to format product_ids as array
            const processedResults = results.map(reel => {
                return {
                    ...reel,
                    product_ids: reel.product_ids ? reel.product_ids.split(',').map(id => parseInt(id)) : [],
                    influencer_name: `${reel.influencer_firstname || ''} ${reel.influencer_lastname || ''}`.trim() || 'Unknown'
                };
            });
            
            return res.status(200).json({
                success: true,
                data: processedResults
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
            FROM influencer_reels ir
            LEFT JOIN influencer_reel_to_category irtc ON ir.reel_id = irtc.reel_id
            LEFT JOIN oc_reel_category orc ON irtc.category_id = orc.reel_category_id
            LEFT JOIN influencer_reel_product irp ON ir.reel_id = irp.reel_id
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
            
            // Process results
            const processedResults = results.map(reel => {
                return {
                    ...reel,
                    product_ids: reel.product_ids ? reel.product_ids.split(',').map(id => parseInt(id)) : [],
                };
            });
            
            return res.status(200).json({
                success: true,
                data: processedResults
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
        
        // Build query to update influencer reel status to approved (1)
<<<<<<< HEAD
        const query = `UPDATE oc_influencer_reels SET status = 1 WHERE reel_id = ?`;
=======
        const query = `UPDATE influencer_reels SET status = 1 WHERE reel_id = ?`;
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
        
        db.query(query, [id], (err, results) => {
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
            
            return res.status(200).json({
                success: true,
                message: 'Reel approved successfully'
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
        
        // Build query to update influencer reel status to rejected (2)
<<<<<<< HEAD
        const query = `UPDATE oc_influencer_reels SET status = 2 WHERE reel_id = ?`;
=======
        const query = `UPDATE influencer_reels SET status = 2 WHERE reel_id = ?`;
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
        
        db.query(query, [id], (err, results) => {
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
            
            return res.status(200).json({
                success: true,
                message: 'Reel rejected successfully'
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
            FROM seller_reels sr
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
<<<<<<< HEAD
        // oc_seller_reels is in the main db (ipshopy_reels)
=======
        // seller_reels is in the main db (ipshopy_reels)
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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
            FROM seller_reels sr
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

        // Check if any form data was received at all
        if (!req.body || Object.keys(req.body).length === 0) {
            console.log('ERROR: No form data received in request body');
            console.log('Request object keys:', Object.keys(req));
            if (req.body) {
                console.log('Request body keys:', Object.keys(req.body));
            }
            return res.status(400).json({
                success: false,
                message: 'No form data received'
            });
        }

        // Extract text fields from req.body (handling both naming conventions)
        const title = req.body.title;
        const description = req.body.description;
        const category = req.body.category || req.body.category_id;
        const brandId = req.body.brandId || req.body.brand_id;
        const productId = req.body.productId || req.body.product_id;

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

        if (!title) {
            console.log('Title validation failed - title is:', title);
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        if (!category) {
            console.log('Category validation failed - category is:', category);
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }

        if (!brandId) {
            console.log('Brand validation failed - brandId is:', brandId);
            return res.status(400).json({
                success: false,
                message: 'Brand is required'
            });
        }

        // Check if video file is provided
        if (!req.files || !req.files.video) {
            console.log('Video file validation failed - files:', req.files);

            return res.status(400).json({
                success: false,
                message: 'Video file is required'
            });
        }

        // Validate that the brand exists in the sagar database
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
            
            // Handle file uploads
            // Save actual file paths to database
            const videoFile = req.files.video ? req.files.video[0] : null;
            let videoUrl = null;
            if (videoFile) {
                try {
<<<<<<< HEAD
                    videoUrl = await uploadToAzure(
                        videoFile.path,
                        videoFile.originalname || videoFile.filename,
                        videoFile.mimetype || 'application/octet-stream'
                    );
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
=======
                    videoUrl = await uploadToAzure(videoFile.path, videoFile.originalname || videoFile.filename);
                } catch (e) {
                    console.error('Azure upload failed:', e && e.message ? e.message : e)
                }
                try { fs.unlink(videoFile.path, () => {}) } catch (_) {}
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
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

            // Insert the brand reel into the database
            const brandReelQuery = `
<<<<<<< HEAD
                INSERT INTO oc_brand_reels
=======
                INSERT INTO brand_reels 
>>>>>>> 60100eeeef9413d40824717c48354bc12222d266
                (brand_id, category_id, product_id, title, description, video_url, thumbnail_url, views, likes, comments, status, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 'approved', NOW())
            `;

            const brandReelValues = [
                brandId,
                category,
                productId || null,
                title,
                description || null,
                videoUrl,
                thumbnailUrl
            ];

            console.log('Inserting brand reel with values:', brandReelValues);

            db.query(brandReelQuery, brandReelValues, (err, result) => {
                if (err) {
                    console.error('Database error inserting brand reel:', err);
                    console.error('SQL Query:', brandReelQuery);
                    console.error('Values:', brandReelValues);
                    // Check for foreign key constraint error
                    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                        return res.status(400).json({
                            success: false,
                            message: 'Invalid brand or category ID. Please select valid options.',
                            error: err.message
                        });
                    }
                    return res.status(500).json({
                        success: false,
                        message: 'Error saving brand reel',
                        error: err.message
                    });
                }

                const reelId = result.insertId;
                console.log('Brand reel inserted successfully, ID:', reelId);

                return res.status(201).json({
                    success: true,
                    message: 'Brand reel uploaded successfully',
                    data: { reelId }
                });
            });
        });
    } catch (error) {
        console.error('Error uploading brand reel:', error);
        return res.status(500).json({
            success: false,
            message: 'Error uploading brand reel',
            error: error.message
        });
    }
};
module.exports = {
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
    approveSellerReel,
    rejectSellerReel,
    approveInfluencerReel, // Add the new function for approving influencer reels
    rejectInfluencerReel,  // Add the new function for rejecting influencer reels
    getAllPendingSellerReels,
    getAllApprovedSellerReels,
    getBrandReels,
    uploadBrandReel
};
