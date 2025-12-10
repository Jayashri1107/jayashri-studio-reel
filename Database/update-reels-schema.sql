-- =====================================================
-- Update Reels Schema - Add reel_products table
-- =====================================================

USE `ipshopy_reels`;

-- =====================================================
-- CREATE REEL_PRODUCTS TABLE
-- Table to associate reels with products
-- =====================================================
CREATE TABLE `reel_products` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reel_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_reel_products_reel_id` (`reel_id`),
    KEY `idx_reel_products_product_id` (`product_id`),
    CONSTRAINT `fk_reel_products_reel_id` FOREIGN KEY (`reel_id`) REFERENCES `reels` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reel_products_product_id` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Association table between reels and products';

-- =====================================================
-- UPDATE REELS TABLE
-- Add brand_id and product_id columns if they don't exist
-- =====================================================
ALTER TABLE `reels` 
ADD COLUMN IF NOT EXISTS `brand_id` BIGINT UNSIGNED DEFAULT NULL COMMENT 'FK to brands (if associated with brand directly)',
ADD COLUMN IF NOT EXISTS `product_id` BIGINT UNSIGNED DEFAULT NULL COMMENT 'FK to products (if associated with product)';

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS `idx_reels_brand_id` ON `reels` (`brand_id`);
CREATE INDEX IF NOT EXISTS `idx_reels_product_id` ON `reels` (`product_id`);
