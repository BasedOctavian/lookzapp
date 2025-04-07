import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Container,
  VStack,
  Spinner,
  Grid,
  GridItem,
  Icon,
  Text,
  Heading,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import { useTopRatedData } from '../hooks/useTopRatedData';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import '../App.css';
import useVideoStream from '../hooks/useVideoStream';
import ButtonGroup from '../Components/ButtonGroup';
import Leaderboard from '../Components/Leaderboard';
import StatsSection from '../Components/StatsSection';
import DailyRatingProgress from '../Components/Home/DailyRatingProgress'; // Import the component
import { FaVideo, FaTrophy, FaGamepad, FaEye } from 'react-icons/fa';
import { Divider } from '@heroui/react';
import MobileHomeScreen from './MobileHomeScreen';

function HomeScreen() {
  const isMobile = useBreakpointValue({ base: true, md: false });
  const navigate = useNavigate();
  const { userData, rating, bestFeature, loading: loadingUser, timesRanked } = useUserData();
  const { data: combinedData, loading: loadingTopRated, error: errorTopRated } = useTopRatedData();
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const stream = useVideoStream();

  useEffect(() => {
    if (userData) {
      setUserId(userData.id);
      setUserName(userData.displayName);
    }
  }, [userData]);

  const sortedData = useMemo(() => {
    return [...combinedData].sort((a, b) => b.averageRating - a.averageRating);
  }, [combinedData]);

  const userRanking = useMemo(() => {
    if (!userData || !sortedData.length) return 'N/A';
    const userIndex = sortedData.findIndex(
      (item) => item.id === userData.id && item.type === 'user'
    );
    return userIndex !== -1 ? userIndex + 1 : 'N/A';
  }, [sortedData, userData]);

  const categories = [
    { key: 'other-users', title: 'Other Users', emojis: '👥', colorScheme: 'blue' },
    { key: 'influencers', title: 'Influencers', emojis: '📢', colorScheme: 'green' },
    { key: 'celebs', title: 'Celebs', emojis: '🎬', colorScheme: 'purple' },
    { key: 'all', title: 'All Categories', emojis: '⭐', colorScheme: 'orange' },
  ];

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
      title: 'Analysis',
      icon: FaEye,
      route: '/analyze-selection',
      description: 'Analyze your appearance.',
      colorScheme: 'red',
    },
  ];

  if (isMobile) {
    return (
      <MobileHomeScreen
        userName={userName}
        rating={rating}
        userRanking={userRanking}
        options={options}
      />
    );
  }

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
      <Box minH="100vh" bgGradient="linear(to-br, gray.50, blue.50)" py={0} px={5}>
        <Container maxW="container.xl">
          <VStack spacing={8} align="center">
            <Leaderboard />
            <DailyRatingProgress /> {/* Use the imported component */}
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
                        <Text fontSize="lg" fontWeight="bold" fontFamily={'Matt Bold'}>
                          {category.title}
                        </Text>
                      </Box>
                    ))}
                  </Grid>
                </VStack>
              </GridItem>
              <GridItem area="q3">
                <StatsSection rating={rating} bestFeature={bestFeature} ranking={userRanking} timesRanked={timesRanked} />
              </GridItem>
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