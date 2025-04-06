import React from 'react';
import { Box } from '@mui/material';

function AuthLayout({ children }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom right, #1A202C, rgb(66, 71, 76))',
        padding: 4,
      }}
    >
      {children}
    </Box>
  );
}

export default AuthLayout;