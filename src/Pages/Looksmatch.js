import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  Heading,
  Grid,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLooksmatch } from '../hooks/useLooksmatch';
import { useUserData } from '../hooks/useUserData';
import { useInfluencerBadges } from '../hooks/useInfluencerBadges';
import TopBar from '../Components/TopBar';
import FeatureRatingComparison from '../Components/FeatureRatingComparison';
import Avatar from '@mui/material/Avatar';
import Badges from '../Components/Badges';
import '../App.css';

const Looksmatch = () => {
  // All hooks must be called at the top level
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fetchTriggered, setFetchTriggered] = useState(false);
  const { looksmatch, loading } = useLooksmatch(fetchTriggered ? user?.uid : null);
  const { userData: currentUserData, loading: currentUserLoading } = useUserData();
  const { earnedBadges } = useInfluencerBadges(looksmatch?.id || null);
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Compute feature comparison data with useMemo at the top level
  const chartData = useMemo(() => {
    if (!currentUserData || !looksmatch) return [];
    const featureMapping = {
      Eyes: 'eyesRating',
      Smile: 'smileRating',
      Jawline: 'facialRating',
      Hair: 'hairRating',
      Body: 'bodyRating',
    };
    return Object.entries(featureMapping).map(([feature, field]) => {
      const userTimesRanked = currentUserData.timesRanked || 0;
      const looksmatchTimesRanked = looksmatch.timesRanked || 0;
      const userAvg = userTimesRanked > 0 ? (currentUserData[field] || 0) / userTimesRanked : 0;
      const looksmatchAvg = looksmatchTimesRanked > 0 ? (looksmatch[field] || 0) / looksmatchTimesRanked : 0;
      return { feature, user: userAvg, entity: looksmatchAvg };
    });
  }, [currentUserData, looksmatch]);

 

  // Handler to trigger looksmatch fetch
  const handleFindLooksmatch = () => {
    setFetchTriggered(true);
  };

  return (
    <Box minH="100vh" bg="gray.50">
      <TopBar />
      <VStack spacing={6} maxW="600px" mx="auto" mt={8} p={4}>
        <Heading as="h1" size="xl" textAlign="center">
          Find Your Looksmatch
        </Heading>
        <Text fontSize="md" color="gray.600" textAlign="center">
          Discover the person closest to your rating from the opposite gender.
        </Text>

        <Button
          colorScheme="teal"
          size="lg"
          onClick={handleFindLooksmatch}
          isDisabled={fetchTriggered && loading}
        >
          {fetchTriggered && loading ? 'Finding...' : 'Find My Looksmatch'}
        </Button>

        {fetchTriggered && (
          <>
            {loading || currentUserLoading ? (
              <Text>Loading...</Text>
            ) : looksmatch ? (
              <VStack spacing={4} w="full">
                <Text fontSize="lg" fontWeight="bold">
                  This is your looksmatch!
                </Text>
                <Box w="full" bg="white" borderRadius="md" boxShadow="sm" p={4}>
                  {/* Header with Gradient and Avatar */}
                  <Box
                    h="100px"
                    bgGradient="linear(to-r, blue.500, cyan.400)"
                    position="relative"
                    borderTopRadius="md"
                  >
                    <Box position="absolute" bottom="-40px" left="50%" transform="translateX(-50%)">
                      <Avatar
                        src={looksmatch.photo_url}
                        alt={looksmatch.name}
                        sx={{ width: 80, height: 80, border: '2px solid white' }}
                      />
                    </Box>
                  </Box>

                  {/* Name and Badges */}
                  <VStack mt={12} spacing={2}>
                    <Heading as="h2" size="lg">
                      {looksmatch.name || 'Unknown'}
                    </Heading>
                    {looksmatch.collection === 'streamers' && earnedBadges?.length > 0 && (
                      <Badges earnedBadges={earnedBadges} />
                    )}
                  </VStack>

                  {/* Stats Grid */}
                  <Grid templateColumns="repeat(2, 1fr)" gap={4} mt={4}>
                    <VStack>
                      <Text fontSize="xl" fontWeight="bold">
                        {looksmatch.rating.toFixed(2)}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Average Rating
                      </Text>
                    </VStack>
                    <VStack>
                      <Text fontSize="xl" fontWeight="bold">
                        {looksmatch.timesRanked || 0}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        Total Ratings
                      </Text>
                    </VStack>
                  </Grid>

                  {/* Feature Comparison */}
                  {chartData.length > 0 && (
                    <Box mt={6}>
                      <FeatureRatingComparison
                        chartData={chartData}
                        entityName={looksmatch.name || 'Looksmatch'}
                        isMobile={isMobile}
                      />
                    </Box>
                  )}
                </Box>
              </VStack>
            ) : (
              <Text>No looksmatch found.</Text>
            )}
          </>
        )}
      </VStack>
    </Box>
  );
};

export default Looksmatch;