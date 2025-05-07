import React from 'react';
import { Box, Typography, CircularProgress, keyframes } from '@mui/material';
import TopBar from './TopBar';

const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const LoadingIndicator = ({ progress, message, subMessage }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        background: `
          radial-gradient(circle at center, #0d112c 0%, #66043e 100%),
          linear-gradient(45deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))
        `,
        overflow: 'hidden',
        animation: `${fadeIn} 0.5s ease-out`,
        zIndex: 9999,
      }}
    >
      <TopBar />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress
          variant="determinate"
          value={progress}
          size={80}
          thickness={4}
          sx={{
            color: '#09c2f7',
            mb: 3,
            animation: `${neonGlow} 2s infinite`,
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            },
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: '#fff',
            mb: 1,
            textAlign: 'center',
            fontSize: { base: '1rem', md: '1.25rem' },
            textShadow: '0 0 10px rgba(9, 194, 247, 0.3)',
            fontWeight: 600,
          }}
        >
          {message}
        </Typography>
        {subMessage && (
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              fontSize: { base: '0.875rem', md: '1rem' },
              textShadow: '0 0 5px rgba(9, 194, 247, 0.2)',
            }}
          >
            {subMessage}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LoadingIndicator; 