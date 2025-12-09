const db = require('../Config/db'); // ipshopy_reels database
const sagarDb = require('../Config/db_sagar'); // sagar database

// Function to fetch sellers from sagar database
const fetchSellersFromSagar = async () => {
    return new Promise((resolve, reject) => {
        // Let's first get the table structure to understand what columns are available
        const query = 'SHOW COLUMNS FROM oc_vendor';
        sagarDb.query(query, (err, results) => {
            if (err) {
                // If we can't get columns, let's try a simple select all
                const fallbackQuery = 'SELECT * FROM oc_vendor LIMIT 1';
                sagarDb.query(fallbackQuery, (fallbackErr, fallbackResults) => {
                    if (fallbackErr) {
                        reject(fallbackErr);
                    } else {
                        // Get the actual column names from the result
                        if (fallbackResults.length > 0) {
                            const columns = Object.keys(fallbackResults[0]);
                            console.log('Available columns in oc_vendor:', columns);
                            
                            // Now construct a proper query with actual column names
                            const dataQuery = 'SELECT * FROM oc_vendor';
                            sagarDb.query(dataQuery, (dataErr, dataResults) => {
                                if (dataErr) {
                                    reject(dataErr);
                                } else {
                                    resolve(dataResults);
                                }
                            });
                        } else {
                            resolve([]);
                        }
                    }
                });
            } else {
                console.log('Column structure of oc_vendor:', results);
                // Now fetch the actual data
                const dataQuery = 'SELECT * FROM oc_vendor';
                sagarDb.query(dataQuery, (dataErr, dataResults) => {
                    if (dataErr) {
                        reject(dataErr);
                    } else {
                        resolve(dataResults);
                    }
                });
            }
        });
    });
};

// Function to fetch brands from sagar database
const fetchBrandsFromSagar = async () => {
    return new Promise((resolve, reject) => {
        // Let's first get the table structure to understand what columns are available
        const query = 'SHOW COLUMNS FROM oc_manufacturer';
        sagarDb.query(query, (err, results) => {
            if (err) {
                // If we can't get columns, let's try a simple select all
                const fallbackQuery = 'SELECT * FROM oc_manufacturer LIMIT 1';
                sagarDb.query(fallbackQuery, (fallbackErr, fallbackResults) => {
                    if (fallbackErr) {
                        reject(fallbackErr);
                    } else {
                        // Get the actual column names from the result
                        if (fallbackResults.length > 0) {
                            const columns = Object.keys(fallbackResults[0]);
                            console.log('Available columns in oc_manufacturer:', columns);
                            
                            // Now construct a proper query with actual column names
                            const dataQuery = 'SELECT * FROM oc_manufacturer';
                            sagarDb.query(dataQuery, (dataErr, dataResults) => {
                                if (dataErr) {
                                    reject(dataErr);
                                } else {
                                    resolve(dataResults);
                                }
                            });
                        } else {
                            resolve([]);
                        }
                    }
                });
            } else {
                console.log('Column structure of oc_manufacturer:', results);
                // Now fetch the actual data
                const dataQuery = 'SELECT * FROM oc_manufacturer';
                sagarDb.query(dataQuery, (dataErr, dataResults) => {
                    if (dataErr) {
                        reject(dataErr);
                    } else {
                        resolve(dataResults);
                    }
                });
            }
        });
    });
};

// Function to store sellers in ipshopy_reels database
const storeSellersInReelsDb = async (sellers) => {
    return new Promise((resolve, reject) => {
        if (sellers.length === 0) {
            resolve([]);
            return;
        }

        // Log the structure of the first seller to understand the data
        console.log('Sample seller data:', sellers[0]);

        // Prepare the insert query - we need to map the sagar fields to our database fields
        const values = sellers.map(seller => {
            // Adjust these mappings based on the actual structure of your sagar database
            return [
                seller.email || seller.vendor_email || seller.contact_email || `seller${seller.vendor_id || seller.id}@example.com`,
                'seller', // role
                seller.company_name || seller.name || seller.vendor_name || 'Unknown Company',
                '', // last_name (not in sagar data)
                seller.phone || seller.telephone || null,
                1, // is_active
                seller.date_added || seller.created_at || seller.date_created || new Date()
            ];
        });

        const query = `
            INSERT INTO users (email, role, first_name, last_name, phone, is_active, created_at)
            VALUES ?
            ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            phone = VALUES(phone),
            updated_at = CURRENT_TIMESTAMP
        `;

        db.query(query, [values], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Function to store brands in ipshopy_reels database
const storeBrandsInReelsDb = async (brands) => {
    return new Promise((resolve, reject) => {
        if (brands.length === 0) {
            resolve([]);
            return;
        }

        // Log the structure of the first brand to understand the data
        console.log('Sample brand data:', brands[0]);

        // Prepare the insert query
        const values = brands.map(brand => {
            // Adjust these mappings based on the actual structure of your sagar database
            return [
                brand.name || brand.manufacturer_name || 'Unknown Brand',
                (brand.name || brand.manufacturer_name || 'Unknown Brand').toLowerCase().replace(/\s+/g, '-'), // slug
                brand.description || brand.manufacturer_description || null,
                null, // logo_url
                null, // website_url
                null, // contact_email
                null, // contact_phone
                1, // is_active
                brand.date_added || brand.created_at || brand.date_created || new Date()
            ];
        });

        const query = `
            INSERT INTO brands (name, slug, description, logo_url, website_url, contact_email, contact_phone, is_active, created_at)
            VALUES ?
            ON DUPLICATE KEY UPDATE
            description = VALUES(description),
            updated_at = CURRENT_TIMESTAMP
        `;

        db.query(query, [values], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Main sync function
const syncData = async (req, res) => {
    try {
        console.log('Starting data synchronization...');
        
        // Fetch data from sagar database
        console.log('Fetching sellers from sagar database...');
        const sellers = await fetchSellersFromSagar();
        console.log(`Fetched ${sellers.length} sellers from sagar database`);
        
        console.log('Fetching brands from sagar database...');
        const brands = await fetchBrandsFromSagar();
        console.log(`Fetched ${brands.length} brands from sagar database`);
        
        // Store data in ipshopy_reels database
        console.log('Storing sellers in ipshopy_reels database...');
        const sellerResults = await storeSellersInReelsDb(sellers);
        console.log(`Stored/Updated ${sellerResults.affectedRows || sellers.length} sellers in ipshopy_reels database`);
        
        console.log('Storing brands in ipshopy_reels database...');
        const brandResults = await storeBrandsInReelsDb(brands);
        console.log(`Stored/Updated ${brandResults.affectedRows || brands.length} brands in ipshopy_reels database`);
        
        res.status(200).json({
            success: true,
            message: 'Data synchronization completed successfully',
            sellers: sellers.length,
            brands: brands.length
        });
    } catch (error) {
        console.error('Error during data synchronization:', error);
        res.status(500).json({
            success: false,
            message: 'Error during data synchronization',
            error: error.message
        });
    }
};

module.exports = {
    syncData
};