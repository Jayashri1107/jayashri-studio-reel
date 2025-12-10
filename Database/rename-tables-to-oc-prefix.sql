-- =====================================================
-- Rename Tables to Use 'oc_' Prefix
-- This script renames existing tables to use the consistent 'oc_' prefix
-- =====================================================

USE `ipshopy_reels`;

-- =====================================================
-- RENAME TABLES TO ADD 'oc_' PREFIX
-- =====================================================

-- Rename existing tables to use 'oc_' prefix
RENAME TABLE 
    `follows` TO `oc_follows`,
    `video_approval_logs` TO `oc_video_approval_logs`,
    `reels` TO `oc_reels`,
    `product_variants` TO `oc_product_variants`,
    `products` TO `oc_products`,
    `brands` TO `oc_brands`,
    `categories` TO `oc_categories`,
    `profiles` TO `oc_profiles`,
    `users` TO `oc_users`,
    `influencer_reels` TO `oc_influencer_reels`,
    `seller_reels` TO `oc_seller_reels`,
    `influencer_reel_to_category` TO `oc_influencer_reel_to_category`,
    `seller_reel_to_category` TO `oc_seller_reel_to_category`,
    `influencer_reel_product` TO `oc_influencer_reel_product`,
    `seller_reel_product` TO `oc_seller_reel_product`;

-- =====================================================
-- UPDATE FOREIGN KEY CONSTRAINTS
-- Since we're renaming tables, we need to drop and recreate foreign key constraints
-- =====================================================

-- Drop existing foreign key constraints
ALTER TABLE `oc_profiles` DROP FOREIGN KEY `fk_profiles_user_id`;
ALTER TABLE `oc_products` DROP FOREIGN KEY `fk_products_brand_id`;
ALTER TABLE `oc_product_variants` DROP FOREIGN KEY `fk_product_variants_product_id`;
ALTER TABLE `oc_reels` DROP FOREIGN KEY `fk_reels_uploader_id`;
ALTER TABLE `oc_reels` DROP FOREIGN KEY `fk_reels_category_id`;
ALTER TABLE `oc_reels` DROP FOREIGN KEY `fk_reels_product_id`;
ALTER TABLE `oc_reels` DROP FOREIGN KEY `fk_reels_brand_id`;
ALTER TABLE `oc_reels` DROP FOREIGN KEY `fk_reels_approved_by`;
ALTER TABLE `oc_video_approval_logs` DROP FOREIGN KEY `fk_video_approval_logs_reel_id`;
ALTER TABLE `oc_video_approval_logs` DROP FOREIGN KEY `fk_video_approval_logs_admin_id`;
ALTER TABLE `oc_follows` DROP FOREIGN KEY `fk_follows_follower_id`;
ALTER TABLE `oc_follows` DROP FOREIGN KEY `fk_follows_following_id`;
ALTER TABLE `oc_reel_likes` DROP FOREIGN KEY `fk_reel_likes_reel_id`;
ALTER TABLE `oc_reel_likes` DROP FOREIGN KEY `fk_reel_likes_user_id`;

-- Recreate foreign key constraints with updated table names
ALTER TABLE `oc_profiles` 
    ADD CONSTRAINT `fk_profiles_user_id` FOREIGN KEY (`user_id`) REFERENCES `oc_users` (`id`) ON DELETE CASCADE;

ALTER TABLE `oc_products` 
    ADD CONSTRAINT `fk_products_brand_id` FOREIGN KEY (`brand_id`) REFERENCES `oc_brands` (`id`) ON DELETE CASCADE;

ALTER TABLE `oc_product_variants` 
    ADD CONSTRAINT `fk_product_variants_product_id` FOREIGN KEY (`product_id`) REFERENCES `oc_products` (`id`) ON DELETE CASCADE;

ALTER TABLE `oc_reels` 
    ADD CONSTRAINT `fk_reels_uploader_id` FOREIGN KEY (`uploader_id`) REFERENCES `oc_users` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_reels_category_id` FOREIGN KEY (`category_id`) REFERENCES `oc_categories` (`id`) ON DELETE RESTRICT,
    ADD CONSTRAINT `fk_reels_product_id` FOREIGN KEY (`product_id`) REFERENCES `oc_products` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_reels_brand_id` FOREIGN KEY (`brand_id`) REFERENCES `oc_brands` (`id`) ON DELETE SET NULL,
    ADD CONSTRAINT `fk_reels_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `oc_users` (`id`) ON DELETE SET NULL;

ALTER TABLE `oc_video_approval_logs` 
    ADD CONSTRAINT `fk_video_approval_logs_reel_id` FOREIGN KEY (`reel_id`) REFERENCES `oc_reels` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_video_approval_logs_admin_id` FOREIGN KEY (`admin_id`) REFERENCES `oc_users` (`id`) ON DELETE CASCADE;

ALTER TABLE `oc_follows` 
    ADD CONSTRAINT `fk_follows_follower_id` FOREIGN KEY (`follower_id`) REFERENCES `oc_users` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_follows_following_id` FOREIGN KEY (`following_id`) REFERENCES `oc_users` (`id`) ON DELETE CASCADE;

ALTER TABLE `oc_reel_likes` 
    ADD CONSTRAINT `fk_reel_likes_reel_id` FOREIGN KEY (`reel_id`) REFERENCES `oc_reels` (`id`) ON DELETE CASCADE,
    ADD CONSTRAINT `fk_reel_likes_user_id` FOREIGN KEY (`user_id`) REFERENCES `oc_users` (`id`) ON DELETE CASCADE;

-- =====================================================
-- UPDATE TRIGGERS
-- Drop and recreate triggers with updated table names
-- =====================================================

DROP TRIGGER IF EXISTS `trg_reels_insert_post_count`;
DROP TRIGGER IF EXISTS `trg_reels_update_post_count`;
DROP TRIGGER IF EXISTS `trg_follows_insert_follower_count`;
DROP TRIGGER IF EXISTS `trg_follows_delete_follower_count`;
DROP TRIGGER IF EXISTS `trg_reel_likes_insert`;
DROP TRIGGER IF EXISTS `trg_reel_likes_delete`;

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
-- UPDATE INDEXES
-- Recreate indexes with updated table names
-- =====================================================

-- Drop existing indexes
DROP INDEX IF EXISTS `idx_reels_uploader_status` ON `oc_reels`;
DROP INDEX IF EXISTS `idx_reels_brand_status` ON `oc_reels`;
DROP INDEX IF EXISTS `idx_reels_product_status` ON `oc_reels`;
DROP INDEX IF EXISTS `idx_reels_engagement` ON `oc_reels`;
DROP INDEX IF EXISTS `idx_reels_status_approved_at` ON `oc_reels`;

-- Create updated indexes
CREATE INDEX `idx_reels_uploader_status` ON `oc_reels` (`uploader_id`, `status`);
CREATE INDEX `idx_reels_brand_status` ON `oc_reels` (`brand_id`, `status`);
CREATE INDEX `idx_reels_product_status` ON `oc_reels` (`product_id`, `status`);
CREATE INDEX `idx_reels_engagement` ON `oc_reels` (`views`, `likes`, `impressions`);
CREATE INDEX `idx_reels_status_approved_at` ON `oc_reels` (`status`, `approved_at`);