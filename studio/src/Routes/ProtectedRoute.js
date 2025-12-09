import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const studioToken = localStorage.getItem('studioToken');
  const studioUser = localStorage.getItem('studioUser');
  
  // Check if user is authenticated
  if (!studioToken || !studioUser) {
    return <Navigate to="/studio" replace />;
  }
  
  try {
    const user = JSON.parse(studioUser);
    if (!user.role) {
      return <Navigate to="/studio" replace />;
    }
  } catch (e) {
    return <Navigate to="/studio" replace />;
  }
  
  return children;
};

export default ProtectedRoute;