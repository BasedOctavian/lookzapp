import React, { useState, useRef, useEffect, Suspense, lazy, useMemo } from 'react';
import {
  Container,
  Flex,
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Heading,
  Spinner,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { Star } from '@mui/icons-material';
import { useToast } from '@chakra-ui/toast';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useInfluencerRatingData } from '../hooks/useInfluencerRatingData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TopBar from '../Components/TopBar';

const RatingScale = lazy(() => import('../Components/RatingScale'));

// Utility function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function GetRanked() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get('category') || 'Unknown Category';

  const [localStream, setLocalStream] = useState(null);
  const [shuffledInfluencers, setShuffledInfluencers] = useState([]);
  const [influencersList, setInfluencersList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [ratingKey, setRatingKey] = useState(0);
  const [genderFilter, setGenderFilter] = useState('both');

  const localVideoRef = useRef(null);

  const toast = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { userData, rating: localRating, loading: userLoading } = useUserData();
  const [influencerRating, setInfluencerRating] = useState(null);

  const isMobile = useBreakpointValue({ base: true, md: false });

  const currentInfluencer =
    influencersList.length > 0 &&
    currentIndex >= 0 &&
    currentIndex < influencersList.length
      ? influencersList[currentIndex]
      : null;

  const {
    influencerData,
    submitRating,
    loading: ratingLoading,
    error: ratingError,
  } = useInfluencerRatingData(currentInfluencer?.id || null);

  useEffect(() => {
    if (influencerData) console.log('Current Influencer Data:', influencerData);
    if (userData) console.log('Current AuthUser Data:', userData);
  }, [influencerData, userData]);

  useEffect(() => {
    if (currentInfluencer) {
      if (currentInfluencer.timesRanked > 0) {
        setInfluencerRating(currentInfluencer.ranking / currentInfluencer.timesRanked);
      } else {
        setInfluencerRating(0);
      }
    }
  }, [currentInfluencer]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      })
      .catch((err) => {
        console.error('Failed to access media devices:', err);
        toast({
          title: 'Media Error',
          description: 'Failed to access camera. Please check your permissions.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      });
  }, [toast]);

  // Fetch and shuffle influencers based on category
  useEffect(() => {
    const loadInfluencers = async () => {
      setIsLoading(true);
      try {
        const q = query(collection(db, 'streamers'), where('category', '==', category));
        const querySnapshot = await getDocs(q);
        const influencers = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const shuffled = shuffleArray(influencers);
        setShuffledInfluencers(shuffled);
      } catch (error) {
        console.error('Error fetching influencers:', error);
        toast({
          title: 'Fetch Error',
          description: 'Failed to load influencers.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setShuffledInfluencers([]);
      }
      setIsLoading(false);
    };
    loadInfluencers();
  }, [category, toast]);

  // Apply gender filter whenever shuffledInfluencers or genderFilter changes
  useEffect(() => {
    let filteredList = shuffledInfluencers;
    if (genderFilter !== 'both') {
      filteredList = shuffledInfluencers.filter(
        (influencer) => influencer.gender === genderFilter
      );
    }
    setInfluencersList(filteredList);
    setCurrentIndex(0);
  }, [shuffledInfluencers, genderFilter]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: 'Sign Out Error',
        description: 'An error occurred while signing out.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleRatingSubmit = async (rating, featureAllocations) => {
    if (!currentInfluencer) return;
    try {
      await submitRating(rating, featureAllocations);
      toast({
        title: 'Rating Submitted',
        description: `You rated ${currentInfluencer.name}: ${rating}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setRatingKey((prevKey) => prevKey + 1);
      setCurrentIndex((prevIndex) =>
        influencersList.length > 0 ? (prevIndex + 1) % influencersList.length : prevIndex
      );
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Rating Error',
        description: 'Failed to update rating. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleNextPhoto = () => {
    setCurrentIndex((prevIndex) =>
      influencersList.length > 0 ? (prevIndex + 1) % influencersList.length : prevIndex
    );
    setRatingKey((prevKey) => prevKey + 1);
  };

  const handlePreviousPhoto = () => {
    setCurrentIndex((prevIndex) =>
      influencersList.length > 0
        ? (prevIndex - 1 + influencersList.length) % influencersList.length
        : prevIndex
    );
    setRatingKey((prevKey) => prevKey + 1);
  };

  const chartData = useMemo(() => {
    if (!userData || !influencerData) return [];
    const featureMapping = {
      Eyes: 'eyesRating',
      Smile: 'smileRating',
      Jawline: 'facialRating',
      Hair: 'hairRating',
      Body: 'bodyRating',
    };
    return Object.entries(featureMapping).map(([feature, field]) => {
      const userTimesRanked = userData.timesRanked || 0;
      const influencerTimesRanked = influencerData.timesRanked || 0;
      const userAvg = userTimesRanked > 0 ? (userData[field] || 0) / userTimesRanked : 0;
      const influencerAvg =
        influencerTimesRanked > 0 ? (influencerData[field] || 0) / influencerTimesRanked : 0;
      return { feature, user: userAvg, influencer: influencerAvg };
    });
  }, [userData, influencerData]);

  return (
    <>
      <TopBar />
      <Flex direction="column" minH="100vh" bg="gray.50" overflowX="hidden">
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} overflow="hidden">
          {/* Gender Filter Buttons - Adjusted for mobile */}
          <VStack align="center" mb={4}>
            <Text fontSize="lg" fontWeight="bold">Filter by Gender</Text>
            <Flex
              wrap="wrap"
              gap={2}
              justify="center"
              width={{ base: '100%', md: 'auto' }}
            >
              {['male', 'female', 'both'].map((gender) => (
                <Button
                  key={gender}
                  onClick={() => setGenderFilter(gender)}
                  colorScheme={genderFilter === gender ? 'blue' : 'gray'}
                  size="sm"
                  flex={{ base: '1 0 30%', md: 'none' }}
                >
                  {gender.charAt(0).toUpperCase() + gender.slice(1)}
                </Button>
              ))}
            </Flex>
          </VStack>

          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            {/* Adjusted sticky header for mobile */}
            <Box
              position={{ base: 'static', md: 'sticky' }}
              top={{ md: '0' }}
              zIndex="10"
              bg="white"
              borderRadius="2xl"
              boxShadow={{ md: 'xl' }}
              p={4}
              maxH={{ base: 'auto', md: '85vh' }}
              mb={{ base: 4, md: 0 }}
            >
              <Flex
                direction={{ base: 'column', md: 'row' }}
                w="100%"
                justify="center"
                align="flex-start"
                gap={6}
              >
                {/* Video Stream - Adjusted height for mobile */}
                <Box
                  w={{ base: '100%', md: '45%' }}
                  h={{ base: '40vh', md: '50vh' }}
                  borderWidth="2px"
                  borderColor="gray.100"
                  borderRadius="xl"
                  overflow="hidden"
                  boxShadow="lg"
                  bg="black"
                  position="relative"
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <HStack
                    position="absolute"
                    bottom="2"
                    left="2"
                    color="white"
                    bg="rgba(0, 0, 0, 0.6)"
                    px={2}
                    py={1}
                    borderRadius="md"
                    spacing={1}
                  >
                    <Text fontSize="sm" fontWeight="medium">
                      {userData?.displayName || 'You'}
                    </Text>
                    {!userLoading && (
                      <HStack spacing={1}>
                        <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                        <Text fontSize="sm" fontWeight="medium">
                          {localRating?.toFixed(1) || 'N/A'}
                        </Text>
                      </HStack>
                    )}
                  </HStack>
                </Box>

                {/* Influencer's Photo - Adjusted height for mobile */}
                <Box
                  w={{ base: '100%', md: '45%' }}
                  h={{ base: '40vh', md: '50vh' }}
                  borderWidth="2px"
                  borderColor="gray.100"
                  borderRadius="xl"
                  overflow="hidden"
                  boxShadow="lg"
                  bg="gray.200"
                  position="relative"
                >
                  {isLoading || ratingLoading ? (
                    <Spinner size="xl" color="blue.500" />
                  ) : currentInfluencer ? (
                    <img
                      src={currentInfluencer.photo_url}
                      alt={currentInfluencer.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Text fontSize="lg" color="gray.500">
                      No influencers available for the selected filter
                    </Text>
                  )}
                  <HStack
                    position="absolute"
                    bottom="2"
                    left="2"
                    color="white"
                    bg="rgba(0, 0, 0, 0.6)"
                    px={2}
                    py={1}
                    borderRadius="md"
                    spacing={1}
                  >
                    <Text fontSize="sm" fontWeight="medium">
                      {currentInfluencer ? currentInfluencer.name : 'No User'}
                    </Text>
                    {currentInfluencer && !ratingLoading && !ratingError && (
                      <HStack spacing={1}>
                        <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                        <Text fontSize="sm" fontWeight="medium">
                          {influencerRating?.toFixed(1)}
                        </Text>
                      </HStack>
                    )}
                    {currentInfluencer && !ratingLoading && ratingError && (
                      <Text fontSize="sm" fontWeight="medium">
                        Rating unavailable
                      </Text>
                    )}
                  </HStack>
                </Box>
              </Flex>
            </Box>

            {/* Chart container - Adjusted for mobile */}
            {!userLoading && !ratingLoading && userData && influencerData && (
              <Box
                w="100%"
                p={4}
                bg="white"
                borderRadius="2xl"
                boxShadow={{ md: 'xl' }}
                mt={{ base: 4, md: 0 }}
              >
                <Heading as="h3" size="md" mb={4}>
                  Feature Rating Comparison
                </Heading>
                <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="feature" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="user" fill="#8884d8" name="Your Average" />
                    <Bar
                      dataKey="influencer"
                      fill="#82ca9d"
                      name={`${currentInfluencer?.name || 'Influencer'}'s Average`}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Rating Scale - Improved mobile padding */}
            <Suspense fallback={<Spinner />}>
              <Box
                w="100%"
                bg="white"
                p={{ base: 4, md: 6 }}
                borderRadius="2xl"
                boxShadow={{ md: 'xl' }}
              >
                {currentInfluencer ? (
                  <RatingScale key={ratingKey} onRate={handleRatingSubmit} />
                ) : (
                  <Text>No influencers available for the selected filter.</Text>
                )}
              </Box>
            </Suspense>

            {/* Navigation Buttons - Stack vertically on mobile */}
            <Flex
              direction={{ base: 'column', md: 'row' }}
              gap={4}
              justify="center"
              mt={{ base: 2, md: 0 }}
            >
              {influencersList.length > 0 && (
                <>
                  <Button
                    colorScheme="teal"
                    size="lg"
                    px={8}
                    onClick={handlePreviousPhoto}
                    _hover={{ transform: { md: 'scale(1.05)' } }}
                    width={{ base: '100%', md: 'auto' }}
                  >
                    Previous Photo
                  </Button>
                  <Button
                    colorScheme="teal"
                    size="lg"
                    px={8}
                    onClick={handleNextPhoto}
                    _hover={{ transform: { md: 'scale(1.05)' } }}
                    width={{ base: '100%', md: 'auto' }}
                  >
                    Next Photo
                  </Button>
                </>
              )}
            </Flex>
          </VStack>
        </Container>
      </Flex>
    </>
  );
}

export default GetRanked;