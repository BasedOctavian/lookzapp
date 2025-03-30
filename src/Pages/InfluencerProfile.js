import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUserData } from '../hooks/useUserData';
import { useInfluencerRatingData } from '../hooks/useInfluencerRatingData';
import { useInfluencerComments } from '../hooks/useInfluencerComments'; // New import
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
  HStack,
  Textarea,
  Button,
} from '@chakra-ui/react';
import { FiUsers } from 'react-icons/fi';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import InfluencerGalleryCircle from '../Components/InfluencerGalleryCircle';
import Badges from '../Components/Badges';
import Avatar from '@mui/material/Avatar';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useInfluencerDailyRatings } from '../hooks/useInfluencerDailyRatings';
import { useInfluencerBadges } from '../hooks/useInfluencerBadges';
import InfluencerTopStats from '../Components/InfluencerTopStats';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'; // New imports
import { db } from '../firebase'; // Ensure db is imported
import { Divider, FormControl } from '@mui/material';
import '../App.css'; 

function InfluencerProfile() {
  const { influencerId } = useParams();
  const { userData: currentUserData, loading: currentUserLoading } = useUserData();
  const { influencerData, rating, loading: ratingLoading } = useInfluencerRatingData(influencerId);
  const { dailyRatings, loading: dailyRatingsLoading } = useInfluencerDailyRatings(influencerId);
  const { earnedBadges, loading: badgesLoading } = useInfluencerBadges(influencerId);
  const { comments, loading: commentsLoading } = useInfluencerComments(influencerId); // New hook usage
  const [commentText, setCommentText] = useState(''); // State for comment input
  const [isSubmitting, setIsSubmitting] = useState(false); // State for submission status

  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardBg = 'white';

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

  const parsedDailyRatings = dailyRatings.map((rating) => ({
    date: rating.date,
    averageRating: parseFloat(rating.averageRating),
  }));

  // Function to add a new comment
  const addComment = async () => {
    if (!currentUserData) {
      alert('Please log in to comment.');
      return;
    }
    if (!commentText.trim()) {
      alert('Comment cannot be empty.');
      return;
    }
    setIsSubmitting(true);
    try {
      const commentsRef = collection(db, 'streamers', influencerId, 'comments');
      await addDoc(commentsRef, {
        text: commentText,
        userId: currentUserData.uid,
        userName: currentUserData.displayName,
        timestamp: serverTimestamp(),
      });
      setCommentText(''); // Clear input after submission
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

        <VStack spacing={8} pt={24} px={{ base: 4, md: 8 }} pb={8}>
          <VStack spacing={2}>
            <Heading as="h1" size="2xl" fontWeight="extrabold" letterSpacing="tight" fontFamily={'Matt Bold'}>
              {influencerData.name}
            </Heading>
            <Badges earnedBadges={earnedBadges} />
          </VStack>

          <Grid templateColumns="repeat(3, 1fr)" gap={8} w="100%" maxW="600px">
            {[
              { label: 'Global Rank', value: 'N/A', color: 'blue.500' },
              { label: 'Avg Rating', value: rating?.toFixed(1), color: 'purple.500' },
              { label: 'Total Ratings', value: influencerData.timesRanked || 0, color: 'teal.500' },
            ].map((stat) => (
              <GridItem key={stat.label}>
                <VStack spacing={1}>
                  <Text fontSize="3xl" fontWeight="black" color={stat.color} fontFamily={'Matt Bold'}>
                    {stat.value}
                  </Text>
                  <Text fontSize="sm" color="gray.500" textAlign="center" fontWeight="medium" fontFamily={'Matt Light'}>
                    {stat.label}
                  </Text>
                </VStack>
              </GridItem>
            ))}
          </Grid>

          <InfluencerTopStats influencerData={influencerData} />

          <Divider />

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

          <VStack spacing={6} w="100%">
            <Heading size="lg" fontWeight="semibold" alignSelf="start" letterSpacing="tight" fontFamily={'Matt Bold'}>
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
              <Text color="gray.500" fontSize="lg" fontFamily={'Matt Light'}>
                No rating history available
              </Text>
            )}
          </VStack>

          {/* New Comments Section */}
          <Divider />
          <VStack spacing={6} w="100%">
            <Heading size="lg" fontWeight="semibold" alignSelf="start" letterSpacing="tight" fontFamily={'Matt Bold'}>
              Comments
            </Heading>
            {commentsLoading ? (
              <Spinner size="lg" color="blue.500" thickness="3px" />
            ) : comments.length === 0 ? (
              <Text color="gray.500" fontSize="lg" fontFamily={'Matt Light'}>
                No comments yet
              </Text>
            ) : (
              <VStack spacing={4} align="start" w="100%">
                {comments.map(comment => (
                  <Box key={comment.id} p={4} bg="gray.100" borderRadius="md" w="100%">
                    <HStack spacing={2}>
                      <Avatar size="sm" name={comment.userName} />
                      <Text fontWeight="bold" fontFamily={'Matt Light'}>{comment.userName}</Text>
                      <Text color="gray.500" fontSize="sm" fontFamily={'Matt Light Italic'}>
                        {new Date(comment.timestamp.toDate()).toLocaleString()}
                      </Text>
                    </HStack>
                    <Text mt={2}>{comment.text}</Text>
                  </Box>
                ))}
              </VStack>
            )}
            {currentUserData ? (
              <FormControl>
                <Textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  size="sm"
                  fontFamily={'Matt Light'}
                />
                <Button
                  mt={2}
                  colorScheme="blue"
                  onClick={addComment}
                  isLoading={isSubmitting}
                  loadingText="Submitting"
                  fontFamily={'Matt Bold'}
                >
                  Submit
                </Button>
              </FormControl>
            ) : (
              <Text color="gray.500" fontSize="lg" fontFamily={'Matt Light'}>Please log in to comment.</Text>
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
        <Flex flex={1} justify="center" p={4}>
          {profileContent}
        </Flex>
      </Flex>
      <Footer />
    </>
  );
}

export default InfluencerProfile;