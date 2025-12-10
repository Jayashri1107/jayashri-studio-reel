-- =====================================================
-- Standardized Reels Management System Database Schema
-- All tables now use the 'oc_' prefix for consistency
-- =====================================================

-- Create database
CREATE DATABASE IF NOT EXISTS `ipshopy_reels` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `ipshopy_reels`;

-- =====================================================
-- DROP EXISTING TABLES (if they exist)
-- =====================================================
DROP TABLE IF EXISTS `oc_follows`;
DROP TABLE IF EXISTS `oc_video_approval_logs`;
DROP TABLE IF EXISTS `oc_reels`;
DROP TABLE IF EXISTS `oc_reel_products`;
DROP TABLE IF EXISTS `oc_product_variants`;
DROP TABLE IF EXISTS `oc_products`;
DROP TABLE IF EXISTS `oc_brands`;
DROP TABLE IF EXISTS `oc_categories`;
DROP TABLE IF EXISTS `oc_profiles`;
DROP TABLE IF EXISTS `oc_users`;
DROP TABLE IF EXISTS `oc_influencer_reel_product`;
DROP TABLE IF EXISTS `oc_seller_reel_product`;
DROP TABLE IF EXISTS `oc_influencer_reel_to_category`;
DROP TABLE IF EXISTS `oc_seller_reel_to_category`;
DROP TABLE IF EXISTS `oc_influencer_reels`;
DROP TABLE IF EXISTS `oc_seller_reels`;
DROP TABLE IF EXISTS `oc_influencers`;
DROP TABLE IF EXISTS `oc_sellers`;

-- =====================================================
-- 1. USERS TABLE
-- Stores all users: admin, sellers, influencers
-- =====================================================
CREATE TABLE `oc_users` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
    `role` ENUM('admin', 'seller', 'influencer') NOT NULL DEFAULT 'seller',
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) DEFAULT NULL,
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_users_email` (`email`(191)),
    KEY `idx_users_role` (`role`),
    KEY `idx_users_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='System users';

-- =====================================================
-- 2. USER PROFILES TABLE
-- Extended profile information with social metrics
-- =====================================================
CREATE TABLE `oc_profiles` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `bio` TEXT DEFAULT NULL,
    `profile_picture` VARCHAR(500) DEFAULT NULL COMMENT 'Azure blob storage URL',
    `cover_photo` VARCHAR(500) DEFAULT NULL COMMENT 'Azure blob storage URL',
    `website_url` VARCHAR(500) DEFAULT NULL,
    `location` VARCHAR(100) DEFAULT NULL,
    `follower_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `following_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `post_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `is_verified` TINYINT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_profiles_user_id` (`user_id`),
    UNIQUE KEY `idx_profiles_username` (`username`(50)),
    CONSTRAINT `fk_profiles_user_id` FOREIGN KEY (`user_id`) REFERENCES `oc_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User profiles';

-- =====================================================
-- 3. BRANDS TABLE
-- Brand information for product associations
-- =====================================================
CREATE TABLE `oc_brands` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `logo_url` VARCHAR(500) DEFAULT NULL COMMENT 'Azure blob storage URL',
    `website_url` VARCHAR(500) DEFAULT NULL,
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_brands_slug` (`slug`(100)),
    UNIQUE KEY `idx_brands_name` (`name`(100)),
    KEY `idx_brands_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Brands';

-- =====================================================
-- 4. PRODUCTS TABLE
-- Products that can be associated with reels
-- =====================================================
CREATE TABLE `oc_products` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `brand_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `sku` VARCHAR(100) NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `currency` VARCHAR(3) NOT NULL DEFAULT 'INR',
    `image_url` VARCHAR(500) DEFAULT NULL COMMENT 'Azure blob storage URL',
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_products_slug` (`slug`(191)),
    UNIQUE KEY `idx_products_sku` (`sku`(100)),
    KEY `idx_products_brand_id` (`brand_id`),
    KEY `idx_products_is_active` (`is_active`),
    CONSTRAINT `fk_products_brand_id` FOREIGN KEY (`brand_id`) REFERENCES `oc_brands` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Products';

-- =====================================================
-- 5. PRODUCT VARIANTS TABLE
-- Product variants (size, color, etc.)
-- =====================================================
CREATE TABLE `oc_product_variants` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `variant_name` VARCHAR(50) NOT NULL COMMENT 'e.g., Size, Color',
    `variant_value` VARCHAR(100) NOT NULL COMMENT 'e.g., Small, Red',
    `sku_suffix` VARCHAR(20) DEFAULT NULL,
    `additional_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `stock_quantity` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_product_variants_product_id` (`product_id`),
    CONSTRAINT `fk_product_variants_product_id` FOREIGN KEY (`product_id`) REFERENCES `oc_products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Product variants';

