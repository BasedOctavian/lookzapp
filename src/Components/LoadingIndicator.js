import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

const LoadingIndicator = ({ progress, message, subMessage }) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(13, 17, 44, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 4,
      }}
    >
      <CircularProgress
        variant="determinate"
        value={progress}
        size={80}
        thickness={4}
        sx={{
          color: '#09c2f7',
          mb: 2,
          '& .MuiCircularProgress-circle': {
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
          }}
        >
          {subMessage}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingIndicator; 