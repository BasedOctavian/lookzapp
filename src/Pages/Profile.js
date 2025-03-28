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
import { useUserRatingData } from '../hooks/useUserRatingData';
import { useDailyRatings } from '../hooks/useDailyRatings';
import { useUserBadges } from '../hooks/useUserBadges';
import { FiMail, FiAward, FiLogOut, FiStar, FiUsers } from 'react-icons/fi';
import Avatar from '@mui/material/Avatar';
import { Divider } from '@mui/material';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import Badges from '../Components/Badges';
import { useMemo } from 'react';
import { useUserData } from '../hooks/useUserData';
import FeatureRatingComparison from '../Components/FeatureRatingComparison';
import InfluencerTopStats from '../Components/InfluencerTopStats';

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userData, rating, loading } = useUserRatingData(userId);
  const { dailyRatings, loading: dailyRatingsLoading } = useDailyRatings(userId);
  const { earnedBadges, loading: badgesLoading } = useUserBadges(userId);
  const { userData: currentUserData, loading: currentUserLoading } = useUserData();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardBg = 'white';
  const headerBg = 'rgba(255, 255, 255, 0.8)';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Compute chartData for FeatureRatingComparison
  const chartData = useMemo(() => {
    if (!currentUserData || !userData) return [];
    const featureMapping = {
      Eyes: 'eyesRating',
      Smile: 'smileRating',
      Jawline: 'facialRating',
      Hair: 'hairRating',
      Body: 'bodyRating',
    };
    return Object.entries(featureMapping).map(([feature, field]) => {
      const currentUserTimesRanked = currentUserData.timesRanked || 0;
      const profileUserTimesRanked = userData.timesRanked || 0;
      const currentUserAvg = currentUserTimesRanked > 0 ? (currentUserData[field] || 0) / currentUserTimesRanked : 0;
      const profileUserAvg = profileUserTimesRanked > 0 ? (userData[field] || 0) / profileUserTimesRanked : 0;
      return { feature, user: currentUserAvg, entity: profileUserAvg };
    });
  }, [currentUserData, userData]);

  let profileContent;
  if (loading || badgesLoading || currentUserLoading) {
    profileContent = (
      <VStack spacing={4} py={12}>
        <Spinner size="xl" thickness="3px" />
        <Text fontWeight="medium">Loading profile...</Text>
      </VStack>
    );
  } else if (!userData) {
    profileContent = (
      <VStack spacing={4} py={12}>
        <Icon as={FiUsers} boxSize={12} color="gray.400" />
        <Text fontSize="xl" fontWeight="semibold" color="gray.500">
          User not found
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
          <Avatar 
            alt={userData.displayName}
            src={userData.profilePicture}
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
              {userData.displayName}
            </Heading>
            <Text color="gray.600" fontSize="lg" fontWeight="medium">
              @{userData.username || userData.email.split('@')[0]}
            </Text>
          </VStack>

          {/* Badges Component */}
          <Badges earnedBadges={earnedBadges} />

          

          {/* Stats Grid */}
          <Grid templateColumns="repeat(3, 1fr)" gap={8} w="100%" maxW="600px">
            {[
              { label: 'Global Rank', value: 'N/A', color: 'blue.500' },
              { label: 'Avg Rating', value: rating?.toFixed(1), color: 'purple.500' },
              { label: 'Total Ratings', value: userData.timesRanked || 0, color: 'teal.500' },
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

          {/* InfluencerTopStats */}
          <InfluencerTopStats influencerData={userData} />

          <Divider />

          {/* Feature Rating Comparison */}
          <Box w="100%" p={4} bg="white" borderRadius="2xl" boxShadow={{ md: 'xl' }}>
            <FeatureRatingComparison
              chartData={chartData}
              entityName={userData.displayName}
              isMobile={isMobile}
            />
          </Box>

          <Divider />

          {/* Rating Progress Over Time */}
          <VStack spacing={6} w="100%">
            <Heading size="lg" fontWeight="semibold" alignSelf="start" letterSpacing="tight">
              Rating History
            </Heading>
            {dailyRatingsLoading ? (
              <Spinner size="lg" color="blue.500" thickness="3px" />
            ) : dailyRatings.length > 0 ? (
              <Box w="100%" h="400px">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart 
                    data={dailyRatings} 
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                      labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                      dot={{
                        r: 6,
                        fill: '#3182ce',
                        stroke: 'white',
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 8,
                        fill: '#3182ce',
                        stroke: 'white',
                        strokeWidth: 2,
                      }}
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
      <Footer />
    </>
  );
}

export default Profile;