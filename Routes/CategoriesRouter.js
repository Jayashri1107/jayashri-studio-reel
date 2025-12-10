const express = require('express');
const router = express.Router();
const {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../Controller/CategoriesController');

// Get all categories
router.get('/', getAllCategories);

// Get category by ID
router.get('/:id', getCategoryById);

// Create a new category
router.post('/', createCategory);

// Update a category
router.put('/:id', updateCategory);

// Delete a category
router.delete('/:id', deleteCategory);

module.exports = router;