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
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { Star } from '@mui/icons-material';
import { useToast } from '@chakra-ui/toast';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useInfluencerRatingData } from '../hooks/useInfluencerRatingData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TopBar from '../Components/TopBar';

const RatingScale = lazy(() => import('../Components/RatingScale'));

// Utility function to shuffle an array using Fisher-Yates algorithm
function shuffleArray(array) {
  const shuffled = [...array]; // Create a copy to avoid mutating the original
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

  // Fetch and shuffle influencers once
  useEffect(() => {
    const loadInfluencers = async () => {
      if (category === 'influencers') {
        setIsLoading(true);
        try {
          const querySnapshot = await getDocs(collection(db, 'streamers'));
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
      } else {
        setShuffledInfluencers([]);
      }
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
    setCurrentIndex(0); // Reset to start of filtered list
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
      <Flex direction="column" minH="100vh" bg="gray.50">
        <Container maxW="container.xl" py={{ base: 4, md: 6 }}>
          {/* Gender Filter Buttons */}
          <VStack align="center" mb={4}>
            <Text fontSize="lg" fontWeight="bold">Filter by Gender</Text>
            <HStack spacing={2}>
              <Button
                onClick={() => setGenderFilter('male')}
                colorScheme={genderFilter === 'male' ? 'blue' : 'gray'}
              >
                Male
              </Button>
              <Button
                onClick={() => setGenderFilter('female')}
                colorScheme={genderFilter === 'female' ? 'blue' : 'gray'}
              >
                Female
              </Button>
              <Button
                onClick={() => setGenderFilter('both')}
                colorScheme={genderFilter === 'both' ? 'blue' : 'gray'}
              >
                Both
              </Button>
            </HStack>
          </VStack>
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            {/* Sticky Video and Photo Section */}
            <Box
              position="sticky"
              top="0"
              zIndex="10"
              bg="white"
              borderRadius="2xl"
              boxShadow="xl"
              p={4}
              maxH="85vh"
            >
              <Flex
                direction={['column', 'row']}
                w="100%"
                justify="center"
                align="flex-start"
                gap={6}
              >
                {/* Video Stream */}
                <Box
                  w={['100%', '45%']}
                  h={['auto', '50vh']}
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

                {/* Influencer's Photo and Info */}
                <VStack w={['100%', '45%']} spacing={4} align="stretch">
                  <Box
                    w="100%"
                    h={['auto', '50vh']}
                    borderWidth="2px"
                    borderColor="gray.100"
                    borderRadius="xl"
                    overflow="hidden"
                    boxShadow="lg"
                    bg="gray.200"
                    position="relative"
                  >
                    {category === 'influencers' ? (
                      isLoading || ratingLoading ? (
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
                      )
                    ) : (
                      <img
                        src="https://via.placeholder.com/640x480?text=Photo+Placeholder"
                        alt="Placeholder User"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
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
                        {category === 'influencers' && currentInfluencer
                          ? currentInfluencer.name
                          : 'Placeholder User'}
                      </Text>
                      {category === 'influencers' &&
                        currentInfluencer &&
                        !ratingLoading &&
                        !ratingError && (
                          <HStack spacing={1}>
                            <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                            <Text fontSize="sm" fontWeight="medium">
                              {influencerRating?.toFixed(1)}
                            </Text>
                          </HStack>
                        )}
                      {category === 'influencers' &&
                        currentInfluencer &&
                        !ratingLoading &&
                        ratingError && (
                          <Text fontSize="sm" fontWeight="medium">
                            Rating unavailable
                          </Text>
                        )}
                    </HStack>
                  </Box>
                </VStack>
              </Flex>
            </Box>

            {/* Feature Comparison Chart */}
            {!userLoading &&
              !ratingLoading &&
              userData &&
              influencerData &&
              category === 'influencers' && (
                userData.timesRanked > 0 && influencerData.timesRanked > 0 ? (
                  <Box w="100%" p={4} bg="white" borderRadius="2xl" boxShadow="xl">
                    <Heading as="h3" size="md" mb={4}>
                      Feature Rating Comparison
                    </Heading>
                    <ResponsiveContainer width="100%" height={300}>
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
                          name={`${currentInfluencer.name}'s Average`}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                ) : (
                  <Text textAlign="center" color="gray.500">
                    Comparison unavailable:{' '}
                    {userData.timesRanked === 0 ? 'You have' : `${currentInfluencer.name} has`}{' '}
                    not been rated yet.
                  </Text>
                )
              )}

            <Suspense fallback={<Text>Loading rating interface...</Text>}>
              <Box w="100%" bg="white" p={6} borderRadius="2xl" boxShadow="xl">
                {category === 'influencers' ? (
                  currentInfluencer ? (
                    <RatingScale key={ratingKey} onRate={handleRatingSubmit} />
                  ) : (
                    <Text>No influencers available for the selected filter.</Text>
                  )
                ) : (
                  <Text>Rating is only available for influencers.</Text>
                )}
              </Box>
            </Suspense>

            <HStack spacing={4} justify="center" flexWrap="wrap">
              {category === 'influencers' && influencersList.length > 0 && (
                <>
                  <Button
                    colorScheme="teal"
                    size="lg"
                    px={8}
                    onClick={handlePreviousPhoto}
                    boxShadow="md"
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s cubic-bezier(.27,.67,.47,1.6)"
                  >
                    Previous Photo
                  </Button>
                  <Button
                    colorScheme="teal"
                    size="lg"
                    px={8}
                    onClick={handleNextPhoto}
                    boxShadow="md"
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s cubic-bezier(.27,.67,.47,1.6)"
                  >
                    Next Photo
                  </Button>
                </>
              )}
            </HStack>
          </VStack>
        </Container>
      </Flex>
    </>
  );
}

export default GetRanked;