import Dashboard from "../Pages/Dashboard/Dashboard";
import Profile from "../Pages/Profile/Profile";
import Settings from "../Pages/Settings/Settings";
import Contacts from "../Pages/Contacts/Contacts";
import Todo from "../Pages/Todo/Todo";
import ManageApps from "../Pages/ManageApps/ManageApps";

// Reel Management Pages
import VideosList from "../Pages/Videos/VideosList";
import VideoApproval from "../Pages/Videos/VideoApproval";
import PendingApprovals from "../Pages/Videos/PendingApprovals";
import VideoUpload from "../Pages/Videos/VideoUpload";

// Management Pages
import SellersList from "../Pages/Sellers/SellersList";
import SellerApprovals from "../Pages/Sellers/SellerApprovals";
import BrandsList from "../Pages/Brands/BrandsList";
import CategoriesList from "../Pages/Categories/CategoriesList";
import AddCategory from "../Pages/Categories/AddCategory";
import EditCategory from "../Pages/Categories/EditCategory";


// New components for our updated structure
import InfluencersList from "../Pages/Influencers/InfluencersList";
import EditInfluencer from "../Pages/Influencers/EditInfluencer";
import InfluencerReels from "../Pages/Influencers/InfluencerReels";
import ViewInfluencerReels from "../Pages/Influencers/ViewInfluencerReels";
import InfluencerApprovals from "../Pages/Influencers/InfluencerApprovals";
import BrandReels from "../Pages/Brands/BrandReels";
import SellerReels from "../Pages/Sellers/SellerReels";
import ViewSellerReels from "../Pages/Sellers/ViewSellerReels";
import AddReel from "../Pages/Sellers/AddReel";
// Removed ViewReel import
import AddBrandReel from "../Pages/Brands/AddBrandReel";
import ViewBrandReel from "../Pages/Brands/ViewBrandReel";
import EditBrandReel from "../Pages/Brands/EditBrandReel";

// User Management Pages
import UsersList from "../Pages/Users/UsersList";
import UserGroups from "../Pages/Users/UserGroups";
import AddUser from "../Pages/Users/AddUser";
import AddUserGroup from "../Pages/Users/AddUserGroup";
import EditUserGroup from "../Pages/Users/EditUserGroup";
import EditUser from "../Pages/Users/EditUser";

// Data Sync Component
import DataSync from "../Pages/Settings/DataSync";

// routes.js
// routes.js
const routes = [
  ////////////////////// Dashboard Routing ///////////////////////////
  { path: "/", element: <Dashboard /> },
  
  ////////////////////// Seller Routing ///////////////////////////
  { path: "/sellers", element: <SellersList /> },
  { path: "/sellers/reels", element: <SellerReels /> },
  { path: "/sellers/reels/view/:sellerId", element: <ViewSellerReels /> },
  { path: "/sellers/reels/add", element: <AddReel /> },
  // Removed ViewReel route
  { path: "/sellers/approvals", element: <SellerApprovals /> },
  
  ////////////////////// Influencer Routing ///////////////////////////
  { path: "/influencers", element: <InfluencersList /> },
  { path: "/influencers/edit/:id", element: <EditInfluencer /> },
  { path: "/influencers/reels", element: <InfluencerReels /> },
  { path: "/influencers/reels/view/:influencerId", element: <ViewInfluencerReels /> },
  { path: "/influencers/approvals", element: <InfluencerApprovals /> },
  
  ////////////////////// Brand Routing ///////////////////////////
  { path: "/brands/reels", element: <BrandReels /> },
  { path: "/brands/reels/add", element: <AddBrandReel /> },
  { path: "/brands/reels/view/:id", element: <ViewBrandReel /> },
  { path: "/brands/reels/edit/:id", element: <EditBrandReel /> },

  ////////////////////// Reel Management Routing ///////////////////////////
  { path: "/videos", element: <VideosList /> },
  { path: "/videos/approval", element: <PendingApprovals /> },
  { path: "/videos/approval/:id", element: <VideoApproval /> },
  { path: "/videos/upload", element: <VideoUpload /> },
  
  ////////////////////// Management Routing ///////////////////////////
  { path: "/categories", element: <CategoriesList /> },
  { path: "/categories/add", element: <AddCategory /> },
  { path: "/categories/edit/:id", element: <EditCategory /> },
  
  ////////////////////// User Management Routing ///////////////////////////
  { path: "/users", element: <UsersList /> },
  { path: "/users/add", element: <AddUser /> },
  { path: "/users/edit/:id", element: <EditUser /> },
  { path: "/users/groups", element: <UserGroups /> },
  { path: "/users/groups/add", element: <AddUserGroup /> },
  { path: "/users/groups/edit/:id", element: <EditUserGroup /> },
  
  ////////////////////// Pages Routing ///////////////////////////
  { path: "/profile", element: <Profile /> },
  { path: "/settings", element: <Settings /> },
  { path: "/settings/data-sync", element: <DataSync /> },
  { path: "/contacts", element: <Contacts /> },
  { path: "/todo", element: <Todo /> },
  { path: "/manage-apps", element: <ManageApps /> },
];

export default routes;