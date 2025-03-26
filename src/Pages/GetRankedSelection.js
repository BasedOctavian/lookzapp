import React from 'react';
import { Box, Container, VStack, Heading, Button, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';

function GetRankedSelection() {
  const navigate = useNavigate();

  const handleSelection = (category) => {
    navigate(`/ranking?category=${category}`);
  };

  return (
    <>
      <TopBar />
      <Box 
        minH="100vh" 
        bg="gray.100" 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        p={4}
      >
        <Box 
          bg="white" 
          p={8} 
          borderRadius="lg" 
          boxShadow="lg" 
          maxW="lg" 
          w="full"
        >
          <VStack spacing={6} align="stretch">
            <Heading as="h1" size="xl" textAlign="center" color="blue.600">
              Get Ranked
            </Heading>
            <Text fontSize="lg" color="gray.600" textAlign="center">
              Choose who you want to be ranked against:
            </Text>
            <Button 
              variant="solid" 
              colorScheme="blue" 
              size="lg" 
              onClick={() => handleSelection('other-users')}
            >
              Other Users
            </Button>
            <Button 
              variant="solid" 
              colorScheme="blue" 
              size="lg" 
              onClick={() => handleSelection('influencers')}
            >
              Influencers
            </Button>
            <Button 
              variant="solid" 
              colorScheme="blue" 
              size="lg" 
              onClick={() => handleSelection('celebs')}
            >
              Celebs
            </Button>
            <Button 
              variant="solid" 
              colorScheme="blue" 
              size="lg" 
              onClick={() => handleSelection('all')}
            >
              All Categories
            </Button>
          </VStack>
        </Box>
      </Box>
      <Footer />
    </>
  );
}

export default GetRankedSelection;