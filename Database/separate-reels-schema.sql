-- =====================================================
-- Separate Tables for Influencer and Seller Reels
-- =====================================================

USE `ipshopy_reels`;

-- =====================================================
-- DROP EXISTING TABLES IF THEY EXIST
-- =====================================================
DROP TABLE IF EXISTS `influencer_reel_product`;
DROP TABLE IF EXISTS `seller_reel_product`;
DROP TABLE IF EXISTS `influencer_reel_to_category`;
DROP TABLE IF EXISTS `seller_reel_to_category`;
DROP TABLE IF EXISTS `influencer_reels`;
DROP TABLE IF EXISTS `seller_reels`;

-- =====================================================
-- INFLUENCER REELS TABLE
-- =====================================================
CREATE TABLE `influencer_reels` (
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
-- SELLER REELS TABLE
-- =====================================================
CREATE TABLE `seller_reels` (
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
-- INFLUENCER REEL CATEGORY ASSOCIATION TABLE
-- =====================================================
CREATE TABLE `influencer_reel_to_category` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reel_id` BIGINT UNSIGNED NOT NULL,
    `category_id` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_influencer_reel_to_category_reel_id` (`reel_id`),
    KEY `idx_influencer_reel_to_category_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Association table between influencer reels and categories';

-- =====================================================
-- SELLER REEL CATEGORY ASSOCIATION TABLE
-- =====================================================
CREATE TABLE `seller_reel_to_category` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reel_id` BIGINT UNSIGNED NOT NULL,
    `category_id` INT NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_seller_reel_to_category_reel_id` (`reel_id`),
    KEY `idx_seller_reel_to_category_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Association table between seller reels and categories';

-- =====================================================
-- INFLUENCER REEL PRODUCT ASSOCIATION TABLE
-- =====================================================
CREATE TABLE `influencer_reel_product` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reel_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_influencer_reel_product_reel_id` (`reel_id`),
    KEY `idx_influencer_reel_product_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Association table between influencer reels and products';

-- =====================================================
-- SELLER REEL PRODUCT ASSOCIATION TABLE
-- =====================================================
CREATE TABLE `seller_reel_product` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `reel_id` BIGINT UNSIGNED NOT NULL,
    `product_id` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`id`),
    KEY `idx_seller_reel_product_reel_id` (`reel_id`),
    KEY `idx_seller_reel_product_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Association table between seller reels and products';