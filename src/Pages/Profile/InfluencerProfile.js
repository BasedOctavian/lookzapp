import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useUserData } from '../../hooks/useUserData';
import { useInfluencerRatingData } from '../../hooks/useInfluencerRatingData';
import { useInfluencerComments } from '../../hooks/useInfluencerComments';
import { useTopRatedData } from '../../hooks/useTopRatedData'; // New import for global ranking
import FeatureRatingComparison from '../../Components/FeatureRatingComparison';
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
  List,
  ListItem,
  ListIcon,
  Badge,
  Tooltip,
} from '@chakra-ui/react';
import { FiUsers, FiTrendingUp, FiAward, FiInfo, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import TopBar from '../../Components/TopBar';
import Footer from '../../Components/Footer';
import InfluencerGalleryCircle from '../../Components/InfluencerGalleryCircle';
import Badges from '../../Components/Badges';
import Avatar from '@mui/material/Avatar';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, AreaChart, Area } from 'recharts';
import { useInfluencerDailyRatings } from '../../hooks/useInfluencerDailyRatings';
import { useInfluencerBadges } from '../../hooks/useInfluencerBadges';
import InfluencerTopStats from '../../Components/InfluencerTopStats';
import InfluencerFeatureSpiderChart from '../../Components/InfluencerFeatureSpiderChart'; // New import
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Divider, 
  FormControl, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Typography, 
  Paper,
  Chip,
  List as MuiList,
  ListItem as MuiListItem,
  ListItemIcon,
  ListItemText,
  Box as MuiBox,
  Grid as MuiGrid,
  Stack,
  Card,
  CardContent,
  CardHeader,
  Divider as MuiDivider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import '../../App.css';

