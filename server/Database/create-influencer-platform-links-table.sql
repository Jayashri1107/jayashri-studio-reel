-- =====================================================
-- INFLUENCER PLATFORM LINKS TABLE
-- Store multiple social media platform links for influencers
-- =====================================================

USE `ipshopy_reels`;

-- =====================================================
-- DROP EXISTING TABLE IF IT EXISTS
-- =====================================================
DROP TABLE IF EXISTS `influencer_platform_links`;

-- =====================================================
-- CREATE INFLUENCER PLATFORM LINKS TABLE
-- =====================================================
CREATE TABLE `influencer_platform_links` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `influencer_id` BIGINT UNSIGNED NOT NULL COMMENT 'FK to oc_influencers',
    `platform` VARCHAR(50) NOT NULL COMMENT 'Social media platform',
    `account_link` VARCHAR(500) NOT NULL COMMENT 'Social media account URL',
    `date_added` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `date_modified` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_influencer_platform_links_influencer_id` (`influencer_id`),
    KEY `idx_influencer_platform_links_platform` (`platform`),
    CONSTRAINT `fk_influencer_platform_links_influencer_id` FOREIGN KEY (`influencer_id`) REFERENCES `oc_influencers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Influencer social media platform links';

