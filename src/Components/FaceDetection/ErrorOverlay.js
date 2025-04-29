import React from 'react';
import { Box, Typography, Button } from '@mui/material';

const ErrorOverlay = ({ error, onRetry }) => {
  return (
    <Box
      position="absolute"
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      zIndex={3}
      textAlign="center"
      bg="rgba(0,0,0,0.7)"
      p={{ base: 3, md: 4 }}
      borderRadius="lg"
      w={{ base: '90%', md: 'auto' }}
    >
      <Typography 
        variant="h6" 
        color="white" 
        mb={2}
        sx={{ fontSize: { base: '1rem', md: '1.25rem' } }}
      >
        Camera Error
      </Typography>
      <Typography 
        variant="body1" 
        color="white" 
        mb={3}
        sx={{ fontSize: { base: '0.875rem', md: '1rem' } }}
      >
        {error}
      </Typography>
      <Button
        colorScheme="teal"
        size={{ base: 'sm', md: 'md' }}
        onClick={onRetry}
      >
        Retry
      </Button>
    </Box>
  );
};

export default ErrorOverlay; 