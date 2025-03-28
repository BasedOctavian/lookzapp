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
  useBreakpointValue,
  IconButton,
} from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { useInfluencerRatingData } from '../hooks/useInfluencerRatingData';
import { useUserRatingData } from '../hooks/useUserRatingData';
import { ArrowLeft, ArrowRight, Star, Videocam, BarChart } from '@mui/icons-material';
import { useToast } from '@chakra-ui/toast';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import InfluencerGalleryCircle from '../Components/InfluencerGalleryCircle';
import { Spinner } from '@heroui/react';
import FeatureRatingComparison from '../Components/FeatureRatingComparison';

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
  const [isComparisonToggled, setIsComparisonToggled] = useState(false);

  const localVideoRef = useRef(null);
  const videoInitialized = useRef(false); // New ref to track initialization

  const toast = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { userData, rating: localRating, loading: userLoading } = useUserData();

  const isMobile = useBreakpointValue({ base: true, md: false });

  const currentEntity =
    entitiesList.length > 0 && currentIndex >= 0 && currentIndex < entitiesList.length
      ? entitiesList[currentIndex]
      : null;

  const isStreamer = currentEntity?.type === 'streamer';
  const isUser = currentEntity?.type === 'user';

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

  // Initialize video stream only once
  useEffect(() => {
    if (videoInitialized.current) return; // Skip if already initialized

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        videoInitialized.current = true; // Mark as initialized
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

    // Cleanup function to stop the stream when component unmounts
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [toast]); // Removed localStream from dependencies to prevent re-triggering

  useEffect(() => {
    const loadEntities = async () => {
      setIsLoading(true);
      try {
        let entities = [];
        if (category === 'all') {
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

          const usersQuery = query(collection(db, 'users'));
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
          const usersQuery = query(collection(db, 'users'));
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
  }, [category, toast]);

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
    if (!user || !userData || !ratedEntityData) return [];
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
      return { feature, user: userAvg, entity: entityAvg };
    });
  }, [user, userData, ratedEntityData]);

  return (
    <>
      <TopBar />
      <Flex direction="column" minH="100vh" bg="gray.50" overflowX="hidden">
        <Container maxW="container.xl" py={{ base: 4, md: 6 }} overflow="hidden">
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            {/* Gender Filter */}
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

            {/* Feature Rating Comparison (Hidden when comparison is toggled or user is not signed in) */}
            {!isComparisonToggled && user && !userLoading && !ratingLoading && userData && ratedEntityData && (
              <Box w="100%" p={4} bg="white" borderRadius="2xl" boxShadow={{ md: 'xl' }}>
                <FeatureRatingComparison
                  chartData={chartData}
                  entityName={currentEntity?.name || 'Entity'}
                  isMobile={isMobile}
                />
              </Box>
            )}

            {/* Video and Photo Section */}
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
                {/* Conditional Video or Comparison */}
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
                  onClick={() => window.open(`http://lookzapp.com/profile/${user.uid}`, '_blank')}
                  cursor="pointer"
                >
                  {isComparisonToggled ? (
                    user && !userLoading && !ratingLoading && userData && ratedEntityData ? (
                      <Box p={4}>
                        <FeatureRatingComparison
                          chartData={chartData}
                          entityName={currentEntity?.name || 'Entity'}
                          isMobile={isMobile}
                        />
                      </Box>
                    ) : (
                      <Spinner size="xl" color="blue.500" />
                    )
                  ) : (
                    <Box w="100%" h="100%" bg="black">
                      <video
                        ref={localVideoRef} // Simplified ref assignment
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
                          {user ? userData?.displayName || 'You' : 'Guest'}
                        </Text>
                        {user && !userLoading && (
                          <HStack spacing={1}>
                            <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                            <Text fontSize="sm" fontWeight="medium">
                              {localRating?.toFixed(1) || 'N/A'}
                            </Text>
                          </HStack>
                        )}
                      </HStack>
                    </Box>
                  )}
                  <IconButton
                    aria-label={isComparisonToggled ? 'Switch to Video' : 'Switch to Comparison'}
                    position="absolute"
                    bottom="2"
                    right="2"
                    size="sm"
                    borderRadius="full"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent navigation when clicking the toggle button
                      setIsComparisonToggled(!isComparisonToggled);
                    }}
                    zIndex="1"
                    colorScheme="blue"
                  >
                    {isComparisonToggled ? <Videocam /> : <BarChart />}
                  </IconButton>
                </Box>

                {/* Entity's Photo with Sticky Positioning on Mobile */}
                <Box
                  w={{ base: '100%', md: '45%' }}
                  h={{ base: '40vh', md: '50vh' }}
                  borderWidth="2px"
                  borderColor="gray.100"
                  borderRadius="xl"
                  overflow="hidden"
                  boxShadow="lg"
                  bg="gray.200"
                  position={{ base: 'sticky', md: 'relative' }}
                  top={0}
                  zIndex={1}
                  onClick={() => {
                    if (currentEntity?.type === 'user') {
                      window.open(`http://lookzapp.com/profile/${currentEntity.id}`, '_blank');
                    } else if (currentEntity?.type === 'streamer') {
                      window.open(`http://lookzapp.com/influencer-profile/${currentEntity.id}`, '_blank');
                    }
                  }}
                  cursor="pointer"
                >
                  {isLoading || ratingLoading ? (
                    <Spinner size="xl" color="blue.500" />
                  ) : currentEntity ? (
                    <img
                      src={currentEntity.photo_url}
                      alt={currentEntity.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
                  {currentEntity && currentEntity.type === 'streamer' && (
                    <InfluencerGalleryCircle name={currentEntity.name} />
                  )}
                </Box>
              </Flex>
            </Box>

            {/* Navigation Buttons - Hidden on Mobile */}
            <Flex
              display={{ base: 'none', md: 'flex' }}
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
          </VStack>

          {/* Arrow Controls for Mobile */}
          {isMobile && entitiesList.length > 0 && (
            <>
              <IconButton
                aria-label="Previous Photo"
                position="fixed"
                bottom="10px"
                left="10px"
                size="lg"
                colorScheme="teal"
                onClick={handlePreviousPhoto}
                zIndex="1000"
                rounded="full"
                style={{ 
                  backgroundColor: 'rgba(0, 128, 128, 0.3)',  // Teal with 30% transparency
                  marginBottom: 55 
                }}
                variant="ghost"
              >
                <ArrowLeft />
              </IconButton>
              <IconButton
                aria-label="Next Photo"
                position="fixed"
                bottom="10px"
                right="10px"
                size="lg"
                colorScheme="teal"
                onClick={handleNextPhoto}
                zIndex="1000"
                rounded="full"
                style={{ 
                  backgroundColor: 'rgba(0, 128, 128, 0.3)',  // Teal with 30% transparency
                  marginBottom: 55 
                }}
                variant="ghost"
              >
                <ArrowRight />
              </IconButton>
            </>
          )}
        </Container>
      </Flex>
      <Footer />
    </>
  );
}

export default GetRanked;