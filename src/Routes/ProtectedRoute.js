import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token || token === '') {
    return <Navigate to="/Login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;

