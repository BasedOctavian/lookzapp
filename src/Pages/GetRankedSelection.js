import React from 'react';
import { Box, Container, VStack, Heading, Button, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

function GetRankedSelection() {
  const navigate = useNavigate();

  const handleSelection = (category) => {
    // Navigate to the ranking page with the selected category as a query parameter
    navigate(`/ranking?category=${category}`);
  };

  return (
    <Box minH="100vh" bgGradient="linear(to-br, gray.50, blue.100)" py={10} px={5}>
      <Container maxW="container.md">
        <VStack spacing={8} align="center">
          <Heading as="h1" size="2xl" color="blue.700">
            Get Ranked
          </Heading>
          <Text fontSize="lg" color="gray.700" textAlign="center">
            Choose who you want to be ranked against:
          </Text>
          <Button
            onClick={() => handleSelection('other-users')}
            colorScheme="blue"
            size="lg"
            w="full"
          >
            Other Users
          </Button>
          <Button
            onClick={() => handleSelection('influencers')}
            colorScheme="blue"
            size="lg"
            w="full"
          >
            Influencers
          </Button>
          <Button
            onClick={() => handleSelection('celebs')}
            colorScheme="blue"
            size="lg"
            w="full"
          >
            Celebs
          </Button>
        </VStack>
      </Container>
    </Box>
  );
}

export default GetRankedSelection;