-- =====================================================
-- 6. CATEGORIES TABLE
-- Predefined categories for reels
-- =====================================================
CREATE TABLE `oc_categories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `icon` VARCHAR(50) DEFAULT NULL,
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `sort_order` INT NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_categories_slug` (`slug`(100)),
    UNIQUE KEY `idx_categories_name` (`name`(100)),
    KEY `idx_categories_is_active` (`is_active`),
    KEY `idx_categories_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reel categories';

-- =====================================================
-- 7. REELS TABLE
-- Main reels/videos table with all required fields
-- =====================================================
CREATE TABLE `oc_reels` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uploader_id` BIGINT UNSIGNED NOT NULL COMMENT 'FK to users (seller or influencer)',
    `category_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED DEFAULT NULL COMMENT 'FK to products (if associated with product)',
    `brand_id` BIGINT UNSIGNED DEFAULT NULL COMMENT 'FK to brands (if associated with brand directly)',
    `title` VARCHAR(255) NOT NULL,
    `caption` TEXT DEFAULT NULL,
    `video_url` VARCHAR(500) NOT NULL COMMENT 'Azure blob storage URL',
    `thumbnail_url` VARCHAR(500) DEFAULT NULL COMMENT 'Azure blob storage URL',
    `video_size` BIGINT UNSIGNED NOT NULL COMMENT 'File size in bytes',
    `duration` INT UNSIGNED NOT NULL COMMENT 'Duration in seconds',
    `status` ENUM('draft', 'pending', 'approved', 'rejected', 'archived') NOT NULL DEFAULT 'draft',
    `scheduled_at` TIMESTAMP NULL DEFAULT NULL,
    `approved_at` TIMESTAMP NULL DEFAULT NULL,
    `approved_by` BIGINT UNSIGNED DEFAULT NULL COMMENT 'FK to users (admin who approved)',
    `rejection_reason` TEXT DEFAULT NULL,
    `views` INT UNSIGNED NOT NULL DEFAULT 0,
    `likes` INT UNSIGNED NOT NULL DEFAULT 0,
    `comments` INT UNSIGNED NOT NULL DEFAULT 0,
    `impressions` INT UNSIGNED NOT NULL DEFAULT 0,
    `engagement_rate` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_reels_uploader_id` (`uploader_id`),
    KEY `idx_reels_category_id` (`category_id`),
    KEY `idx_reels_product_id` (`product_id`),
    KEY `idx_reels_brand_id` (`brand_id`),
    KEY `idx_reels_status` (`status`),
    KEY `idx_reels_scheduled_at` (`scheduled_at`),
    KEY `idx_reels_approved_at` (`approved_at`),
    KEY `idx_reels_created_at` (`created_at`),
    FULLTEXT KEY `idx_reels_title_caption` (`title`, `caption`),
    CONSTRAINT `fk_reels_uploader_id` FOREIGN KEY (`uploader_id`) REFERENCES `oc_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reels_category_id` FOREIGN KEY (`category_id`) REFERENCES `oc_categories` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_reels_product_id` FOREIGN KEY (`product_id`) REFERENCES `oc_products` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_reels_brand_id` FOREIGN KEY (`brand_id`) REFERENCES `oc_brands` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_reels_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `oc_users` (`id`) ON DELETE SET NULL,
    CONSTRAINT `chk_reels_video_size` CHECK (`video_size` <= 104857600), -- Max 100MB
    CONSTRAINT `chk_reels_duration` CHECK (`duration` <= 300) -- Max 5 minutes
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reels/videos';

-- =====================================================
-- 8. VIDEO APPROVAL LOGS TABLE
-- Audit trail for approval/rejection actions
-- =====================================================
CREATE TABLE `oc_video_approval_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reel_id` BIGINT UNSIGNED NOT NULL,
    `admin_id` BIGINT UNSIGNED NOT NULL,
    `action` ENUM('approved', 'rejected') NOT NULL,
    `comments` TEXT DEFAULT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_video_approval_logs_reel_id` (`reel_id`),
    KEY `idx_video_approval_logs_admin_id` (`admin_id`),
    KEY `idx_video_approval_logs_action` (`action`),
    KEY `idx_video_approval_logs_created_at` (`created_at`),
    CONSTRAINT `fk_video_approval_logs_reel_id` FOREIGN KEY (`reel_id`) REFERENCES `oc_reels` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_video_approval_logs_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `oc_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Video approval logs';