// New component for attractiveness analysis
const AttractivenessAnalysis = ({ influencerData }) => {
  if (!influencerData || influencerData.timesRanked === 0) {
    return null;
  }

  // Calculate feature ratings
  const features = [
    { 
      name: 'Eyes', 
      value: (influencerData.eyesRating || 0) / influencerData.timesRanked,
      description: 'Eye attractiveness is often associated with symmetry, clearness, and expressiveness. Studies show that people with clear, bright eyes are perceived as more attractive and trustworthy.',
      tips: [
        'Maintain good eye health with proper rest and nutrition',
        'Use makeup techniques to enhance eye shape and color',
        'Practice good posture to keep eyes open and alert'
      ]
    },
    { 
      name: 'Smile', 
      value: (influencerData.smileRating || 0) / influencerData.timesRanked,
      description: 'A genuine smile is one of the most universally attractive features. Research indicates that people with symmetrical, white teeth and natural smiles are rated as more attractive.',
      tips: [
        'Practice good dental hygiene for a healthy smile',
        'Consider orthodontic treatment if needed for alignment',
        'Learn to smile naturally in photos and videos'
      ]
    },
    { 
      name: 'Jawline', 
      value: (influencerData.facialRating || 0) / influencerData.timesRanked,
      description: 'A defined jawline is often associated with youth, health, and genetic fitness. Studies show that facial symmetry and defined jawlines are cross-culturally attractive features.',
      tips: [
        'Maintain a healthy body fat percentage',
        'Consider facial exercises to tone jaw muscles',
        'Use contouring techniques to enhance jaw definition'
      ]
    },
    { 
      name: 'Hair', 
      value: (influencerData.hairRating || 0) / influencerData.timesRanked,
      description: 'Healthy, well-maintained hair is a strong indicator of overall health and vitality. Research shows that shiny, thick hair is universally attractive across cultures.',
      tips: [
        'Follow a proper hair care routine',
        'Choose styles that complement your face shape',
        'Maintain regular trims for healthy ends'
      ]
    },
    { 
      name: 'Body', 
      value: (influencerData.bodyRating || 0) / influencerData.timesRanked,
      description: 'Body attractiveness is influenced by proportions, posture, and overall health. Studies indicate that people with balanced proportions and good posture are perceived as more attractive.',
      tips: [
        'Maintain a balanced fitness routine',
        'Focus on good posture in daily activities',
        'Wear clothing that flatters your body type'
      ]
    },
  ];

  // Sort features by rating
  const sortedFeatures = [...features].sort((a, b) => b.value - a.value);

  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontFamily: 'Matt Bold' }}>
        Attractiveness Analysis
      </Typography>
      <Typography variant="body1" paragraph sx={{ fontFamily: 'Matt Light' }}>
        Based on {influencerData.timesRanked} ratings, here's a detailed analysis of {influencerData.name}'s attractiveness factors:
      </Typography>
      
      <Accordion defaultExpanded>
        {sortedFeatures.map((feature, index) => (
          <Accordion key={index} sx={{ mb: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ 
                bgcolor: index === 0 ? 'rgba(25, 118, 210, 0.08)' : 'rgba(0, 0, 0, 0.03)',
                borderRadius: 1,
                '&:hover': { 
                  bgcolor: index === 0 ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.05)' 
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                <Typography sx={{ fontFamily: 'Matt Bold', fontWeight: 'bold' }}>
                  {feature.name}
                </Typography>
                <Chip 
                  label={`${feature.value.toFixed(1)} / 2.5`}
                  color={feature.value > 1.5 ? "success" : feature.value > 1.0 ? "primary" : "warning"}
                  size="small"
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={3}>
                <Typography sx={{ fontFamily: 'Matt Light' }}>
                  {feature.description}
                </Typography>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontFamily: 'Matt Bold', fontWeight: 'bold', mb: 1 }}>
                    Improvement Tips:
                  </Typography>
                  <MuiList>
                    {feature.tips.map((tip, i) => (
                      <MuiListItem key={i} disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={tip} sx={{ '& .MuiListItemText-primary': { fontFamily: 'Matt Light' } }} />
                      </MuiListItem>
                    ))}
                  </MuiList>
                </Box>
              </Stack>
            </AccordionDetails>
          </Accordion>
        ))}
      </Accordion>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Matt Bold' }}>
          Scientific Insights
        </Typography>
        <Typography variant="body1" paragraph sx={{ fontFamily: 'Matt Light' }}>
          Attractiveness is influenced by both biological and cultural factors. Research shows that:
        </Typography>
        <MuiList>
          <MuiListItem alignItems="flex-start" sx={{ mb: 1 }}>
            <ListItemIcon sx={{ mt: 0.5 }}>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography component="span" sx={{ fontFamily: 'Matt Light' }}>
                  <Typography component="span" fontWeight="bold">Symmetry</Typography> is a key indicator of genetic health and developmental stability, making symmetrical faces more attractive across cultures.
                </Typography>
              }
            />
          </MuiListItem>
          <MuiListItem alignItems="flex-start" sx={{ mb: 1 }}>
            <ListItemIcon sx={{ mt: 0.5 }}>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography component="span" sx={{ fontFamily: 'Matt Light' }}>
                  <Typography component="span" fontWeight="bold">Averageness</Typography> in facial features is often preferred, as it suggests genetic diversity and reduced risk of harmful mutations.
                </Typography>
              }
            />
          </MuiListItem>
          <MuiListItem alignItems="flex-start" sx={{ mb: 1 }}>
            <ListItemIcon sx={{ mt: 0.5 }}>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography component="span" sx={{ fontFamily: 'Matt Light' }}>
                  <Typography component="span" fontWeight="bold">Youth indicators</Typography> like clear skin, full lips, and high cheekbones are universally attractive as they signal reproductive potential.
                </Typography>
              }
            />
          </MuiListItem>
          <MuiListItem alignItems="flex-start">
            <ListItemIcon sx={{ mt: 0.5 }}>
              <InfoIcon color="primary" />
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography component="span" sx={{ fontFamily: 'Matt Light' }}>
                  <Typography component="span" fontWeight="bold">Personality traits</Typography> like kindness, intelligence, and humor can significantly enhance perceived physical attractiveness.
                </Typography>
              }
            />
          </MuiListItem>
        </MuiList>
      </Box>
    </Paper>
  );
};

