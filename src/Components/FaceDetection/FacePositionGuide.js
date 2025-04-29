import React from 'react';
import { Box, Typography } from '@mui/material';

const FacePositionGuide = () => {
  return (
    <Box
      position="absolute"
      bottom="20%"
      left="50%"
      transform="translateX(-50%)"
      zIndex={3}
      textAlign="center"
      bg="rgba(0,0,0,0.7)"
      p={{ base: 2, md: 3 }}
      borderRadius="lg"
      w={{ base: '90%', md: 'auto' }}
    >
      <Typography 
        variant="body1" 
        color="white"
        sx={{ fontSize: { base: '0.875rem', md: '1rem' } }}
      >
        Please position your face in the frame
      </Typography>
    </Box>
  );
};

export default FacePositionGuide; 