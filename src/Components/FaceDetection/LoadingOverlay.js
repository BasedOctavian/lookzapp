import React from 'react';
import { Box, CircularProgress, Typography, keyframes } from '@mui/material';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

const LoadingOverlay = ({ loadingProgress }) => {
  return (
    <Box
      position="absolute"
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      zIndex={4}
      textAlign="center"
      w="100%"
      h="100%"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bg="rgba(13, 17, 44, 0.85)"
      backdropFilter="blur(16px)"
      animation={`${fadeIn} 0.5s ease-out`}
    >
      <CircularProgress
        value={loadingProgress}
        size={80}
        thickness={4}
        sx={{
          color: '#09c2f7',
          mb: 3,
          animation: `${neonGlow} 2s infinite`,
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#fff',
          mb: 1,
          fontSize: { xs: '1rem', md: '1.25rem' },
          textShadow: '0 0 10px rgba(9, 194, 247, 0.3)',
          fontWeight: 600,
        }}
      >
        Loading Face Detection...
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          color: 'rgba(255,255,255,0.7)',
          fontSize: { xs: '0.875rem', md: '1rem' },
          textShadow: '0 0 5px rgba(9, 194, 247, 0.2)',
        }}
      >
        {loadingProgress < 30 ? 'Initializing...' : 
         loadingProgress < 100 ? 'Loading Model...' : 
         'Almost Ready...'}
      </Typography>
    </Box>
  );
};

export default LoadingOverlay; 