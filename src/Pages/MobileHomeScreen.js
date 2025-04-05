import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { FaVideo, FaTrophy, FaMapMarkedAlt, FaEye, FaGamepad } from 'react-icons/fa';
import { Link } from 'react-router-dom'; // Added import
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import MobileLeaderboard from '../Components/MobileLeaderboard';
import StatsSection from '../Components/StatsSection';
import { useUserData } from '../hooks/useUserData';
import { useTopRatedData } from '../hooks/useTopRatedData';
import '../App.css';

function MobileHomeScreen() {
  const { userData, rating, bestFeature, loading: loadingUser } = useUserData();
  const { data: combinedData, loading: loadingTopRated, error: errorTopRated } = useTopRatedData();
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    if (userData) {
      setUserId(userData.id);
      setUserName(userData.displayName);
    }
  }, [userData]);

  const sortedData = useMemo(() => {
    return combinedData ? [...combinedData].sort((a, b) => b.averageRating - a.averageRating) : [];
  }, [combinedData]);

  const userRanking = useMemo(() => {
    if (!userData || !sortedData.length) return 'N/A';
    const userIndex = sortedData.findIndex(
      (item) => item.id === userData.id && item.type === 'user'
    );
    return userIndex !== -1 ? userIndex + 1 : 'N/A';
  }, [sortedData, userData]);

  const options = [
    {
      title: 'Video Chat',
      icon: FaVideo,
      route: '/video-chat',
      description: 'Rate & chat instantly through live video calls.',
      colorScheme: 'teal',
    },
    {
      title: 'Leaderboard',
      icon: FaTrophy,
      route: '/leaderboard',
      description: `Your rating: ${rating ? rating.toFixed(1) : 'N/A'} | World rank: ${
        typeof userRanking === 'number' ? `#${userRanking}` : 'N/A'
      }`,
      colorScheme: 'yellow',
    },
    {
      title: 'Games',
      icon: FaGamepad,
      route: '/games-selection',
      description: 'Explore different game modes.',
      colorScheme: 'orange',
    },
    {
      title: 'Analyze',
      icon: FaEye,
      route: '/analyze-selection',
      description: 'Analyze your appearance.',
      colorScheme: 'red',
    },
  ];

  if (loadingUser || loadingTopRated) {
    return (
      <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (errorTopRated) {
    console.error('Error loading top-rated data:', errorTopRated);
  }

  return (
    <>
      <TopBar />
      <Box bgGradient="linear(to-br, gray.50, blue.50)" minH="100vh" p={4}>
        <Container maxW="container.md">
          <VStack spacing={8} align="stretch">
            {/* Welcome / User Greeting */}
            <Text
              fontSize="2xl"
              fontWeight="bold"
              color="gray.800"
              fontFamily="Matt Bold"
              textAlign="center"
            >
              Welcome, {userName || 'Guest'}
            </Text>

            {/* Mobile Leaderboard */}
            <MobileLeaderboard />

            {/* Stats Section */}
            <StatsSection rating={rating} bestFeature={bestFeature} ranking={userRanking} />

            {/* Options Section */}
            <VStack spacing={4} w="full">
              {options.map((option) => (
                <Link key={option.title} to={option.route} style={{ textDecoration: 'none', width: '100%' }}>
                  <Box
                    bg={`${option.colorScheme}.500`}
                    color="white"
                    p={4}
                    borderRadius="md"
                    w="full"  // Changed from "100%" to "full" for consistency
                    minH="120px"  // Added minimum height for uniform sizing
                    textAlign="center"
                    cursor="pointer"
                    transition="all 0.3s ease"
                    _hover={{ bg: `${option.colorScheme}.600`, transform: 'scale(1.02)' }}  // Adjusted scale for full-width
                    display="flex"  // Added to control inner layout
                    flexDirection="column"  // Stack content vertically
                    justifyContent="center"  // Center content vertically
                  >
                    <HStack spacing={3} justify="center" align="center" w="full">
                      <Icon as={option.icon} boxSize={6} />
                      <Text fontSize="lg" fontWeight="bold" fontFamily="Matt Bold">
                        {option.title}
                      </Text>
                    </HStack>
                    <Text fontSize="sm" mt={2} px={2}>
                      {option.description}
                    </Text>
                  </Box>
                </Link>
              ))}
            </VStack>
          </VStack>
        </Container>
      </Box>
      <Footer />
    </>
  );
}

export default MobileHomeScreen;