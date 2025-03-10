import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Box } from '@chakra-ui/react';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Box>Loading...</Box>; // Or replace with a proper loading spinner
  }

  return user ? children : <Navigate to="/signin" />;
}

export default PrivateRoute;