import { useParams, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
import {
  Flex,
  Box,
  Heading,
  Text,
  Spinner,
  HStack,
  Button,
  Container,
  VStack,
  Icon,
  Grid,
  GridItem,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useInfluencerRatingData } from '../hooks/useInfluencerRatingData';
import { useInfluencerDailyRatings } from '../hooks/useInfluencerDailyRatings';
import { CircularProgress } from '@chakra-ui/progress';
import { FiAward, FiLogOut, FiStar, FiUsers } from 'react-icons/fi';
import Avatar from '@mui/material/Avatar';
import { Divider } from '@mui/material';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useEffect } from 'react';
import TopBar from '../Components/TopBar';

function InfluencerProfile() {
  const { influencerId } = useParams();
  const navigate = useNavigate();
  const { influencerData, rating, loading } = useInfluencerRatingData(influencerId);
  const { dailyRatings, loading: dailyRatingsLoading } = useInfluencerDailyRatings(influencerId);
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardBg = 'white';
  const headerBg = 'rgba(255, 255, 255, 0.8)';
  const featureColors = ['blue.400', 'pink.400', 'purple.400', 'teal.400', 'orange.400'];

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Parse dailyRatings to ensure averageRating is a number
  const parsedDailyRatings = dailyRatings.map((rating) => ({
    date: rating.date,
    averageRating: parseFloat(rating.averageRating),
  }));

  // Debugging logs
  useEffect(() => {
    if (influencerData) {
      console.log('Influencer data:', influencerData);
    }
  }, [influencerData]);

  useEffect(() => {
    console.log('dailyRatings:', dailyRatings);
  }, [dailyRatings]);

  let profileContent;
  if (loading) {
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
    const {
      eyesRating = 0,
      smileRating = 0,
      facialRating = 0,
      hairRating = 0,
      bodyRating = 0,
    } = influencerData;

    const totalFeatureRating =
      eyesRating + smileRating + facialRating + hairRating + bodyRating;

    let percentages = {
      eyes: totalFeatureRating ? (eyesRating / totalFeatureRating) * 100 : 0,
      smile: totalFeatureRating ? (smileRating / totalFeatureRating) * 100 : 0,
      facial: totalFeatureRating ? (facialRating / totalFeatureRating) * 100 : 0,
      hair: totalFeatureRating ? (hairRating / totalFeatureRating) * 100 : 0,
      body: totalFeatureRating ? (bodyRating / totalFeatureRating) * 100 : 0,
    };

    // Adjust percentages to total 100%
    const totalPercentage = Object.values(percentages).reduce((a, b) => a + b, 0);
    const scale = totalPercentage > 0 ? 100 / totalPercentage : 1;
    Object.keys(percentages).forEach((key) => {
      percentages[key] = Math.round(percentages[key] * scale);
    });

    let adjustedTotal = Object.values(percentages).reduce((a, b) => a + b, 0);
    if (adjustedTotal !== 100) {
      const maxKey = Object.keys(percentages).reduce((a, b) =>
        percentages[a] > percentages[b] ? a : b
      );
      percentages[maxKey] += 100 - adjustedTotal;
    }

    const features = [
      { key: 'eyes', label: 'Eyes', percent: percentages.eyes, icon: FiStar },
      { key: 'smile', label: 'Smile', percent: percentages.smile, icon: FiStar },
      { key: 'facial', label: 'Jawline', percent: percentages.facial, icon: FiStar },
      { key: 'hair', label: 'Hair', percent: percentages.hair, icon: FiStar },
      { key: 'body', label: 'Physique', percent: percentages.body, icon: FiStar },
    ];

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
          <Avatar
            alt={influencerData.name}
            src={influencerData.photo_url}
            sx={{
              width: 200,
              height: 200,
              border: '4px solid',
              borderColor: cardBg,
              position: 'absolute',
              bottom: '-80px',
              left: '50%',
              transform: 'translateX(-50%)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            }}
          />
        </Box>

        {/* Profile Content */}
        <VStack spacing={8} pt={24} px={{ base: 4, md: 8 }} pb={8}>
          <VStack spacing={2}>
            <Heading as="h1" size="2xl" fontWeight="extrabold" letterSpacing="tight">
              {influencerData.name}
            </Heading>
          </VStack>

          {/* Stats Grid */}
          <Grid templateColumns="repeat(3, 1fr)" gap={8} w="100%" maxW="600px">
            {[
              { label: 'Global Rank', value: 'N/A', color: 'blue.500' },
              { label: 'Avg Rating', value: rating?.toFixed(1), color: 'purple.500' },
              { label: 'Total Ratings', value: 'N/A', color: 'teal.500' },
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

          {/* Feature Progress Grid */}
          <VStack spacing={6} w="100%">
            <Heading size="md" fontWeight="medium" alignSelf="start" color="gray.700">
              Feature Breakdown
            </Heading>
            <Grid
              templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' }}
              gap={4}
              w="100%"
              maxW="800px"
            >
              {features.map((feature, index) => (
                <GridItem key={feature.key} textAlign="center">
                  <VStack spacing={2}>
                    <Box position="relative" display="inline-block">
                      <CircularProgress
                        value={feature.percent}
                        color={featureColors[index % featureColors.length]}
                        size="60px"
                        thickness="8px"
                        trackColor="gray.100"
                      />
                      <Text
                        position="absolute"
                        top="50%"
                        left="50%"
                        transform="translate(-50%, -50%)"
                        fontSize="sm"
                        fontWeight="bold"
                        color="gray.700"
                        whiteSpace="nowrap"
                      >
                        {feature.percent}%
                      </Text>
                    </Box>
                    <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                      {feature.label}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {influencerData[`${feature.key}Rating`]?.toFixed(1)} avg
                    </Text>
                  </VStack>
                </GridItem>
              ))}
            </Grid>
          </VStack>

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
                        new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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

  return (
    <>
    <TopBar />
    <Flex direction="column" minH="100vh" bg="gray.50">

      {/* Main Content */}
      <Flex flex={1} justify="center" p={4}>
        {profileContent}
      </Flex>
    </Flex>
    </>
  );
}

export default InfluencerProfile;