const db = require('../Config/db');

// Get all categories
const getAllCategories = (req, res) => {
    const query = 'SELECT * FROM oc_reel_category ORDER BY sort_order ASC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error fetching categories',
                error: err.message 
            });
        }
        
        // Map the results to match the expected format
        const mappedResults = results.map(category => ({
            id: category.reel_category_id,
            name: category.name,
            description: category.description,
            sort_order: category.sort_order,
            is_active: category.status,
            created_at: category.date_added,
            updated_at: category.date_modified,
            videoCount: 0 // This would need to be calculated separately
        }));
        
        res.status(200).json({
            success: true,
            data: mappedResults
        });
    });
};

// Get category by ID
const getCategoryById = (req, res) => {
    const { id } = req.params;
    const query = 'SELECT * FROM oc_reel_category WHERE reel_category_id = ?';
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error fetching category:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error fetching category',
                error: err.message 
            });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }
        
        const category = results[0];
        const mappedCategory = {
            id: category.reel_category_id,
            name: category.name,
            description: category.description,
            sort_order: category.sort_order,
            is_active: category.status,
            created_at: category.date_added,
            updated_at: category.date_modified,
            videoCount: 0
        };
        
        res.status(200).json({
            success: true,
            data: mappedCategory
        });
    });
};

// Create a new category
const createCategory = (req, res) => {
    const { name, description } = req.body;
    
    // Validation
    if (!name || name.trim() === '') {
        return res.status(400).json({ 
            success: false, 
            message: 'Category name is required' 
        });
    }
    
    const query = `
        INSERT INTO oc_reel_category (name, description, sort_order, status, date_added) 
        VALUES (?, ?, ?, ?, NOW())
    `;
    
    const values = [
        name.trim(),
        description || null,
        0, // sort_order
        1  // status (active)
    ];
    
    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error creating category:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error creating category',
                error: err.message 
            });
        }
        
        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            data: {
                id: results.insertId,
                name: name.trim(),
                description: description || null
            }
        });
    });
};

// Update a category
const updateCategory = (req, res) => {
    const { id } = req.params;
    const { name, description, is_active, sort_order } = req.body;
    
    // Validation
    if (!name || name.trim() === '') {
        return res.status(400).json({ 
            success: false, 
            message: 'Category name is required' 
        });
    }
    
    const query = `
        UPDATE oc_reel_category 
        SET name = ?, description = ?, sort_order = ?, status = ?, date_modified = NOW()
        WHERE reel_category_id = ?
    `;
    
    const values = [
        name.trim(),
        description || null,
        sort_order !== undefined ? sort_order : 0,
        is_active !== undefined ? is_active : 1,
        id
    ];
    
    db.query(query, values, (err, results) => {
        if (err) {
            console.error('Error updating category:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error updating category',
                error: err.message 
            });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Category updated successfully'
        });
    });
};

// Delete a category
const deleteCategory = (req, res) => {
    const { id } = req.params;
    
    const query = 'DELETE FROM oc_reel_category WHERE reel_category_id = ?';
    
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error deleting category:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Error deleting category',
                error: err.message 
            });
        }
        
        if (results.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Category not found' 
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    });
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};