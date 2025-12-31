// Permission Constants

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD: 'dashboard',
  
  // Seller Permissions
  SELLER_MANAGE_SELLER: 'seller_manage_seller',
  SELLER_SELLER_REELS: 'seller_seller_reels',
  SELLER_APPROVAL_LIST: 'seller_approval_list',
  
  // Influencer Permissions
  INFLUENCER_MANAGE_INFLUENCER: 'influencer_manage_influencer',
  INFLUENCER_INFLUENCER_REELS: 'influencer_influencer_reels',
  INFLUENCER_APPROVAL_LIST: 'influencer_approval_list',
  
  // Brand Permissions
  BRAND_BRAND_REELS: 'brand_brand_reels',
  
  // Category Permissions
  CATEGORY: 'category',
  
  // User Management Permissions
  USER_MANAGEMENT_USERS: 'user_management_users',
  USER_MANAGEMENT_USER_GROUPS: 'user_management_user_groups'
};

export const PERMISSION_NAMES = {
  // Dashboard
  [PERMISSIONS.DASHBOARD]: 'Dashboard',
  
  // Seller Permissions
  [PERMISSIONS.SELLER_MANAGE_SELLER]: 'Seller - Manage Seller',
  [PERMISSIONS.SELLER_SELLER_REELS]: 'Seller - Seller Reels',
  [PERMISSIONS.SELLER_APPROVAL_LIST]: 'Seller - Approval List',
  
  // Influencer Permissions
  [PERMISSIONS.INFLUENCER_MANAGE_INFLUENCER]: 'Influencer - Manage Influencer',
  [PERMISSIONS.INFLUENCER_INFLUENCER_REELS]: 'Influencer - Influencer Reels',
  [PERMISSIONS.INFLUENCER_APPROVAL_LIST]: 'Influencer - Approval List',
  
  // Brand Permissions
  [PERMISSIONS.BRAND_BRAND_REELS]: 'Brand - Brand Reels',
  
  // Category Permissions
  [PERMISSIONS.CATEGORY]: 'Category',
  
  // User Management Permissions
  [PERMISSIONS.USER_MANAGEMENT_USERS]: 'User Management - Users',
  [PERMISSIONS.USER_MANAGEMENT_USER_GROUPS]: 'User Management - User Groups'
};

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);