-- =====================================================
-- 9. FOLLOWS TABLE
-- User follow relationships
-- =====================================================
CREATE TABLE `oc_follows` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `follower_id` BIGINT UNSIGNED NOT NULL,
    `following_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_follows_unique` (`follower_id`, `following_id`),
    KEY `idx_follows_follower_id` (`follower_id`),
    KEY `idx_follows_following_id` (`following_id`),
    CONSTRAINT `fk_follows_follower_id` FOREIGN KEY (`follower_id`) REFERENCES `oc_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_follows_following_id` FOREIGN KEY (`following_id`) REFERENCES `oc_users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `chk_follows_self_follow` CHECK (`follower_id` != `following_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User follow relationships';

-- =====================================================
-- 10. REEL LIKES TABLE
-- Track likes on reels
-- =====================================================
CREATE TABLE `oc_reel_likes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reel_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_reel_likes_unique` (`reel_id`, `user_id`),
    KEY `idx_reel_likes_reel_id` (`reel_id`),
    KEY `idx_reel_likes_user_id` (`user_id`),
    CONSTRAINT `fk_reel_likes_reel_id` FOREIGN KEY (`reel_id`) REFERENCES `oc_reels` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reel_likes_user_id` FOREIGN KEY (`user_id`) REFERENCES `oc_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Track likes on reels';