// New component for attractiveness trends
const AttractivenessTrends = ({ dailyRatings }) => {
  if (!dailyRatings || dailyRatings.length === 0) {
    return null;
  }

  // Process data for the area chart
  const trendData = dailyRatings.map(rating => ({
    date: rating.date,
    rating: parseFloat(rating.averageRating),
  }));

  // Calculate trend statistics
  const firstRating = trendData[0].rating;
  const lastRating = trendData[trendData.length - 1].rating;
  const ratingChange = lastRating - firstRating;
  const isImproving = ratingChange > 0;
  const percentChange = ((ratingChange / firstRating) * 100).toFixed(1);

  return (
    <Paper elevation={1} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontFamily: 'Matt Bold' }}>
        Attractiveness Trends
      </Typography>
      
      <MuiGrid container spacing={2} sx={{ mb: 3 }}>
        <MuiGrid item xs={6}>
          <Card sx={{ 
            bgcolor: isImproving ? 'rgba(76, 175, 80, 0.08)' : 'rgba(255, 152, 0, 0.08)',
            borderRadius: 2
          }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Matt Light' }}>
                Rating Change
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                {isImproving ? 
                  <TrendingUpIcon color="success" /> : 
                  <TrendingDownIcon color="warning" />
                }
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontFamily: 'Matt Bold',
                    color: isImproving ? 'success.main' : 'warning.main'
                  }}
                >
                  {ratingChange > 0 ? '+' : ''}{ratingChange.toFixed(1)}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </MuiGrid>
        <MuiGrid item xs={6}>
          <Card sx={{ bgcolor: 'rgba(25, 118, 210, 0.08)', borderRadius: 2 }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'Matt Light' }}>
                Percent Change
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                <TrendingUpIcon color="primary" />
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontFamily: 'Matt Bold',
                    color: 'primary.main'
                  }}
                >
                  {isImproving ? '+' : ''}{percentChange}%
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </MuiGrid>
      </MuiGrid>
      
      <Box sx={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trendData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
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
            <RechartsTooltip
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
            <Area
              type="monotone"
              dataKey="rating"
              stroke="#3182ce"
              fill="url(#colorGradient)"
              strokeWidth={3}
            />
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3182ce" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3182ce" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

function InfluencerProfile() {
  const { influencerId } = useParams();
  const { userData: currentUserData, loading: currentUserLoading } = useUserData();
  const { influencerData, rating, loading: ratingLoading } = useInfluencerRatingData(influencerId);
  const { dailyRatings, loading: dailyRatingsLoading } = useInfluencerDailyRatings(influencerId);
  const { earnedBadges, loading: badgesLoading } = useInfluencerBadges(influencerId);
  const { comments, loading: commentsLoading } = useInfluencerComments(influencerId);
  const { data: topRatedData, loading: topRatedLoading, error: topRatedError } = useTopRatedData(); // New hook for global ranking
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const cardBg = 'white';

  // Memoized chart data for feature comparison
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

  // Parsed daily ratings for the chart
  const parsedDailyRatings = dailyRatings.map((rating) => ({
    date: rating.date,
    averageRating: parseFloat(rating.averageRating),
  }));

  // Calculate global rank using top-rated data
  const globalRank = useMemo(() => {
    console.log("topRatedData:", topRatedData);
    if (!topRatedData || topRatedData.length === 0) return 'N/A';
    const ratedData = topRatedData.filter(item => item.totalRatings > 0);
    const sortedData = [...ratedData].sort((a, b) => b.averageRating - a.averageRating);
    const index = sortedData.findIndex(item => item.type === 'streamer' && item.id === influencerId);
    if (index === -1) return 'N/A';
    return `#${index + 1}`;
  }, [topRatedData]);

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
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  let profileContent;
  if (ratingLoading || badgesLoading || currentUserLoading || topRatedLoading) {
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
              { label: 'Global Rank', value: globalRank, color: 'blue.500' }, // Updated with globalRank
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
          
          {/* New Attractiveness Analysis Section */}
          <AttractivenessAnalysis influencerData={influencerData} />
          
          <InfluencerFeatureSpiderChart influencerData={influencerData} />

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

          {/* New Attractiveness Trends Section */}
          <AttractivenessTrends dailyRatings={parsedDailyRatings} />

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
                    <RechartsTooltip
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
                {comments.map((comment) => (
                  <Box key={comment.id} p={4} bg="gray.100" borderRadius="md" w="100%">
                    <HStack spacing={2}>
                      <Avatar size="sm" name={comment.userName} />
                      <Text fontWeight="bold" fontFamily={'Matt Light'}>
                        {comment.userName}
                      </Text>
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
              <Text color="gray.500" fontSize="lg" fontFamily={'Matt Light'}>
                Please log in to comment.
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
        <Flex flex={1} justify="center" p={4}>
          {profileContent}
        </Flex>
      </Flex>
      <Footer />
    </>
  );
}

export default InfluencerProfile;