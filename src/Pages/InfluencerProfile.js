import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import { useInfluencerRatingData } from '../hooks/useInfluencerRatingData';
import FeatureRatingComparison from '../Components/FeatureRatingComparison';
import {
  Flex,
  Box,
  Heading,
  Text,
  Spinner,
  VStack,
  Icon,
  useBreakpointValue,
  GridItem,
  Grid,
} from '@chakra-ui/react';
import { FiUsers } from 'react-icons/fi';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import InfluencerGalleryCircle from '../Components/InfluencerGalleryCircle';
import Badges from '../Components/Badges';
import Avatar from '@mui/material/Avatar';
import { Divider } from '@mui/material';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useInfluencerDailyRatings } from '../hooks/useInfluencerDailyRatings';
import { useInfluencerBadges } from '../hooks/useInfluencerBadges';

function InfluencerProfile() {
  // Get the influencer ID from the URL parameters
  const { influencerId } = useParams();

  // Fetch authenticated user's data
  const { userData: currentUserData, loading: currentUserLoading } = useUserData();

  // Fetch influencer's rating data
  const { influencerData, rating, loading: ratingLoading } = useInfluencerRatingData(influencerId);

  // Fetch additional influencer data (assumed hooks from the original context)
  const { dailyRatings, loading: dailyRatingsLoading } = useInfluencerDailyRatings(influencerId);
  const { earnedBadges, loading: badgesLoading } = useInfluencerBadges(influencerId);

  // Determine if the view is mobile
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardBg = 'white';

  // Compute chart data for FeatureRatingComparison using useMemo for efficiency
  const chartData = useMemo(() => {
    if (!currentUserData || !influencerData) return [];
    const featureMapping = {
      Eyes: 'eyesRating',
      Smile: 'smileRating',
      Jawline: 'facialRating',
      Hair: 'hairRating',
      Body: 'bodyRating',
    };
    return Object.entries(featureMapping).map(([feature, field]) => {
      const userTimesRanked = currentUserData.timesRanked || 0;
      const influencerTimesRanked = influencerData.timesRanked || 0;
      const userAvg = userTimesRanked > 0 ? (currentUserData[field] || 0) / userTimesRanked : 0;
      const influencerAvg = influencerTimesRanked > 0 ? (influencerData[field] || 0) / influencerTimesRanked : 0;
      return { feature, user: userAvg, entity: influencerAvg };
    });
  }, [currentUserData, influencerData]);

  // Parse dailyRatings to ensure averageRating is a number
  const parsedDailyRatings = dailyRatings.map((rating) => ({
    date: rating.date,
    averageRating: parseFloat(rating.averageRating),
  }));

  // Determine the profile content based on loading states and data availability
  let profileContent;
  if (ratingLoading || badgesLoading || currentUserLoading) {
    profileContent = (
      <VStack spacing={4} py={12}>
        <Spinner size="xl" thickness="3px" />
        <Text fontWeight="medium">Loading profile...</Text>
      </VStack>
    );
  } else if (!influencerData) {
    profileContent = (
      <VStack spacing={4} py={12}>
        <Icon as={FiUsers} boxSize={12} color="gray.400" />
        <Text fontSize="xl" fontWeight="semibold" color="gray.500">
          Influencer not found
        </Text>
      </VStack>
    );
  } else {
    profileContent = (
      <Box
        w="100%"
        maxW={{ base: '100%', md: '6xl' }}
        bg={cardBg}
        borderRadius="2xl"
        boxShadow="lg"
        position="relative"
        overflow="hidden"
        mt={6}
        mx={4}
      >
        {/* Enhanced Profile Header */}
        <Box
          h="160px"
          bgGradient="linear(to-r, blue.500, cyan.400)"
          position="relative"
          borderTopLeftRadius="2xl"
          borderTopRightRadius="2xl"
        >
          <Box
            position="absolute"
            bottom="-80px"
            left="50%"
            transform="translateX(-50%)"
            width={200}
            height={200}
          >
            <Avatar
              alt={influencerData.name}
              src={influencerData.photo_url}
              sx={{
                width: '100%',
                height: '100%',
                border: '4px solid',
                borderColor: cardBg,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            />
            <InfluencerGalleryCircle name={influencerData.name} />
          </Box>
        </Box>

        {/* Profile Content */}
        <VStack spacing={8} pt={24} px={{ base: 4, md: 8 }} pb={8}>
          <VStack spacing={2}>
            <Heading as="h1" size="2xl" fontWeight="extrabold" letterSpacing="tight">
              {influencerData.name}
            </Heading>
            <Badges earnedBadges={earnedBadges} />
          </VStack>

          {/* Stats Grid */}
          <Grid templateColumns="repeat(3, 1fr)" gap={8} w="100%" maxW="600px">
            {[
              { label: 'Global Rank', value: 'N/A', color: 'blue.500' },
              { label: 'Avg Rating', value: rating?.toFixed(1), color: 'purple.500' },
              { label: 'Total Ratings', value: influencerData.timesRanked || 0, color: 'teal.500' },
            ].map((stat) => (
              <GridItem key={stat.label}>
                <VStack spacing={1}>
                  <Text fontSize="3xl" fontWeight="black" color={stat.color}>
                    {stat.value}
                  </Text>
                  <Text fontSize="sm" color="gray.500" textAlign="center" fontWeight="medium">
                    {stat.label}
                  </Text>
                </VStack>
              </GridItem>
            ))}
          </Grid>

          <Divider />

          {/* Feature Rating Comparison Section */}
          {currentUserData && influencerData ? (
            <FeatureRatingComparison
              chartData={chartData}
              entityName={influencerData.name}
              isMobile={isMobile}
            />
          ) : (
            <Text>No comparison data available</Text>
          )}

          <Divider />

          {/* Rating Progress Over Time */}
          <VStack spacing={6} w="100%">
            <Heading size="lg" fontWeight="semibold" alignSelf="start" letterSpacing="tight">
              Rating History
            </Heading>
            {dailyRatingsLoading ? (
              <Spinner size="lg" color="blue.500" thickness="3px" />
            ) : parsedDailyRatings.length > 0 ? (
              <Box w="100%" h="400px">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={parsedDailyRatings}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) =>
                        new Date(date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      }
                      stroke="#718096"
                      tickLine={{ stroke: '#e2e8f0' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis
                      domain={[0, 10]}
                      stroke="#718096"
                      tickLine={{ stroke: '#e2e8f0' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickCount={6}
                    />
                    <Tooltip
                      labelFormatter={(label) =>
                        new Date(label).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      }
                      formatter={(value) => [value.toFixed(1), 'Rating']}
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        padding: '12px',
                      }}
                    />
                    <Line
                      type="linear"
                      dataKey="averageRating"
                      stroke="#3182ce"
                      strokeWidth={3}
                      dot={{ r: 6, fill: '#3182ce', stroke: 'white', strokeWidth: 2 }}
                      activeDot={{ r: 8, fill: '#3182ce', stroke: 'white', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Text color="gray.500" fontSize="lg">
                No rating history available
              </Text>
            )}
          </VStack>
        </VStack>
      </Box>
    );
  }

  // Render the full page layout
  return (
    <>
      <TopBar />
      <Flex direction="column" minH="100vh" bg="gray.50">
        {/* Main Content */}
        <Flex flex={1} justify="center" p={4}>
          {profileContent}
        </Flex>
      </Flex>
      <Footer />
    </>
  );
}

export default InfluencerProfile;