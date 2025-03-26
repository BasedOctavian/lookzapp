import { Box, Stack, Text } from '@chakra-ui/react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box bg="white" py={4}>
      <Stack direction={{ base: 'column', md: 'row' }} justify="center" align="center" spacing={4}>
        <Text fontSize="sm" color="gray.500">
          © {currentYear} Lookzapp. All rights reserved.
        </Text>
        <Text fontSize="sm" color="gray.500">
          Operated by Octavian
        </Text>
      </Stack>
    </Box>
  );
};

export default Footer;