import React, { useState, useRef, Suspense, lazy, useMemo, useEffect } from 'react';
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
import { ArrowLeft, ArrowRight, Star, Videocam, BarChart } from '@mui/icons-material';
import { useToast } from '@chakra-ui/toast';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import InfluencerGalleryCircle from '../Components/InfluencerGalleryCircle';
import { Spinner } from '@heroui/react';
import FeatureRatingComparison from '../Components/FeatureRatingComparison';
import useVideoStream from '../hooks/useVideoStream';
import useEntities from '../hooks/useEntities';
import useEntityRating from '../hooks/useEntityRating';

const RatingScale = lazy(() => import('../Components/RatingScale'));

function GetRanked() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get('category') || 'Unknown Category';

  const [genderFilter, setGenderFilter] = useState('both');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratingKey, setRatingKey] = useState(0);
  const [isComparisonToggled, setIsComparisonToggled] = useState(false);

  const localVideoRef = useRef(null);
  const toast = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { userData, rating: localRating, loading: userLoading } = useUserData();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Custom hooks
  const localStream = useVideoStream();
  const { entities: entitiesList, isLoading } = useEntities(category, genderFilter);
  const currentEntity = entitiesList.length > 0 ? entitiesList[currentIndex] : null;
  const {
    ratedEntityData,
    entityRating,
    submitRating,
    ratingLoading,
    ratingError,
  } = useEntityRating(currentEntity);

  // Callback ref to set srcObject when video element is mounted
  const setVideoRef = (element) => {
    if (element && localStream) {
      element.srcObject = localStream;
    }
    localVideoRef.current = element;
  };

  // Log data for debugging
  useEffect(() => {
    if (ratedEntityData) console.log('Current Rated Entity Data:', ratedEntityData);
    if (userData) console.log('Current AuthUser Data:', userData);
  }, [ratedEntityData, userData]);

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

            {/* Feature Rating Comparison */}
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
                {/* Video or Comparison */}
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
                      <Box width="100%" height="100%" overflow="auto">
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
                        ref={setVideoRef}
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
                      e.stopPropagation();
                      setIsComparisonToggled(!isComparisonToggled);
                    }}
                    zIndex="1"
                    colorScheme="blue"
                  >
                    {isComparisonToggled ? <Videocam /> : <BarChart />}
                  </IconButton>
                </Box>

                {/* Entity Photo */}
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

            {/* Navigation Buttons */}
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

          {/* Mobile Arrow Controls */}
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
                  backgroundColor: 'rgba(0, 128, 128, 0.3)',
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
                  backgroundColor: 'rgba(0, 128, 128, 0.3)',
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