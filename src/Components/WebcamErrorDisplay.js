import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { GradientButton } from './StyledComponents';

const WebcamErrorDisplay = ({ webcamError, onRetry }) => {
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
      <ErrorOutlineIcon 
        sx={{ 
          fontSize: 48, 
          color: 'error.main',
          mb: 2,
          filter: 'drop-shadow(0 0 8px rgba(244, 67, 54, 0.3))'
        }} 
      />
      <Typography 
        variant="h6" 
        color="error"
        mb={2}
        sx={{ 
          fontSize: { base: '1rem', md: '1.25rem' },
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <WarningAmberIcon sx={{ fontSize: 24 }} />
        Camera Error
      </Typography>
      <Typography 
        variant="body1" 
        color="error"
        mb={3}
        sx={{ 
          fontSize: { base: '0.875rem', md: '1rem' },
          textAlign: 'center',
          maxWidth: '80%'
        }}
      >
        {webcamError}
      </Typography>
      <GradientButton
        variant="contained"
        color="primary"
        onClick={onRetry}
      >
        Retry
      </GradientButton>
    </Box>
  );
};

export default WebcamErrorDisplay; 