import Dashboard from "../Pages/Dashboard/Dashboard";
import Reels from "../Pages/Dashboard/Reels";
import Upload from "../Pages/Dashboard/Upload";
import StudioLogin from "../Pages/Dashboard/Login";
import StudioProfile from "../Pages/Dashboard/Profile";
import StudioSettings from "../Pages/Dashboard/Settings";
import Apply from "../Pages/Dashboard/Apply";
import SellerDashboard from "../Pages/Seller/SellerDashboard";
import SellerReels from "../Pages/Seller/SellerReels";
import SellerUpload from "../Pages/Seller/SellerUpload";
import SellerProducts from "../Pages/Seller/SellerProducts";
import SellerLogin from "../Pages/Seller/SellerLogin";
import SellerProfile from "../Pages/Seller/SellerProfile";
import SellerReelsAll from "../Pages/Seller/SellerReelsAll";
import SellerProductReels from "../Pages/Seller/SellerProductReels";
import SellerPosts from "../Pages/Seller/Posts";
import SellerFollowers from "../Pages/Seller/Followers";
import SellerViews from "../Pages/Seller/Views";
import SellerEditProfile from "../Pages/Seller/SellerEditProfile";
import InfluencerDashboard from "../Pages/Influencer/InfluencerDashboard";
import InfluencerReels from "../Pages/Influencer/InfluencerReels";
import InfluencerUpload from "../Pages/Influencer/InfluencerUpload";
import InfluencerCampaigns from "../Pages/Influencer/InfluencerCampaigns";
import InfluencerLogin from "../Pages/Influencer/InfluencerLogin";
import InfluencerProfile from "../Pages/Influencer/InfluencerProfile";
import InfluencerEditProfile from "../Pages/Influencer/InfluencerEditProfile";
import InfluencerPosts from "../Pages/Influencer/InfluencerPosts";
import ProductReels from "../Pages/Influencer/ProductReels";
import ReelDetails from "../Pages/Influencer/ReelDetails";
import ProtectedRoute from "./ProtectedRoute";
import ResetPassword from "../Pages/Dashboard/ResetPassword";

const studioRoutes = [
  // Authentication routes
  { path: "/studio/login", element: <StudioLogin /> },
  { path: "/studio/seller/login", element: <SellerLogin /> },
  { path: "/studio/influencer/login", element: <InfluencerLogin /> },
  { path: "/studio/apply", element: <Apply /> },
  { path: "/studio/reset-password", element: <ResetPassword /> },
  
  // General dashboard routes
  { path: "/studio/dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  
  // Seller routes
  { path: "/studio/seller", element: <ProtectedRoute><SellerDashboard /></ProtectedRoute> },
  { path: "/studio/seller/reels", element: <ProtectedRoute><SellerReelsAll /></ProtectedRoute> },
  { path: "/studio/seller/reels/:productId", element: <ProtectedRoute><SellerProductReels /></ProtectedRoute> },
  { path: "/studio/seller/upload", element: <ProtectedRoute><SellerUpload /></ProtectedRoute> },
  { path: "/studio/seller/upload/:id", element: <ProtectedRoute><SellerUpload /></ProtectedRoute> },
  { path: "/studio/seller/products", element: <ProtectedRoute><SellerProducts /></ProtectedRoute> },
  { path: "/studio/seller/profile", element: <ProtectedRoute><SellerProfile /></ProtectedRoute> },
  { path: "/studio/seller/profile/edit", element: <ProtectedRoute><SellerEditProfile /></ProtectedRoute> },
  { path: "/studio/seller/posts", element: <ProtectedRoute><SellerPosts /></ProtectedRoute> },
  { path: "/studio/seller/followers", element: <ProtectedRoute><SellerFollowers /></ProtectedRoute> },
  { path: "/studio/seller/views", element: <ProtectedRoute><SellerViews /></ProtectedRoute> },
  
  // Influencer routes
  { path: "/studio/influencer", element: <ProtectedRoute><InfluencerDashboard /></ProtectedRoute> },
  { path: "/studio/influencer/reels", element: <ProtectedRoute><InfluencerReels /></ProtectedRoute> },
  { path: "/studio/influencer/product/:productId/reels", element: <ProtectedRoute><ProductReels /></ProtectedRoute> },
  { path: "/studio/influencer/upload", element: <ProtectedRoute><InfluencerUpload /></ProtectedRoute> },
  { path: "/studio/influencer/upload/:id", element: <ProtectedRoute><InfluencerUpload /></ProtectedRoute> },
  { path: "/studio/influencer/upload/:id/details", element: <ProtectedRoute><ReelDetails /></ProtectedRoute> },
  { path: "/studio/influencer/campaigns", element: <ProtectedRoute><InfluencerCampaigns /></ProtectedRoute> },
  { path: "/studio/influencer/profile", element: <ProtectedRoute><InfluencerProfile /></ProtectedRoute> },
  { path: "/studio/influencer/edit-profile", element: <ProtectedRoute><InfluencerEditProfile /></ProtectedRoute> },
  { path: "/studio/influencer/posts", element: <ProtectedRoute><InfluencerPosts /></ProtectedRoute> },
];

export default studioRoutes;
