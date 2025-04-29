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
  Center,
  Badge,
  Stack,
} from '@chakra-ui/react';
import { Modal, ModalOverlay, ModalContent, ModalBody, ModalCloseButton } from '@chakra-ui/modal';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { ArrowLeft, ArrowRight, Star, Videocam, BarChart, ThumbUp, ThumbDown, Settings, KeyboardArrowUp, KeyboardArrowDown } from '@mui/icons-material';
import { useToast } from '@chakra-ui/toast';
import TopBar from '../Components/TopBar';
import Footer from '../Components/Footer';
import InfluencerGalleryCircle from '../Components/InfluencerGalleryCircle';
import { Spinner } from '@heroui/react';
import FeatureRatingComparison from '../Components/FeatureRatingComparison';
import useVideoStream from '../hooks/useVideoStream';
import useEntities from '../hooks/useEntities';
import useEntityRating from '../hooks/useEntityRating';
import ProfilePopover from '../Components/ProfilePopover';
import { useTopRatedData } from '../hooks/useTopRatedData';
import '../App.css';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust the path to your Firestore instance
import { CircularProgress } from '@mui/material';
import { Typography } from '@mui/material';
import { Divider } from '@mui/material';

const RatingScale = lazy(() => import('../Components/RatingScale'));
const MobileRatingScale = lazy(() => import('../Components/MobileRatingScale'));

