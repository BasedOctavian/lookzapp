import React from 'react';
import { Box, Text } from '@chakra-ui/react';

const CountdownOverlay = ({ countdown }) => {
  return (
    <Box
      position="absolute"
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      zIndex={3}
    >
      <Text
        color="white"
        fontSize={{ base: "4xl", md: "6xl" }}
        fontWeight="bold"
        textShadow="0 2px 4px rgba(0,0,0,0.5)"
        animation={countdown === 0 ? "pulse 0.5s ease-out" : "none"}
        sx={{
          "@keyframes pulse": {
            "0%": { transform: "scale(1)" },
            "50%": { transform: "scale(1.2)" },
            "100%": { transform: "scale(1)" }
          }
        }}
      >
        {countdown}
      </Text>
    </Box>
  );
};

export default CountdownOverlay; 