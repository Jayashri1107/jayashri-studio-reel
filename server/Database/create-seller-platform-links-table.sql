-- =====================================================
-- SELLER PLATFORM LINKS TABLE
-- Store multiple social media platform links for sellers
-- =====================================================

USE `ipshopy_reels`;

-- =====================================================
-- DROP EXISTING TABLE IF IT EXISTS
-- =====================================================
DROP TABLE IF EXISTS `seller_platform_links`;

-- =====================================================
-- CREATE SELLER PLATFORM LINKS TABLE
-- =====================================================
CREATE TABLE `seller_platform_links` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `seller_id` BIGINT UNSIGNED NOT NULL COMMENT 'FK to oc_sellers',
    `platform` VARCHAR(50) NOT NULL COMMENT 'Social media platform',
    `account_link` VARCHAR(500) NOT NULL COMMENT 'Social media account URL',
    `date_added` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `date_modified` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_seller_platform_links_seller_id` (`seller_id`),
    KEY `idx_seller_platform_links_platform` (`platform`),
    CONSTRAINT `fk_seller_platform_links_seller_id` FOREIGN KEY (`seller_id`) REFERENCES `oc_sellers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Seller social media platform links';