import React from 'react';
import { Box, Typography } from '@mui/material';
import { fadeIn } from './StyledComponents';

const FaceDetectionOverlay = ({ isFaceDetected, faceDetectedTime }) => {
  return (
    <Box
      position="absolute"
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      zIndex={3}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
      sx={{
        opacity: isFaceDetected ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        animation: isFaceDetected ? `${fadeIn} 0.5s ease-out` : 'none'
      }}
    >
      <Typography 
        variant="h4" 
        sx={{ 
          color: '#fff',
          textShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
          fontWeight: 600
        }}
      >
        Face Detected
      </Typography>
      {faceDetectedTime && (
        <Typography 
          variant="body1" 
          sx={{ 
            color: '#fff',
            textShadow: '0 0 5px rgba(255, 255, 255, 0.3)'
          }}
        >
          Hold position for {Math.ceil((3000 - (Date.now() - faceDetectedTime)) / 1000)}s
        </Typography>
      )}
    </Box>
  );
};

export default FaceDetectionOverlay; 