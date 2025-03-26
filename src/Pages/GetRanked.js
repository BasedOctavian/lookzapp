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
import { useInfluencerRatingData } from '../hooks/useInfluencerRatingData';
import { useUserRatingData } from '../hooks/useUserRatingData';
import { Star } from '@mui/icons-material';
import { useToast } from '@chakra-ui/toast';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';

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
  const [shuffledEntities, setShuffledEntities] = useState([]);
  const [entitiesList, setEntitiesList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [ratingKey, setRatingKey] = useState(0);
  const [genderFilter, setGenderFilter] = useState('both');

  const localVideoRef = useRef(null);

  const toast = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { userData, rating: localRating, loading: userLoading } = useUserData();

  const isMobile = useBreakpointValue({ base: true, md: false });

  const currentEntity =
    entitiesList.length > 0 && currentIndex >= 0 && currentIndex < entitiesList.length
      ? entitiesList[currentIndex]
      : null;

  // Determine entity type for dynamic hook usage
  const isStreamer = currentEntity?.type === 'streamer';
  const isUser = currentEntity?.type === 'user';

  // Use both hooks but pass ID conditionally based on entity type
  const influencerRatingHook = useInfluencerRatingData(isStreamer ? currentEntity?.id : null);
  const userRatingHook = useUserRatingData(isUser ? currentEntity?.id : null);

  const ratedEntityData = isStreamer
    ? influencerRatingHook.influencerData
    : isUser
    ? userRatingHook.userData
    : null;
  const entityRating = isStreamer
    ? influencerRatingHook.rating
    : isUser
    ? userRatingHook.rating
    : null;
  const submitRating = isStreamer
    ? influencerRatingHook.submitRating
    : isUser
    ? userRatingHook.submitRating
    : null;
  const ratingLoading = isStreamer
    ? influencerRatingHook.loading
    : isUser
    ? userRatingHook.loading
    : false;
  const ratingError = isStreamer
    ? influencerRatingHook.error
    : isUser
    ? userRatingHook.error
    : null;

  useEffect(() => {
    if (ratedEntityData) console.log('Current Rated Entity Data:', ratedEntityData);
    if (userData) console.log('Current AuthUser Data:', userData);
  }, [ratedEntityData, userData]);

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

  // Fetch and shuffle entities based on category
  useEffect(() => {
    const loadEntities = async () => {
      // Require authentication for 'all' and 'other-users' categories
      if ((category === 'all' || category === 'other-users') && !user) {
        setShuffledEntities([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        let entities = [];
        if (category === 'all') {
          // Fetch all streamers (influencers and celebrities)
          const streamersQuery = query(collection(db, 'streamers'));
          const streamersSnapshot = await getDocs(streamersQuery);
          const streamers = streamersSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: 'streamer',
            name: doc.data().name,
            photo_url: doc.data().photo_url,
            ...doc.data(),
          }));
          entities = [...entities, ...streamers];

          // Fetch all users except the current one
          const usersQuery = query(collection(db, 'users'), where('__name__', '!=', user.uid));
          const usersSnapshot = await getDocs(usersQuery);
          const users = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: 'user',
            name: doc.data().displayName || 'Unknown User',
            photo_url: doc.data().profilePicture || 'default_image_url',
            ...doc.data(),
          }));
          entities = [...entities, ...users];
        } else if (category === 'other-users') {
          // Fetch all users except the current one
          const usersQuery = query(collection(db, 'users'), where('__name__', '!=', user.uid));
          const usersSnapshot = await getDocs(usersQuery);
          const users = usersSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: 'user',
            name: doc.data().displayName || 'Unknown User',
            photo_url: doc.data().profilePicture || 'default_image_url',
            ...doc.data(),
          }));
          entities = [...entities, ...users];
        } else {
          // Fetch streamers for the specified category
          const streamersQuery = query(collection(db, 'streamers'), where('category', '==', category));
          const streamersSnapshot = await getDocs(streamersQuery);
          const streamers = streamersSnapshot.docs.map((doc) => ({
            id: doc.id,
            type: 'streamer',
            name: doc.data().name,
            photo_url: doc.data().photo_url,
            ...doc.data(),
          }));
          entities = [...entities, ...streamers];
        }
        const shuffled = shuffleArray(entities);
        setShuffledEntities(shuffled);
      } catch (error) {
        console.error('Error fetching entities:', error);
        toast({
          title: 'Fetch Error',
          description: 'Failed to load entities.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        setShuffledEntities([]);
      }
      setIsLoading(false);
    };
    loadEntities();
  }, [category, toast, user]);

  // Apply gender filter whenever shuffledEntities or genderFilter changes
  useEffect(() => {
    let filteredList = shuffledEntities;
    if (genderFilter !== 'both') {
      filteredList = shuffledEntities.filter((entity) => entity.gender === genderFilter);
    }
    setEntitiesList(filteredList);
    setCurrentIndex(0);
  }, [shuffledEntities, genderFilter]);

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
    if (!currentEntity || !submitRating) return;
    try {
      await submitRating(rating, featureAllocations);
      toast({
        title: 'Rating Submitted',
        description: `You rated ${currentEntity.name}: ${rating}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setRatingKey((prevKey) => prevKey + 1);
      setCurrentIndex((prevIndex) =>
        entitiesList.length > 0 ? (prevIndex + 1) % entitiesList.length : prevIndex
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
      entitiesList.length > 0 ? (prevIndex + 1) % entitiesList.length : prevIndex
    );
    setRatingKey((prevKey) => prevKey + 1);
  };

  const handlePreviousPhoto = () => {
    setCurrentIndex((prevIndex) =>
      entitiesList.length > 0
        ? (prevIndex - 1 + entitiesList.length) % entitiesList.length
        : prevIndex
    );
    setRatingKey((prevKey) => prevKey + 1);
  };

  const chartData = useMemo(() => {
    if (!userData || !ratedEntityData) return [];
    const featureMapping = {
      Eyes: 'eyesRating',
      Smile: 'smileRating',
      Jawline: 'facialRating',
      Hair: 'hairRating',
      Body: 'bodyRating',
    };
    return Object.entries(featureMapping).map(([feature, field]) => {
      const userTimesRanked = userData.timesRanked || 0;
      const entityTimesRanked = ratedEntityData.timesRanked || 0;
      const userAvg = userTimesRanked > 0 ? (userData[field] || 0) / userTimesRanked : 0;
      const entityAvg =
        entityTimesRanked > 0 ? (ratedEntityData[field] || 0) / entityTimesRanked : 0;
      return { feature, user: userAvg, influencer: entityAvg };
    });
  }, [userData, ratedEntityData]);

  return (
    <>
      <TopBar />
      <Flex direction="column" minH="100vh" bg="gray.50" overflowX="hidden">
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} overflow="hidden">
          {/* Gender Filter Buttons */}
          <VStack align="center" mb={4}>
            <Text fontSize="lg" fontWeight="bold">Filter by Gender</Text>
            <Flex wrap="wrap" gap={2} justify="center" width={{ base: '100%', md: 'auto' }}>
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
            {/* Video and Photo Display */}
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
                {/* User's Video Stream */}
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

                {/* Entity's Photo */}
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
                  ) : currentEntity ? (
                    <img
                      src={currentEntity.photo_url}
                      alt={currentEntity.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Text fontSize="lg" color="gray.500">
                      No entities available for the selected filter
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
                      {currentEntity ? currentEntity.name : 'No User'}
                    </Text>
                    {currentEntity && !ratingLoading && !ratingError && (
                      <HStack spacing={1}>
                        <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                        <Text fontSize="sm" fontWeight="medium">
                          {entityRating?.toFixed(1)}
                        </Text>
                      </HStack>
                    )}
                    {currentEntity && !ratingLoading && ratingError && (
                      <Text fontSize="sm" fontWeight="medium">
                        Rating unavailable
                      </Text>
                    )}
                  </HStack>
                </Box>
              </Flex>
            </Box>

            {/* Feature Rating Comparison Chart */}
            {!userLoading && !ratingLoading && userData && ratedEntityData && (
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
                      name={`${currentEntity?.name || 'Entity'}'s Average`}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            )}

            {/* Rating Scale */}
            <Suspense fallback={<Spinner />}>
              <Box
                w="100%"
                bg="white"
                p={{ base: 4, md: 6 }}
                borderRadius="2xl"
                boxShadow={{ md: 'xl' }}
              >
                {currentEntity ? (
                  <RatingScale key={ratingKey} onRate={handleRatingSubmit} />
                ) : (
                  <Text>No entities available for the selected filter.</Text>
                )}
              </Box>
            </Suspense>

            {/* Navigation Buttons */}
            <Flex
              direction={{ base: 'column', md: 'row' }}
              gap={4}
              justify="center"
              mt={{ base: 2, md: 0 }}
            >
              {entitiesList.length > 0 && (
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
      <Footer />
    </>
  );
}

export default GetRanked;