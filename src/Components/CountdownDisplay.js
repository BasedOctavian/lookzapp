import React from 'react';
import { Box, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { fadeIn } from './StyledComponents';

const CountdownDisplay = ({ countdown }) => {
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
    >
      <Typography 
        variant="h1" 
        sx={{ 
          fontSize: '6rem', 
          fontWeight: 800, 
          background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          textShadow: '0 0 20px rgba(9, 194, 247, 0.5)',
          animation: `${fadeIn} 0.5s ease-out`
        }}
      >
        {countdown}
      </Typography>
      {countdown === 0 && (
        <CheckCircleOutlineIcon 
          sx={{ 
            fontSize: 48, 
            color: '#4CAF50',
            filter: 'drop-shadow(0 0 8px rgba(76, 175, 80, 0.3))',
            animation: `${fadeIn} 0.5s ease-out`
          }} 
        />
      )}
    </Box>
  );
};

export default CountdownDisplay; 