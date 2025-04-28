import React from 'react';
import { Box, Typography } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { keyframes } from '@mui/system';

const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const LoadingIndicator = ({ progress, message, subMessage }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: 'rgba(13, 17, 44, 0.85)',
        backdropFilter: 'blur(8px)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 4,
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          animation: `${neonGlow} 2s infinite, ${pulse} 2s infinite`,
          boxShadow: '0 0 32px rgba(9, 194, 247, 0.2)',
        }}
      >
        <img
          src="/lookzapp trans 2.png"
          alt="LookzApp"
          style={{ width: '60%', filter: 'brightness(0) invert(1)' }}
        />
      </Box>
      <Typography 
        variant="h6" 
        sx={{ 
          color: '#fff',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          fontSize: { base: '1rem', md: '1.25rem' },
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1
        }}
      >
        <CameraAltIcon sx={{ fontSize: 24 }} />
        {message}
      </Typography>
      {subMessage && (
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'rgba(255,255,255,0.7)',
            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            fontSize: { base: '0.875rem', md: '1rem' }
          }}
        >
          {subMessage}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingIndicator; 