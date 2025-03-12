import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  VStack, 
  Heading, 
  Icon, 
  Text, 
  SimpleGrid, 
  Button, 
  Spinner 
} from '@chakra-ui/react';
import { FaVideo, FaStar, FaMapMarkedAlt, FaGamepad, FaEnvelope, FaTrophy } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';

function HomeScreen() {
  const navigate = useNavigate();
  const { userData, rating, loading } = useUserData();
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    if (userData) {
      setUserId(userData.id);
      setUserName(userData.displayName);
    }
  }, [userData]);

  const options = [
    { 
      title: 'Video Chat', 
      icon: FaVideo, 
      route: '/video-call', 
      description: 'Rate instantly through live video calls.', 
      colorScheme: 'teal' 
    },
    { 
      title: 'Other Games', 
      icon: FaGamepad, 
      route: '/other-games', 
      description: 'Explore and play more games.', 
      colorScheme: 'green' 
    },
    { 
      title: 'Rating', 
      icon: FaTrophy, 
      route: '/top-rated-users', 
      description: `Your rating: ${rating ? rating.toFixed(2) : 'N/A'} | World rank: #TBD`, 
      colorScheme: 'yellow' 
    },
    { 
      title: 'Get Ranked', 
      icon: FaStar, 
      route: '/get-ranked', 
      description: 'See how you stack up against others using photos.', 
      colorScheme: 'blue' 
    },
    { 
      title: 'Guess Location', 
      icon: FaMapMarkedAlt, 
      route: '/guess-location', 
      description: 'Challenge your skills in guessing countries.', 
      colorScheme: 'orange' 
    },
    { 
      title: 'Messages', 
      icon: FaEnvelope, 
      route: '/messages', 
      description: 'Check your inbox for new messages.', 
      colorScheme: 'red' 
    },
  ];

  if (loading) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box minH="100vh" bgGradient="linear(to-br, gray.50, blue.100)" py={10} px={5}>
      <Container maxW="container.xl">
        <VStack spacing={10} align="center">
          <Heading 
            as="h1" 
            size="3xl" 
            color="blue.700" 
            textAlign="center" 
            textShadow="1px 1px 2px rgba(0, 0, 0, 0.1)"
          >
            Lookzapp
          </Heading>
          <Text fontSize="xl" color="gray.700" textAlign="center">
            Welcome, {userName || 'Guest'}! Select an option below to get started.
          </Text>
          <Text fontSize="lg" color="gray.600" textAlign="center">
          Your current rating: {rating.toFixed(2)}
          </Text>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={30} w="full">
            {options.map((option) => (
              <Button
                key={option.title}
                onClick={() => navigate(option.route)}
                bg="white"
                p={6}
                borderRadius="lg"
                boxShadow="lg"
                transition="all 0.3s"
                _hover={{ bg: 'gray.50', transform: 'scale(1.05)', boxShadow: 'xl' }}
                textAlign="center"
                w="full"
                h="auto"
              >
                <VStack spacing={4} style={{ marginBottom: '90px' }}>
                  <Icon 
                    as={option.icon} 
                    w={12} 
                    h={12} 
                    color={`${option.colorScheme}.500`} 
                    style={{ marginBottom: '0px', marginTop: '20px' }}
                  />
                  <Heading as="h3" size="md" color="black">
                    {option.title}
                  </Heading>
                  <Text fontSize="sm" color="gray.600">
                    {option.description}
                  </Text>
                </VStack>
              </Button>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}

export default HomeScreen;