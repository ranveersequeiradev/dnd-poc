import { Navigate } from 'react-router-dom';

// This is a dummy authentication check. In a real app, you'd use a proper auth system.
const isAuthenticated = () => {
  return localStorage.getItem('token') !== null;
};

export default function PrivateRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}