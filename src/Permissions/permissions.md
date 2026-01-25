# Permission System Documentation

## Overview
This document outlines the permission system used in the application. Permissions are divided into two categories:
1. Access Permissions - Allow users to view/read resources
2. Modification Permissions - Allow users to create/update/delete resources

## Permission List

### Dashboard
- **Permission ID**: 1
- **Name**: Dashboard
- **Description**: Access to the main dashboard

### Seller Permissions
- **Permission ID**: 2
- **Name**: Seller - Manage Seller
- **Description**: Access and modification rights for managing sellers

- **Permission ID**: 3
- **Name**: Seller - Seller Reels
- **Description**: Access and modification rights for seller reels

- **Permission ID**: 4
- **Name**: Seller - Approval List
- **Description**: Access and modification rights for seller approval lists

### Influencer Permissions
- **Permission ID**: 5
- **Name**: Influencer - Manage Influencer
- **Description**: Access and modification rights for managing influencers

- **Permission ID**: 6
- **Name**: Influencer - Influencer Reels
- **Description**: Access and modification rights for influencer reels

- **Permission ID**: 7
- **Name**: Influencer - Approval List
- **Description**: Access and modification rights for influencer approval lists

### Brand Permissions
- **Permission ID**: 8
- **Name**: Brand - Brand Reels
- **Description**: Access and modification rights for brand reels

### Category Permissions
- **Permission ID**: 9
- **Name**: Category
- **Description**: Access and modification rights for categories

### User Management Permissions
- **Permission ID**: 10
- **Name**: User Management - Users
- **Description**: Access and modification rights for managing users

- **Permission ID**: 11
- **Name**: User Management - User Groups
- **Description**: Access and modification rights for managing user groups

## Implementation Notes
- Each user group can have a combination of access and modification permissions
- Access permissions allow viewing/listing resources
- Modification permissions allow creating/updating/deleting resources
- Both access and modification permissions can be assigned independently