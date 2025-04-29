import { Box, Stack, Text } from '@chakra-ui/react';
import '../App.css'; 

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box 
      py={4}
      sx={{
        background: 'rgba(13, 17, 44, 0.25)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(250, 14, 164, 0.1)',
      }}
    >
      <Stack direction={{ base: 'column', md: 'row' }} justify="center" align="center" spacing={4}>
        <Text fontSize="sm" color="rgba(255,255,255,0.7)" fontFamily={'Matt Light'}>
          © {currentYear} Lookzapp. All rights reserved.
        </Text>
        <Text fontSize="sm" color="rgba(255,255,255,0.7)" fontFamily={'Matt Light'}>
          Octavian Ideas
        </Text>
      </Stack>
    </Box>
  );
};

export default Footer;