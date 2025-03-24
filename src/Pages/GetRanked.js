import React, { useState, useRef, useEffect, Suspense, lazy } from 'react';
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

const RatingScale = lazy(() => import('../Components/RatingScale'));

function GetRanked() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get('category') || 'Unknown Category';

  const [localStream, setLocalStream] = useState(null);
  const [influencersList, setInfluencersList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [ratingKey, setRatingKey] = useState(0); // used to reset the RatingScale component
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

  // Use the influencer's ID if available, otherwise null.
  const {
    influencerData,
    submitRating,
    loading: ratingLoading,
    error: ratingError,
  } = useInfluencerRatingData(currentInfluencer?.id || null);

  useEffect(() => {
    if (currentInfluencer) {
        console.log(currentInfluencer);
        if (currentInfluencer.timesRanked > 0) {
          setInfluencerRating(currentInfluencer.ranking / currentInfluencer.timesRanked);
        }
        else {
          setInfluencerRating(0);
        }
    }
  }, [currentInfluencer]);

  // Set up local video feed.
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

  // Fetch influencers when the category is "influencers".
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
          setInfluencersList(influencers);
          setCurrentIndex(0);
        } catch (error) {
          console.error('Error fetching influencers:', error);
          toast({
            title: 'Fetch Error',
            description: 'Failed to load influencers.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          setInfluencersList([]);
        }
        setIsLoading(false);
      } else {
        setInfluencersList([]);
      }
    };
    loadInfluencers();
  }, [category, toast]);

  // Handle sign-out.
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

  // Handle rating submission: update Firestore using the hook, then move to the next influencer.
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
      // Reset the RatingScale component state.
      setRatingKey((prevKey) => prevKey + 1);
      // Move to the next influencer.
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

  // Navigation handlers.
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

  return (
    <Flex direction="column" minH="100vh" bg="gray.50">
      {/* Header */}
      <Box
        position="sticky"
        top="0"
        w="100%"
        bg="rgba(255, 255, 255, 0.8)"
        backdropFilter="blur(10px)"
        zIndex="sticky"
        borderBottomWidth="1px"
        boxShadow="sm"
      >
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <Heading
              as="h1"
              size="xl"
              color="blue.700"
              fontWeight="bold"
              onClick={() => navigate('/')}
              cursor="pointer"
            >
              Lookzapp
            </Heading>
            <HStack spacing={4}>
              <Button
                variant="link"
                color="blue.500"
                fontWeight="medium"
                onClick={() => navigate('/top-rated-users')}
              >
                Top Rated Users
              </Button>
              <Button
                variant="link"
                color="red.500"
                fontWeight="medium"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 4, md: 6 }} align="stretch">
          <Heading as="h2" size="lg" textAlign="center">
            Ranking against: {category}
          </Heading>

          <Flex
            direction={['column', 'row']}
            w="100%"
            h="auto"
            justify="center"
            align="flex-start"
            gap={6}
            p={4}
            bg="white"
            borderRadius="2xl"
            boxShadow="xl"
          >
            {/* Local Video */}
            <Box
              w={['100%', '45%']}
              h={['auto', '60vh']}
              flex={['1', 'none']}
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
                      {localRating.toFixed(1)}
                    </Text>
                  </HStack>
                )}
              </HStack>
            </Box>

            {/* Influencer Photo and Details */}
            <VStack w={['100%', '45%']} spacing={4} align="stretch">
              <Box
                w="100%"
                h={['auto', '60vh']}
                borderWidth="2px"
                borderColor="gray.100"
                borderRadius="xl"
                overflow="hidden"
                boxShadow="lg"
                bg="gray.200"
                position="relative"
                display="flex"
                justifyContent="center"
                alignItems="center"
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
                      No influencers available
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

              {/* Influencer Details */}
              {category === 'influencers' && currentInfluencer && (
                <Box w="100%" p={4} bg="gray.50" borderRadius="md" boxShadow="sm">
                  <HStack spacing={4}>
                    <Text>
                      Age:{' '}
                      {currentInfluencer.age != null && !isNaN(currentInfluencer.age)
                        ? `${currentInfluencer.age} years`
                        : 'N/A'}
                    </Text>
                    <Text>
                      Height:{' '}
                      {currentInfluencer.height != null &&
                      !isNaN(currentInfluencer.height)
                        ? `${currentInfluencer.height} cm`
                        : 'N/A'}
                    </Text>
                    <Text>
                      Weight:{' '}
                      {currentInfluencer.weight != null &&
                      !isNaN(currentInfluencer.weight)
                        ? `${currentInfluencer.weight} kg`
                        : 'N/A'}
                    </Text>
                  </HStack>
                </Box>
              )}
            </VStack>
          </Flex>

          {/* Rating Section */}
          <Suspense fallback={<Text>Loading rating interface...</Text>}>
            <Box w="100%" bg="white" p={6} borderRadius="2xl" boxShadow="xl">
              {category === 'influencers' && currentInfluencer ? (
                <RatingScale key={ratingKey} onRate={handleRatingSubmit} />
              ) : (
                <Text>Rating is only available for influencers.</Text>
              )}
            </Box>
          </Suspense>

          {/* Navigation Buttons */}
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
  );
}

export default GetRanked;
