import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Text,
  Spinner,
  Grid,
  GridItem,
  Icon,
  Heading,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import '../App.css';
import useVideoStream from '../hooks/useVideoStream';
import ButtonGroup from '../Components/ButtonGroup'; // Adjust path as needed
import Leaderboard from '../Components/Leaderboard'; // Adjust path as needed
import StatsSection from '../Components/StatsSection'; // Adjust path as needed
import { FaVideo, FaTrophy, FaMapMarkedAlt, FaEye } from 'react-icons/fa';
import { Divider } from '@heroui/react';

function HomeScreen() {
  const navigate = useNavigate();
  const { userData, rating, loading } = useUserData();
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const stream = useVideoStream();

  useEffect(() => {
    if (userData) {
      setUserId(userData.id);
      setUserName(userData.displayName);
    }
  }, [userData]);

  // Updated categories array with color schemes
  const categories = [
    {
      key: 'other-users',
      title: 'Other Users',
      emojis: '👥',
      colorScheme: 'blue',
    },
    {
      key: 'influencers',
      title: 'Influencers',
      emojis: '📢',
      colorScheme: 'green',
    },
    {
      key: 'celebs',
      title: 'Celebs',
      emojis: '🎬',
      colorScheme: 'purple',
    },
    {
      key: 'all',
      title: 'All Categories',
      emojis: '⭐',
      colorScheme: 'orange',
    },
  ];

  // Options array remains unchanged
  const options = [
    {
      title: 'Video Chat',
      icon: FaVideo,
      route: '/video-call',
      description: 'Rate instantly through live video calls.',
      colorScheme: 'teal',
    },
    {
      title: 'Rating',
      icon: FaTrophy,
      route: '/top-rated-users',
      description: `Your rating: ${rating ? rating.toFixed(1) : 'N/A'} | World rank: #TBD`,
      colorScheme: 'yellow',
    },
    {
      title: 'Guess Location',
      icon: FaMapMarkedAlt,
      route: '/geo-call',
      description: 'Challenge your skills in guessing countries.',
      colorScheme: 'orange',
    },
    {
      title: 'Analyze',
      icon: FaEye,
      route: '/analysis',
      description: 'Analyze your appearance.',
      colorScheme: 'red',
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
      <Box minH="100vh" bgGradient="linear(to-br, gray.50, blue.50)" py={12} px={5}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="center">
            {/* Leaderboard Component */}
            <Leaderboard />

           

            {/* Grid Layout */}
            <Grid
              templateAreas={{
                base: `"q1" "q2" "q3" "q4"`,
                md: `"q1 q2" "q3 q4"`,
              }}
              gridTemplateRows={{ base: 'repeat(4, auto)', md: '1fr 1fr' }}
              gridTemplateColumns={{ base: '1fr', md: '1fr 1fr' }}
              gap={6}
              w="full"
            >
              {/* Q1: Video Stream */}
              <GridItem area="q1" bg="gray.100" borderRadius="lg" p={4} boxShadow="inner">
                <Box w="full" h="full" display="flex" alignItems="center" justifyContent="center">
                  {stream ? (
                    <video
                      ref={(video) => {
                        if (video) video.srcObject = stream;
                      }}
                      autoPlay
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Icon as={FaVideo} w={20} h={20} color="gray.500" />
                  )}
                </Box>
              </GridItem>

              {/* Q2: Enhanced Get Ranked Selection */}
              <GridItem area="q2" bg="white" borderRadius="lg" p={4} boxShadow="md">
                <VStack spacing={4} align="stretch">
                  <Heading as="h3" size="lg" textAlign="center" fontFamily={'Matt Bold'} color="gray.800">
                    Choose who you want to be ranked against
                  </Heading>
                  <Divider />
                  <Grid templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }} gap={4} h="full">
                    {categories.map((category) => (
                      <Box
                        key={category.key}
                        onClick={() => navigate(`/ranking?category=${category.key}`)}
                        bg={`${category.colorScheme}.500`}
                        color="white"
                        p={4}
                        borderRadius="md"
                        cursor="pointer"
                        transition="all 0.3s ease"
                        _hover={{ bg: `${category.colorScheme}.600`, transform: 'scale(1.05)' }}
                        boxShadow="md"
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        h="full"
                        height={220}
                      >
                        <Text fontSize="4xl">{category.emojis}</Text>
                        <Text fontSize="lg" fontWeight="bold" fontFamily={'Matt Bold'}>{category.title}</Text>
                      </Box>
                    ))}
                  </Grid>
                </VStack>
              </GridItem>

              {/* Q3: Stats Section Component */}
              <GridItem area="q3">
                <StatsSection rating={rating} />
              </GridItem>

              {/* Q4: Button Group Component */}
              <GridItem area="q4">
                <ButtonGroup options={options} />
              </GridItem>
            </Grid>
          </VStack>
        </Container>
      </Box>
      <Footer />
    </>
  );
}

export default HomeScreen;