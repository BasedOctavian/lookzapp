// HomeScreen.js
import React, { useEffect, useState } from 'react';
import { Box, Container, VStack, Heading, Icon, Text, SimpleGrid, Button, Spinner } from '@chakra-ui/react';
import { FaVideo, FaStar, FaMapMarkedAlt, FaGamepad, FaEnvelope, FaTrophy, FaEye } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import '../App.css'; 

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
      route: '/two-truths', 
      description: 'Explore and play more games.', 
      colorScheme: 'green' 
    },
    { 
      title: 'Rating', 
      icon: FaTrophy, 
      route: '/top-rated-users', 
      description: `Your rating: ${rating ? rating.toFixed(1) : 'N/A'} | World rank: #TBD`, 
      colorScheme: 'yellow' 
    },
    { 
      title: 'Get Ranked', 
      icon: FaStar, 
      route: '/get-ranked-selection', 
      description: 'See how you stack up against others using photos.', 
      colorScheme: 'blue' 
    },
    { 
      title: 'Guess Location', 
      icon: FaMapMarkedAlt, 
      route: '/geo-call', 
      description: 'Challenge your skills in guessing countries.', 
      colorScheme: 'orange' 
    },
    { 
      title: 'Analyze', 
      icon: FaEye, 
      route: '/analysis', 
      description: 'Analyze your appearance.', 
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
    <>
    <TopBar />
    <Box minH="100vh" bgGradient="linear(to-br, gray.50, blue.100)" py={10} px={5}>
      <Container maxW="container.xl">
        

        <VStack spacing={10} align="center">
         
          <Box 
                    as="img" 
                    src="/lookzapp trans.png" 
                    alt="Lookzapp Logo" 
                    maxH="60px" 
                    cursor="pointer" 
                    onClick={() => navigate('/')} 
                    style={{ objectFit: 'contain', marginLeft: '0px' }}
                  />
          <Text fontSize="xl" color="gray.700" textAlign="center" fontFamily={'Matt Bold'}>
            Welcome, {userName || 'Guest'}! Your current rating is {rating.toFixed(1)}. Select an option below to get started.
          </Text>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full">
            {options.map((option) => (
              <Button
                key={option.title}
                onClick={() => navigate(option.route)}
                aria-label={option.title}
                bg="white"
                p={6}
                borderRadius="lg"
                boxShadow="lg"
                transition="all 0.2s cubic-bezier(.27,.67,.47,1.6)"
                _hover={{ bg: 'gray.50', transform: 'scale(1.02)', boxShadow: 'xl' }}
                textAlign="center"
                w="full"
                h="auto"
              >
                <VStack spacing={4}>
                  <Icon 
                    as={option.icon} 
                    w={10} 
                    h={10} 
                    color={`${option.colorScheme}.500`} 
                  />
                  <Heading as="h3" size="md" color="black" fontFamily={'Matt Bold'}>
                    {option.title}
                  </Heading>
                  <Text fontSize="sm" color="gray.600" textAlign="center" fontFamily={'Matt Light'}>
                    {option.description}
                  </Text>
                </VStack>
              </Button>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
    <Footer />
    </>
  );
}

export default HomeScreen;