function GetRanked() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get('category') || 'Unknown Category';

  const [genderFilter, setGenderFilter] = useState('both');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ratingKey, setRatingKey] = useState(0);
  const [isComparisonToggled, setIsComparisonToggled] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const [showFeatureSelection, setShowFeatureSelection] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);
  const [swipeThreshold, setSwipeThreshold] = useState(50);
  const [swipeAnimation, setSwipeAnimation] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showGenderFilter, setShowGenderFilter] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Add vertical swipe handling to the mobile experience
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);
  const [isVerticalSwipe, setIsVerticalSwipe] = useState(false);

  // Add state for swipe indicators
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(true);

  const localVideoRef = useRef(null);
  const toast = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { userData, rating: localRating, loading: userLoading } = useUserData();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Custom hooks
  const localStream = useVideoStream();
  const { entities: entitiesList, isLoading } = useEntities(category, genderFilter);
  
  // Limit entities to 10 for the TikTok/Reels experience
  const limitedEntitiesList = useMemo(() => {
    return entitiesList.slice(0, 10);
  }, [entitiesList]);
  
  const currentEntity = limitedEntitiesList.length > 0 ? limitedEntitiesList[currentIndex] : null;
  const {
    ratedEntityData,
    entityRating,
    submitRating,
    ratingLoading,
    ratingError,
  } = useEntityRating(currentEntity);
  const { data: topRatedData, loading: topRatedLoading, error: topRatedError } = useTopRatedData();

  // Callback ref to set srcObject when video element is mounted
  const setVideoRef = (element) => {
    if (element && localStream) {
      element.srcObject = localStream;
    }
    localVideoRef.current = element;
  };

  // Calculate sorted rated data for global rankings
  const sortedRatedData = useMemo(() => {
    if (!topRatedData) return [];
    const ratedData = topRatedData.filter(item => item.totalRatings > 0);
    return [...ratedData].sort((a, b) => b.averageRating - a.averageRating);
  }, [topRatedData]);

  // Create a rank map for efficient rank lookup
  const rankMap = useMemo(() => {
    const map = {};
    sortedRatedData.forEach((item, index) => {
      const key = `${item.type}-${item.id}`;
      map[key] = `#${index + 1}`;
    });
    return map;
  }, [sortedRatedData]);

  // Calculate the current user's rank
  const userRank = useMemo(() => {
    if (!user || !rankMap) return 'N/A';
    return rankMap[`user-${user.uid}`] || 'N/A';
  }, [user, rankMap]);

  // Calculate the current entity's rank
  const entityRank = useMemo(() => {
    if (!currentEntity || !rankMap) return 'N/A';
    return rankMap[`${currentEntity.type}-${currentEntity.id}`] || 'N/A';
  }, [currentEntity, rankMap]);

  // Add useEffect to hide the indicator after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSwipeIndicator(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  // Prevent body scrolling when component is mounted
  useEffect(() => {
    // Save the original overflow style
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalHeight = window.getComputedStyle(document.body).height;
    const originalPosition = window.getComputedStyle(document.body).position;
    const originalWidth = window.getComputedStyle(document.body).width;
    const originalTop = window.getComputedStyle(document.body).top;
    
    // Disable scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = '0';
    
    // Additional properties for iOS
    document.body.style.overscrollBehavior = 'none';
    document.body.style.WebkitOverscrollBehavior = 'none';
    document.body.style.overscrollBehaviorY = 'none';
    document.body.style.WebkitOverscrollBehaviorY = 'none';
    
    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.height = originalHeight;
      document.body.style.position = originalPosition;
      document.body.style.width = originalWidth;
      document.body.style.top = originalTop;
      document.body.style.overscrollBehavior = '';
      document.body.style.WebkitOverscrollBehavior = '';
      document.body.style.overscrollBehaviorY = '';
    };
  }, []);

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
      // Submit the rating for the entity
      await submitRating(rating, featureAllocations);
      toast({
        title: 'Rating Submitted',
        description: `You rated ${currentEntity.name}: ${rating}`,
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      setRatingKey((prevKey) => prevKey + 1);
      
      // Automatically move to next entity after rating
      setTimeout(() => {
        handleNextPhoto();
      }, 500);

      // Update both the rater's and ratee's data in a single transaction
      await runTransaction(db, async (transaction) => {
        const today = new Date().toISOString().split('T')[0];

        // Update the rater's dailyTimesGiven (authenticated user)
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await transaction.get(userRef);
          if (!userSnap.exists()) {
            throw new Error('Rater user document does not exist');
          }
          const userData = userSnap.data();
          const raterDailyTimesGiven = userData.dailyTimesGiven || { date: '', count: 0 };
          if (raterDailyTimesGiven.date === today) {
            transaction.update(userRef, {
              'dailyTimesGiven.count': raterDailyTimesGiven.count + 1,
            });
          } else {
            transaction.update(userRef, {
              dailyTimesGiven: { date: today, count: 1 },
            });
          }
        }

        // Update the ratee's dailyTimesGiven and ratedCount (person being rated)
        if (currentEntity) {
          if (currentEntity.type === 'user') {
            const rateeRef = doc(db, 'users', currentEntity.id);
            const rateeSnap = await transaction.get(rateeRef);
            if (rateeSnap.exists()) {
              const rateeData = rateeSnap.data();
              const rateeDailyTimesGiven = rateeData.dailyTimesGiven || { date: '', count: 0 };
              const ratedCount = rateeData.ratedCount || 0;

              const updatedDailyTimesGiven = {
                date: today,
                count: rateeDailyTimesGiven.date === today ? rateeDailyTimesGiven.count + 1 : 1,
              };
              const updatedRatedCount = ratedCount + 1;

              transaction.update(rateeRef, {
                dailyTimesGiven: updatedDailyTimesGiven,
                ratedCount: updatedRatedCount,
              });
            } else {
              // Optionally create the ratee's document if it doesn't exist
              const newRateeData = {
                dailyTimesGiven: { date: today, count: 1 },
                ratedCount: 1,
                // Add any other required fields for a new user document
              };
              transaction.set(rateeRef, newRateeData);
            }
          }
        }
      });
      
      // Reset mobile rating state
      setShowFeatureSelection(false);
      setSelectedRating(null);
      setSwipeDirection(null);
    } catch (error) {
      console.error('Error in rating submission or Firestore transaction:', error.message, error.stack);
      toast({
        title: 'Rating Error',
        description: 'Failed to update rating or user data. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleNextPhoto = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setSwipeAnimation({
      transform: 'translateY(-100%)',
      transition: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
      willChange: 'transform'
    });
    
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        limitedEntitiesList.length > 0 ? (prevIndex + 1) % limitedEntitiesList.length : prevIndex
      );
      setRatingKey((prevKey) => prevKey + 1);
      setSwipeAnimation({
        transform: 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
        willChange: 'transform'
      });
      
      // Reset mobile rating state
      setShowFeatureSelection(false);
      setSelectedRating(null);
      setSwipeDirection(null);
      
      setTimeout(() => {
        setIsTransitioning(false);
        setSwipeAnimation(null);
      }, 300);
    }, 300);
  };

  const handlePreviousPhoto = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setSwipeAnimation({
      transform: 'translateY(100%)',
      transition: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
      willChange: 'transform'
    });
    
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        limitedEntitiesList.length > 0
          ? (prevIndex - 1 + limitedEntitiesList.length) % limitedEntitiesList.length
          : prevIndex
      );
      setRatingKey((prevKey) => prevKey + 1);
      setSwipeAnimation({
        transform: 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
        willChange: 'transform'
      });
      
      // Reset mobile rating state
      setShowFeatureSelection(false);
      setSelectedRating(null);
      setSwipeDirection(null);
      
      setTimeout(() => {
        setIsTransitioning(false);
        setSwipeAnimation(null);
      }, 300);
    }, 300);
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

  // Update the mobile swipe gesture handlers
  const handleTouchStart = (e) => {
    // Prevent default scrolling behavior
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
    setTouchStartY(touch.clientY);
    setTouchEndY(touch.clientY);
    setIsSwipeInProgress(true);
    setIsVerticalSwipe(false);
  };

  const handleTouchMove = (e) => {
    // Prevent default scrolling behavior
    e.preventDefault();
    e.stopPropagation();
    
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
    setTouchEndY(touch.clientY);
    
    // Determine if this is a vertical swipe
    const deltaX = Math.abs(touch.clientX - touchStart.x);
    const deltaY = Math.abs(touch.clientY - touchStartY);
    
    if (deltaY > deltaX && deltaY > 50) {
      setIsVerticalSwipe(true);
    }
  };

  const handleTouchEnd = (e) => {
    // Prevent default scrolling behavior
    e.preventDefault();
    e.stopPropagation();
    
    setIsSwipeInProgress(false);
    
    // Calculate swipe distances
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStartY;
    
    // If rating modal is open, don't allow vertical swipes
    if (showRatingModal) {
      return;
    }
    
    // If it's a vertical swipe, handle navigation
    if (isVerticalSwipe && Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        // Swipe down - go to previous user
        handlePreviousPhoto();
      } else {
        // Swipe up - go to next user
        handleNextPhoto();
      }
      return;
    }
    
    // Otherwise handle horizontal swipe for rating
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) {
        // Swipe left - high rating (6-10) - INVERTED
        setSelectedRating(8);
        setShowRatingModal(true);
      } else {
        // Swipe right - low rating (1-5) - INVERTED
        setSelectedRating(3);
        setShowRatingModal(true);
      }
    }
  };

  // Handle feature selection and rating submission
  const handleFeatureSelection = (featureScores) => {
    handleRatingSubmit(selectedRating, featureScores);
    setShowFeatureSelection(false);
    setSelectedRating(null);
  };

  const handleRate = (rating, selectedFeatures, featurePercentages) => {
    // Calculate feature scores based on percentages
    const featureScores = {};
    for (const feature in featurePercentages) {
      featureScores[feature] = (featurePercentages[feature] / 100) * rating;
    }

    // Submit the rating
    submitRating(rating, featureScores);
    setShowRatingModal(false);
    setSelectedRating(null);
    
    // Automatically move to next entity after rating
    setTimeout(() => {
      handleNextPhoto();
    }, 500);
  };

  const handleCancelRating = () => {
    setShowRatingModal(false);
    setSelectedRating(null);
  };

  return (
    <>
      <TopBar />
      <Flex 
        direction="column" 
        h="calc(100vh - 60px)"
        bg="black"
        overflow="hidden"
        position="relative"
        sx={{
          overscrollBehavior: 'none',
          WebkitOverscrollBehavior: 'none',
          overscrollBehaviorY: 'none',
          WebkitOverscrollBehaviorY: 'none',
        }}
      >
        <Container 
          maxW="100%"
          p={0}
          h="100%"
          overflow="hidden"
          position="relative"
          sx={{
            overscrollBehavior: 'none',
            WebkitOverscrollBehavior: 'none',
            overscrollBehaviorY: 'none',
            WebkitOverscrollBehaviorY: 'none',
          }}
        >
          <VStack spacing={0} align="stretch" h="100%" sx={{
            overscrollBehavior: 'none', // Prevent bounce effect
            WebkitOverscrollBehavior: 'none', // For Safari
            overscrollBehaviorY: 'none', // Prevent vertical bounce
            WebkitOverscrollBehaviorY: 'none', // For Safari
          }}>
            {/* Gender Filter - Only show on desktop */}
            {!isMobile && (
              <VStack align="center" mb={4}>
                <Text fontSize="lg" fontWeight="bold" fontFamily={'Matt Light'}>
                  Filter by Gender
                </Text>
                <Flex wrap="wrap" gap={2} justify="center" width={{ base: '100%', md: 'auto' }}>
                  {['male', 'female', 'both'].map((gender) => (
                    <Button
                      key={gender}
                      onClick={() => setGenderFilter(gender)}
                      colorScheme={genderFilter === gender ? 'blue' : 'gray'}
                      size="sm"
                      flex={{ base: '1 0 30%', md: 'none' }}
                      fontFamily={'Matt Bold'}
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.05)' }}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Button>
                  ))}
                </Flex>
              </VStack>
            )}

            {/* Feature Rating Comparison - Only show on desktop */}
            {!isComparisonToggled &&
              user &&
              !userLoading &&
              !ratingLoading &&
              userData &&
              ratedEntityData &&
              !isMobile && (
                <Box w="100%" p={4} bg="white" borderRadius="2xl" boxShadow={{ md: 'xl' }}>
                  <FeatureRatingComparison
                    chartData={chartData}
                    entityName={currentEntity?.name || 'Entity'}
                    isMobile={isMobile}
                  />
                </Box>
              )}

            {/* TikTok/Reels Style Vertical Scroll Container */}
            <Box
              position="relative"
              w="100%"
              h="100%"
              overflow="hidden"
              borderRadius={0}
              boxShadow="none"
              bg="black"
              flex="1"
            >
              {/* Entity Photo with ProfilePopover */}
              <ProfilePopover
                name={currentEntity?.name}
                photoUrl={currentEntity?.photo_url}
                rank={entityRank}
              >
                <Box
                  w="100%"
                  h="100%"
                  position="relative"
                  overflow="hidden"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  sx={{
                    ...swipeAnimation,
                    touchAction: 'none', // Prevent browser handling of touch events
                    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                    userSelect: 'none', // Prevent text selection
                    WebkitUserSelect: 'none', // For Safari
                    MozUserSelect: 'none', // For Firefox
                    msUserSelect: 'none', // For IE/Edge
                    overscrollBehavior: 'none', // Prevent bounce effect
                    WebkitOverscrollBehavior: 'none', // For Safari
                    overscrollBehaviorY: 'none', // Prevent vertical bounce
                    WebkitOverscrollBehaviorY: 'none', // For Safari
                  }}
                >
                  {isLoading || ratingLoading ? (
                    <Center h="100%">
                      <Spinner size="xl" color="blue.500" />
                    </Center>
                  ) : currentEntity ? (
                    <>
                      {!showRatingModal ? (
                        <>
                          <img
                            src={currentEntity.photo_url}
                            alt={currentEntity.name}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              transition: 'transform 0.3s ease-out',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              willChange: 'transform', // Optimize for animations
                            }}
                          />
                          
                          {/* Swipe Indicators */}
                          {showSwipeIndicator && (
                            <>
                              <Box
                                position="absolute"
                                top="20px"
                                left="0"
                                right="0"
                                display="flex"
                                justifyContent="center"
                                zIndex="10"
                                sx={{
                                  animation: 'fadeInOut 2s ease-in-out infinite',
                                  '@keyframes fadeInOut': {
                                    '0%': { opacity: 0.3 },
                                    '50%': { opacity: 1 },
                                    '100%': { opacity: 0.3 },
                                  },
                                }}
                              >
                                <Text
                                  fontSize="sm"
                                  color="white"
                                  bg="rgba(0,0,0,0.5)"
                                  px={2}
                                  py={1}
                                  borderRadius="md"
                                  fontFamily="Matt Light"
                                  backdropFilter="blur(4px)"
                                >
                                  Swipe up for next
                                </Text>
                              </Box>
                              <Box
                                position="absolute"
                                bottom="20px"
                                left="0"
                                right="0"
                                display="flex"
                                justifyContent="center"
                                zIndex="10"
                                sx={{
                                  animation: 'fadeInOut 2s ease-in-out infinite',
                                  '@keyframes fadeInOut': {
                                    '0%': { opacity: 0.3 },
                                    '50%': { opacity: 1 },
                                    '100%': { opacity: 0.3 },
                                  },
                                }}
                              >
                                <Text
                                  fontSize="sm"
                                  color="white"
                                  bg="rgba(0,0,0,0.5)"
                                  px={2}
                                  py={1}
                                  borderRadius="md"
                                  fontFamily="Matt Light"
                                  backdropFilter="blur(4px)"
                                >
                                  Swipe down for previous
                                </Text>
                              </Box>
                              <Box
                                position="absolute"
                                top="50%"
                                left="0"
                                right="0"
                                display="flex"
                                justifyContent="center"
                                zIndex="10"
                                sx={{
                                  animation: 'fadeInOut 2s ease-in-out infinite',
                                  '@keyframes fadeInOut': {
                                    '0%': { opacity: 0.3 },
                                    '50%': { opacity: 1 },
                                    '100%': { opacity: 0.3 },
                                  },
                                }}
                              >
                                <Text
                                  fontSize="sm"
                                  color="white"
                                  bg="rgba(0,0,0,0.5)"
                                  px={2}
                                  py={1}
                                  borderRadius="md"
                                  fontFamily="Matt Light"
                                  backdropFilter="blur(4px)"
                                >
                                  Swipe left for high rating, right for low
                                </Text>
                              </Box>
                            </>
                          )}
                          
                          {/* Navigation Arrows */}
                          <IconButton
                            aria-label="Previous Photo"
                            position="absolute"
                            left="10px"
                            top="50%"
                            transform="translateY(-50%)"
                            size="lg"
                            colorScheme="teal"
                            onClick={handlePreviousPhoto}
                            zIndex="1000"
                            rounded="full"
                            style={{
                              backgroundColor: 'rgba(0, 128, 128, 0.3)',
                              backdropFilter: 'blur(4px)',
                              transition: 'all 0.2s',
                            }}
                            _hover={{
                              backgroundColor: 'rgba(0, 128, 128, 0.5)',
                              transform: 'translateY(-50%) scale(1.1)',
                            }}
                            variant="ghost"
                            icon={<KeyboardArrowUp />}
                          />
                          <IconButton
                            aria-label="Next Photo"
                            position="absolute"
                            right="10px"
                            top="50%"
                            transform="translateY(-50%)"
                            size="lg"
                            colorScheme="teal"
                            onClick={handleNextPhoto}
                            zIndex="1000"
                            rounded="full"
                            style={{
                              backgroundColor: 'rgba(0, 128, 128, 0.3)',
                              backdropFilter: 'blur(4px)',
                              transition: 'all 0.2s',
                            }}
                            _hover={{
                              backgroundColor: 'rgba(0, 128, 128, 0.5)',
                              transform: 'translateY(-50%) scale(1.1)',
                            }}
                            variant="ghost"
                            icon={<KeyboardArrowDown />}
                          />
                          
                          {/* Progress Indicator */}
                          <HStack 
                            position="absolute" 
                            bottom="10px" 
                            left="0" 
                            right="0" 
                            justify="center" 
                            spacing={1}
                            zIndex="10"
                          >
                            {limitedEntitiesList.map((_, idx) => (
                              <Box
                                key={idx}
                                w="8px"
                                h="8px"
                                borderRadius="full"
                                bg={idx === currentIndex ? "white" : "rgba(255,255,255,0.5)"}
                                transition="all 0.3s"
                                _hover={{ transform: 'scale(1.2)' }}
                              />
                            ))}
                          </HStack>
                        </>
                      ) : (
                        <Box
                          position="absolute"
                          top={0}
                          left={0}
                          right={0}
                          bottom={0}
                          bg="white"
                          zIndex={1000}
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          justifyContent="center"
                          overflow="hidden"
                          height="100%"
                          width="100%"
                          animation="fadeIn 0.3s ease-out"
                          sx={{
                            '@keyframes fadeIn': {
                              '0%': { opacity: 0 },
                              '100%': { opacity: 1 },
                            },
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              position: 'absolute', 
                              top: 10, 
                              left: 0, 
                              right: 0, 
                              textAlign: 'center',
                              px: 2,
                              py: 1,
                              bg: 'rgba(0,0,0,0.05)',
                              borderRadius: 'md',
                              mx: 2,
                              maxWidth: '80%',
                              margin: '0 auto'
                            }}
                          >
                            Vertical swipes are locked until you submit your rating
                          </Typography>
                          <Suspense fallback={<CircularProgress size={60} color="primary" />}>
                            <MobileRatingScale 
                              selectedRating={selectedRating} 
                              onRate={handleRate} 
                              onCancel={handleCancelRating}
                            />
                          </Suspense>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Center h="100%">
                      <Text fontSize="lg" color="gray.500" fontFamily={'Matt Bold'}>
                        No entities available for the selected filter
                      </Text>
                    </Center>
                  )}
                  
                  {/* Entity Info Overlay */}
                  {currentEntity && !showRatingModal && (
                    <HStack
                      position="absolute"
                      bottom="40px"
                      left="10px"
                      color="white"
                      bg="rgba(0, 0, 0, 0.6)"
                      px={2}
                      py={1}
                      borderRadius="md"
                      spacing={1}
                      zIndex="10"
                      backdropFilter="blur(4px)"
                      transition="all 0.2s"
                      _hover={{ transform: 'translateY(-2px)' }}
                    >
                      <Text fontSize="sm" fontWeight="medium" fontFamily={'Matt Bold'}>
                        {currentEntity ? currentEntity.name : 'No User'}
                      </Text>
                      {currentEntity && !ratingLoading && !ratingError && (
                        <HStack spacing={1}>
                          <Star sx={{ fontSize: 16, color: '#FFD700' }} />
                          <Text fontSize="sm" fontWeight="medium" fontFamily={'Matt Bold'}>
                            {entityRating?.toFixed(1)}
                          </Text>
                        </HStack>
                      )}
                      {currentEntity && !ratingLoading && ratingError && (
                        <Text fontSize="sm" fontWeight="medium" fontFamily={'Matt Bold'}>
                          Rating unavailable
                        </Text>
                      )}
                    </HStack>
                  )}
                  
                  {/* Influencer Badge */}
                  {currentEntity && currentEntity.type === 'streamer' && !showRatingModal && (
                    <Box 
                      position="absolute" 
                      top="10px" 
                      right="10px" 
                      zIndex="10"
                      transition="all 0.2s"
                      _hover={{ transform: 'scale(1.1)' }}
                    >
                      <InfluencerGalleryCircle name={currentEntity.name} />
                    </Box>
                  )}
                </Box>
              </ProfilePopover>
            </Box>

            {/* Rating Scale - Only show on desktop */}
            {!isMobile && (
              <Suspense fallback={<Spinner />}>
                <Box
                  w="100%"
                  bg="white"
                  p={{ base: 4, md: 6 }}
                  borderRadius="2xl"
                  boxShadow={{ md: 'xl' }}
                  transition="all 0.3s"
                  _hover={{ transform: 'translateY(-2px)', boxShadow: '2xl' }}
                >
                  {currentEntity ? (
                    <RatingScale key={ratingKey} onRate={handleRatingSubmit} />
                  ) : (
                    <Text>No entities available for the selected filter.</Text>
                  )}
                </Box>
              </Suspense>
            )}
          </VStack>

          {/* Mobile Settings Icon for Gender Filter */}
          {isMobile && (
            <IconButton
              aria-label="Gender Filter"
              position="fixed"
              bottom="10px"
              right="10px"
              size="lg"
              colorScheme="teal"
              onClick={() => setShowGenderFilter(!showGenderFilter)}
              zIndex="1000"
              rounded="full"
              style={{
                backgroundColor: 'rgba(0, 128, 128, 0.3)',
                marginBottom: 55,
                backdropFilter: 'blur(4px)',
                transition: 'all 0.2s',
              }}
              _hover={{
                backgroundColor: 'rgba(0, 128, 128, 0.5)',
                transform: 'scale(1.1)',
              }}
              variant="ghost"
            >
              <Settings />
            </IconButton>
          )}

          {/* Mobile Gender Filter Modal */}
          {isMobile && showGenderFilter && (
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.3s ease-out',
                '@keyframes fadeIn': {
                  '0%': { opacity: 0 },
                  '100%': { opacity: 1 },
                },
              }}
            >
              <Box
                sx={{
                  width: '90%',
                  maxWidth: '400px',
                  bgcolor: 'white',
                  borderRadius: '12px',
                  p: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  animation: 'slideUp 0.3s ease-out',
                  '@keyframes slideUp': {
                    '0%': { transform: 'translateY(20px)', opacity: 0 },
                    '100%': { transform: 'translateY(0)', opacity: 1 },
                  },
                }}
              >
                <Typography variant="h6" fontWeight="bold" fontFamily="Matt Bold" textAlign="center">
                  Filter by Gender
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Stack spacing={2}>
                  {['male', 'female', 'both'].map((gender) => (
                    <Button
                      key={gender}
                      onClick={() => {
                        setGenderFilter(gender);
                        setShowGenderFilter(false);
                      }}
                      variant={genderFilter === gender ? 'contained' : 'outlined'}
                      color="primary"
                      fullWidth
                      sx={{ 
                        py: 1.5,
                        fontFamily: 'Matt Bold',
                        '&:hover': { transform: 'scale(1.02)' },
                        transition: 'all 0.2s'
                      }}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Button>
                  ))}
                </Stack>
                <Button
                  onClick={() => setShowGenderFilter(false)}
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  sx={{ mt: 2, py: 1.5 }}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          )}
        </Container>
      </Flex>
    </>
  );
}

export default GetRanked;