-- =====================================================
-- 11. OC SELLERS TABLE
-- Studio platform sellers (linked to oc_vendor)
-- =====================================================
CREATE TABLE `oc_sellers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `vendor_id` BIGINT UNSIGNED NOT NULL COMMENT 'FK to oc_vendor in sagar database',
    `firstname` VARCHAR(100) NOT NULL,
    `lastname` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `telephone` VARCHAR(20) DEFAULT NULL,
    `password_hash` VARCHAR(255) DEFAULT NULL COMMENT 'Bcrypt hashed password',
    `date_added` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `date_modified` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_oc_sellers_email` (`email`(191)),
    UNIQUE KEY `idx_oc_sellers_vendor_id` (`vendor_id`),
    KEY `idx_oc_sellers_date_added` (`date_added`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Studio platform sellers';

-- =====================================================
-- 12. OC INFLUENCERS TABLE
-- Studio platform influencers
-- =====================================================
CREATE TABLE `oc_influencers` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `firstname` VARCHAR(100) NOT NULL,
    `lastname` VARCHAR(100) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `telephone` VARCHAR(20) DEFAULT NULL,
    `platform` VARCHAR(50) NOT NULL COMMENT 'Social media platform',
    `account_link` VARCHAR(500) NOT NULL COMMENT 'Social media account URL',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '1=active, 0=inactive',
    `date_added` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `date_modified` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `idx_oc_influencers_email` (`email`(191)),
    UNIQUE KEY `idx_oc_influencers_account_link` (`account_link`(191)),
    KEY `idx_oc_influencers_platform` (`platform`),
    KEY `idx_oc_influencers_status` (`status`),
    KEY `idx_oc_influencers_date_added` (`date_added`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Studio platform influencers';

-- =====================================================
-- 13. OC INFLUENCER REELS TABLE
-- Reels created by influencers
-- =====================================================
CREATE TABLE `oc_influencer_reels` (
    `reel_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `influencer_id` BIGINT UNSIGNED NOT NULL COMMENT 'FK to oc_influencers',
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `video_url` VARCHAR(500) NOT NULL COMMENT 'Azure blob storage URL',
    `thumbnail` VARCHAR(500) DEFAULT NULL COMMENT 'Azure blob storage URL',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=pending, 1=approved, 2=rejected',
    `date_added` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `date_modified` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`reel_id`),
    KEY `idx_influencer_reels_influencer_id` (`influencer_id`),
    KEY `idx_influencer_reels_status` (`status`),
    KEY `idx_influencer_reels_date_added` (`date_added`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Influencer reels';

-- =====================================================
-- 14. OC SELLER REELS TABLE
-- Reels created by sellers
-- =====================================================
CREATE TABLE `oc_seller_reels` (
    `reel_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `seller_id` BIGINT UNSIGNED NOT NULL COMMENT 'FK to oc_sellers',
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `video_url` VARCHAR(500) NOT NULL COMMENT 'Azure blob storage URL',
    `thumbnail` VARCHAR(500) DEFAULT NULL COMMENT 'Azure blob storage URL',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '0=pending, 1=approved, 2=rejected',
    `date_added` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `date_modified` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`reel_id`),
    KEY `idx_seller_reels_seller_id` (`seller_id`),
    KEY `idx_seller_reels_status` (`status`),
    KEY `idx_seller_reels_date_added` (`date_added`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Seller reels';

-- =====================================================
-- 15. OC INFLUENCER REEL CATEGORY ASSOCIATION TABLE
-- =====================================================
CREATE TABLE `oc_influencer_reel_to_category` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reel_id` BIGINT UNSIGNED NOT NULL,
    `category_id` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_influencer_reel_to_category_reel_id` (`reel_id`),
    KEY `idx_influencer_reel_to_category_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Association table between influencer reels and categories';

-- =====================================================
-- 16. OC SELLER REEL CATEGORY ASSOCIATION TABLE
-- =====================================================
CREATE TABLE `oc_seller_reel_to_category` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reel_id` BIGINT UNSIGNED NOT NULL,
    `category_id` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_seller_reel_to_category_reel_id` (`reel_id`),
    KEY `idx_seller_reel_to_category_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Association table between seller reels and categories';

-- =====================================================
-- 17. OC INFLUENCER REEL PRODUCT ASSOCIATION TABLE
-- =====================================================
CREATE TABLE `oc_influencer_reel_product` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reel_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_influencer_reel_product_reel_id` (`reel_id`),
    KEY `idx_influencer_reel_product_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Association table between influencer reels and products';

-- =====================================================
-- 18. OC SELLER REEL PRODUCT ASSOCIATION TABLE
-- =====================================================
CREATE TABLE `oc_seller_reel_product` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reel_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_seller_reel_product_reel_id` (`reel_id`),
    KEY `idx_seller_reel_product_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Association table between seller reels and products';

-- =====================================================
-- 19. OC REEL PRODUCTS TABLE
-- Association table between reels and products
-- =====================================================
CREATE TABLE `oc_reel_products` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reel_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_reel_products_reel_id` (`reel_id`),
    KEY `idx_reel_products_product_id` (`product_id`),
    CONSTRAINT `fk_reel_products_reel_id` FOREIGN KEY (`reel_id`) REFERENCES `oc_reels` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reel_products_product_id` FOREIGN KEY (`product_id`) REFERENCES `oc_products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Association table between reels and products';

-- =====================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX `idx_reels_uploader_status` ON `oc_reels` (`uploader_id`, `status`);
CREATE INDEX `idx_reels_brand_status` ON `oc_reels` (`brand_id`, `status`);
CREATE INDEX `idx_reels_product_status` ON `oc_reels` (`product_id`, `status`);
CREATE INDEX `idx_reels_engagement` ON `oc_reels` (`views`, `likes`, `impressions`);
CREATE INDEX `idx_reels_status_approved_at` ON `oc_reels` (`status`, `approved_at`);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC COUNT UPDATES
-- =====================================================

DELIMITER //

-- Trigger to update profile post_count when reel is created
CREATE TRIGGER `trg_reels_insert_post_count`
AFTER INSERT ON `oc_reels`
FOR EACH ROW
BEGIN
    UPDATE `oc_profiles` 
    SET `post_count` = (
        SELECT COUNT(*) 
        FROM `oc_reels` 
        WHERE `uploader_id` = NEW.`uploader_id` 
        AND `status` = 'approved'
    )
    WHERE `user_id` = NEW.`uploader_id`;
END//

-- Trigger to update profile post_count when reel status changes
CREATE TRIGGER `trg_reels_update_post_count`
AFTER UPDATE ON `oc_reels`
FOR EACH ROW
BEGIN
    IF OLD.`status` != NEW.`status` THEN
        UPDATE `oc_profiles` 
        SET `post_count` = (
            SELECT COUNT(*) 
            FROM `oc_reels` 
            WHERE `uploader_id` = NEW.`uploader_id` 
            AND `status` = 'approved'
        )
        WHERE `user_id` = NEW.`uploader_id`;
    END IF;
END//

-- Trigger to update follower_count when follow is created
CREATE TRIGGER `trg_follows_insert_follower_count`
AFTER INSERT ON `oc_follows`
FOR EACH ROW
BEGIN
    UPDATE `oc_profiles` 
    SET `follower_count` = (
        SELECT COUNT(*) 
        FROM `oc_follows` 
        WHERE `following_id` = NEW.`following_id`
    )
    WHERE `user_id` = NEW.`following_id`;
    
    UPDATE `oc_profiles` 
    SET `following_count` = (
        SELECT COUNT(*) 
        FROM `oc_follows` 
        WHERE `follower_id` = NEW.`follower_id`
    )
    WHERE `user_id` = NEW.`follower_id`;
END//

-- Trigger to update follower_count when follow is deleted
CREATE TRIGGER `trg_follows_delete_follower_count`
AFTER DELETE ON `oc_follows`
FOR EACH ROW
BEGIN
    UPDATE `oc_profiles` 
    SET `follower_count` = (
        SELECT COUNT(*) 
        FROM `oc_follows` 
        WHERE `following_id` = OLD.`following_id`
    )
    WHERE `user_id` = OLD.`following_id`;
    
    UPDATE `oc_profiles` 
    SET `following_count` = (
        SELECT COUNT(*) 
        FROM `oc_follows` 
        WHERE `follower_id` = OLD.`follower_id`
    )
    WHERE `user_id` = OLD.`follower_id`;
END//

-- Trigger to update reel likes count when like is added
CREATE TRIGGER `trg_reel_likes_insert`
AFTER INSERT ON `oc_reel_likes`
FOR EACH ROW
BEGIN
    UPDATE `oc_influencer_reels` 
    SET `likes` = (
        SELECT COUNT(*) 
        FROM `oc_reel_likes` 
        WHERE `reel_id` = NEW.`reel_id`
    )
    WHERE `reel_id` = NEW.`reel_id`;
    
    UPDATE `oc_seller_reels` 
    SET `likes` = (
        SELECT COUNT(*) 
        FROM `oc_reel_likes` 
        WHERE `reel_id` = NEW.`reel_id`
    )
    WHERE `reel_id` = NEW.`reel_id`;
END//

-- Trigger to update reel likes count when like is removed
CREATE TRIGGER `trg_reel_likes_delete`
AFTER DELETE ON `oc_reel_likes`
FOR EACH ROW
BEGIN
    UPDATE `oc_influencer_reels` 
    SET `likes` = (
        SELECT COUNT(*) 
        FROM `oc_reel_likes` 
        WHERE `reel_id` = OLD.`reel_id`
    )
    WHERE `reel_id` = OLD.`reel_id`;
    
    UPDATE `oc_seller_reels` 
    SET `likes` = (
        SELECT COUNT(*) 
        FROM `oc_reel_likes` 
        WHERE `reel_id` = OLD.`reel_id`
    )
    WHERE `reel_id` = OLD.`reel_id`;
END//

DELIMITER ;

-- =====================================================
-- INSERT DEFAULT DATA (SEED DATA)
-- =====================================================

-- 1. INSERT DEFAULT CATEGORIES
INSERT INTO `oc_categories` (`name`, `slug`, `description`, `icon`, `is_active`, `sort_order`) VALUES
('Fashion & Style', 'fashion-style', 'Fashion trends, styling tips, and outfit ideas', 'shirt', TRUE, 1),
('Beauty & Makeup', 'beauty-makeup', 'Makeup tutorials, skincare routines, and beauty tips', 'sparkles', TRUE, 2),
('Food & Cooking', 'food-cooking', 'Recipes, cooking tutorials, and food reviews', 'utensils', TRUE, 3),
('Fitness & Health', 'fitness-health', 'Workout routines, health tips, and wellness content', 'dumbbell', TRUE, 4),
('Travel & Adventure', 'travel-adventure', 'Travel vlogs, destination guides, and adventure content', 'map-pin', TRUE, 5),
('Technology & Gadgets', 'technology-gadgets', 'Tech reviews, gadget unboxings, and tech tips', 'smartphone', TRUE, 6),
('Entertainment & Comedy', 'entertainment-comedy', 'Funny videos, skits, and entertainment content', 'laugh', TRUE, 7),
('Education & Learning', 'education-learning', 'Educational content, tutorials, and learning tips', 'book', TRUE, 8),
('Home & Decor', 'home-decor', 'Home improvement, interior design, and decor ideas', 'home', TRUE, 9),
('Lifestyle & Daily Life', 'lifestyle-daily', 'Day in the life, lifestyle tips, and daily routines', 'heart', TRUE, 10),
('Music & Dance', 'music-dance', 'Music videos, dance routines, and musical content', 'music', TRUE, 11),
('Sports & Games', 'sports-games', 'Sports highlights, gaming content, and athletic activities', 'trophy', TRUE, 12),
('Pets & Animals', 'pets-animals', 'Pet content, animal videos, and pet care tips', 'dog', TRUE, 13),
('Business & Finance', 'business-finance', 'Business tips, finance advice, and entrepreneurship', 'briefcase', TRUE, 14),
('Art & Creativity', 'art-creativity', 'Art tutorials, creative projects, and artistic content', 'palette', TRUE, 15);

-- 2. INSERT SAMPLE ADMIN USER
-- Password: Admin@123 (bcrypt hash)
INSERT INTO `oc_users` (`email`, `password_hash`, `role`, `first_name`, `last_name`, `phone`, `is_active`, `email_verified_at`) VALUES
('admin@reelsmanagement.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'Admin', 'User', '+1234567890', TRUE, NOW());

-- Create profile for admin user
INSERT INTO `oc_profiles` (`user_id`, `username`, `bio`, `follower_count`, `following_count`, `post_count`) VALUES
(1, 'admin', 'System Administrator', 0, 0, 0);

-- 3. INSERT SAMPLE BRANDS (Optional - for testing)
INSERT INTO `oc_brands` (`name`, `slug`, `description`, `website_url`, `is_active`) VALUES
('Fashion Forward', 'fashion-forward', 'Leading fashion brand for modern lifestyle', 'https://fashionforward.com', TRUE),
('Tech Innovations', 'tech-innovations', 'Cutting-edge technology and gadgets', 'https://techinnovations.com', TRUE),
('Beauty Essentials', 'beauty-essentials', 'Premium beauty and skincare products', 'https://beautyessentials.com', TRUE),
('FitLife', 'fitlife', 'Fitness equipment and wellness products', 'https://fitlife.com', TRUE),
('Home Decor Plus', 'home-decor-plus', 'Stylish home decor and furniture', 'https://homedecorplus.com', TRUE);

-- 4. INSERT SAMPLE PRODUCTS (Optional - for testing)
INSERT INTO `oc_products` (`brand_id`, `name`, `slug`, `description`, `sku`, `price`, `is_active`) VALUES
(1, 'Classic White T-Shirt', 'classic-white-tshirt', 'Premium cotton white t-shirt', 'FF-TS-001', 29.99, TRUE),
(1, 'Denim Jeans', 'denim-jeans', 'Classic fit denim jeans', 'FF-JE-002', 79.99, TRUE),
(2, 'Smart Watch Pro', 'smart-watch-pro', 'Advanced smartwatch with health tracking', 'TI-SW-001', 299.99, TRUE),
(2, 'Wireless Earbuds', 'wireless-earbuds', 'Premium wireless earbuds with noise cancellation', 'TI-WE-002', 149.99, TRUE),
(3, 'Hydrating Face Serum', 'hydrating-face-serum', 'Deep hydrating serum for all skin types', 'BE-FS-001', 49.99, TRUE),
(4, 'Yoga Mat Premium', 'yoga-mat-premium', 'Non-slip premium yoga mat', 'FL-YM-001', 39.99, TRUE),
(5, 'Modern Wall Art Set', 'modern-wall-art-set', 'Contemporary wall art collection', 'HD-WA-001', 89.99, TRUE);

-- 5. INSERT SAMPLE PRODUCT VARIANTS (Optional - for testing)
INSERT INTO `oc_product_variants` (`product_id`, `variant_name`, `variant_value`, `sku_suffix`, `additional_price`, `stock_quantity`) VALUES
(1, 'Size', 'Small', 'S', 0.00, 100),
(1, 'Size', 'Medium', 'M', 0.00, 150),
(1, 'Size', 'Large', 'L', 0.00, 120),
(1, 'Size', 'X-Large', 'XL', 5.00, 80),
(2, 'Size', '28', '28', 0.00, 50),
(2, 'Size', '30', '30', 0.00, 60),
(2, 'Size', '32', '32', 0.00, 70),
(2, 'Size', '34', '34', 0.00, 55),
(3, 'Color', 'Black', 'BLK', 0.00, 200),
(3, 'Color', 'Silver', 'SLV', 0.00, 150),
(3, 'Color', 'Gold', 'GLD', 20.00, 100);