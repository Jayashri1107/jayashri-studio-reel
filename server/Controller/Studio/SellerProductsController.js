const dbSagar = require('../../Config/db_sagar');

// Get seller products
const getSellerProducts = async (req, res) => {
    try {
        const { sellerId } = req.params;

        if (!sellerId) {
            return res.status(400).json({
                success: false,
                message: 'Seller ID is required'
            });
        }

        // Query to get products associated with the seller
        const query = `
            SELECT 
                p.product_id,
                p.model as name
            FROM oc_vendor_to_product vtp
            JOIN oc_product p ON vtp.product_id = p.product_id
            WHERE vtp.vendor_id = ?
            ORDER BY p.model
        `;

        dbSagar.query(query, [sellerId], (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            res.json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('GetSellerProducts error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all manufacturers/brands
const getAllBrands = async (req, res) => {
    try {
        // Query to get all manufacturers
        const query = `
            SELECT 
                manufacturer_id as id,
                name
            FROM oc_manufacturer
            ORDER BY name
        `;

        dbSagar.query(query, (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Database error occurred'
                });
            }

            res.json({
                success: true,
                data: results
            });
        });
    } catch (error) {
        console.error('GetAllBrands error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getSellerProducts,
    getAllBrands
};