import React from 'react';
import { Box, styled } from '@mui/material';
import { keyframes } from '@emotion/react';
import TopBar from '../TopBar';

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const CyberBackground = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `
    radial-gradient(circle at center, #0d112c 0%, #66043e 100%),
    linear-gradient(45deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))
  `,
  position: 'relative',
  overflow: 'hidden',
  padding: theme.spacing(4),
  '&:before': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: `
      linear-gradient(45deg, 
        rgba(9, 194, 247, 0.05) 0%, 
        rgba(250, 14, 164, 0.05) 50%,
        rgba(9, 194, 247, 0.05) 100%)
    `,
    animation: `${gradientFlow} 12s ease infinite`,
    backgroundSize: '200% 200%',
    opacity: 0.3,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2)
  }
}));

function AuthLayout({ children }) {
  return (
    <CyberBackground>
      <TopBar />
      {children}
    </CyberBackground>
  );
}

export default AuthLayout;