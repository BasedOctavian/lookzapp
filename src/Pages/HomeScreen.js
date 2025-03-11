import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Container, 
  VStack, 
  Heading, 
  Icon, 
  Text, 
  SimpleGrid, 
} from '@chakra-ui/react';
import { FaVideo, FaStar, FaMapMarkedAlt, FaUser, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';

function HomeScreen() {
  const navigate = useNavigate();
  const { userData, rating, loading } = useUserData();
  const [userId, setUserId] = useState(null);

  const options = [
    { 
      title: 'Video Chat', 
      icon: FaVideo, 
      route: '/video-call', 
      description: 'Connect instantly through live video calls.', 
      colorScheme: 'teal' 
    },
    { 
      title: 'Get Ranked', 
      icon: FaStar, 
      route: '/get-ranked', 
      description: 'See how you stack up against others.', 
      colorScheme: 'blue' 
    },
    { 
      title: 'Guess Location', 
      icon: FaMapMarkedAlt, 
      route: '/guess-location', 
      description: 'Challenge your geography skills.', 
      colorScheme: 'orange' 
    },
    { 
      title: 'Profile', 
      icon: FaUser, 
      route: '/profile/' + userId, 
      description: 'View and edit your personal profile.', 
      colorScheme: 'purple' 
    },
    { 
      title: 'Settings', 
      icon: FaCog, 
      route: '/settings', 
      description: 'Customize your app experience.', 
      colorScheme: 'gray' 
    },
  ];

  useEffect(() => {
    if (userData) {
      setUserId(userData.id);
    }
  }, [userData]);

  return (
    <Box minH="100vh" bgGradient="linear(to-br, gray.50, blue.100)" py={10} px={5}>
      <Container maxW="container.xl">
        <VStack spacing={10}>
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
            Welcome! Select an option below to get started.
          </Text>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} w="full">
            {options.map((option) => (
              <Box
                key={option.title}
                as="button"
                onClick={() => navigate(option.route)}
                bg={'white'}
                p={6}
                borderRadius="lg"
                boxShadow="lg"
                transition="all 0.3s"
                _hover={{ bg: 'gray.50', transform: 'scale(1.02)' }}
                textAlign="center"
              >
                <Icon as={option.icon} w={12} h={12} color={`${option.colorScheme}.500`} mb={4} />
                <Heading as="h3" size="md" mb={2}>
                  {option.title}
                </Heading>
                <Text fontSize="sm" color="gray.600">
                  {option.description}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
}

export default HomeScreen;
