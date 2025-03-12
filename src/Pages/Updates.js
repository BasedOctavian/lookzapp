import { Flex, Box, Heading, Text, VStack, Spinner, Button, HStack } from '@chakra-ui/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import { Avatar } from '@chakra-ui/avatar';
import { Divider } from '@mui/material';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiStar, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { CircularProgress, CircularProgressLabel } from '@chakra-ui/progress';

const MotionBox = motion(Box);
const MotionDivider = motion(Divider);
const MotionVStack = motion(VStack);

function Updates() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { userData, rating, loading } = useUserData(user?.uid);
  const [showNewGrade, setShowNewGrade] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const featureColors = ['blue.400', 'pink.400', 'purple.400', 'teal.400', 'orange.400'];
  const location = useLocation();
  const initialRating = location.state?.initialRating || 0;
  const differential = (rating - initialRating).toFixed(1);

  // Timer for showing the new grade after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNewGrade(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Timer for showing the Next button after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNextButton(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard event listener for spacebar navigation after 4 seconds
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === ' ' && showNextButton) {
        navigate('/video-call');
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showNextButton, navigate]);

  // Calculate feature percentages
  const calculatePercentages = () => {
    const {
      eyesRating = 0,
      smileRating = 0,
      facialRating = 0,
      hairRating = 0,
      bodyRating = 0,
    } = userData || {};

    const totalFeatureRating =
      eyesRating + smileRating + facialRating + hairRating + bodyRating;

    let percentages = {
      eyes: totalFeatureRating ? (eyesRating / totalFeatureRating) * 100 : 0,
      smile: totalFeatureRating ? (smileRating / totalFeatureRating) * 100 : 0,
      facial: totalFeatureRating ? (facialRating / totalFeatureRating) * 100 : 0,
      hair: totalFeatureRating ? (hairRating / totalFeatureRating) * 100 : 0,
      body: totalFeatureRating ? (bodyRating / totalFeatureRating) * 100 : 0,
    };

    const totalPercentage = Object.values(percentages).reduce((a, b) => a + b, 0);
    const scale = totalPercentage > 0 ? 100 / totalPercentage : 1;
    Object.keys(percentages).forEach((key) => {
      percentages[key] = Math.round(percentages[key] * scale);
    });

    let adjustedTotal = Object.values(percentages).reduce((a, b) => a + b, 0);
    if (adjustedTotal !== 100) {
      const maxKey = Object.keys(percentages).reduce((a, b) =>
        percentages[a] > percentages[b] ? a : b
      );
      percentages[maxKey] += 100 - adjustedTotal;
    }

    return percentages;
  };

  const percentages = calculatePercentages();
  const features = [
    { key: 'eyes', label: 'Eyes', percent: percentages.eyes },
    { key: 'smile', label: 'Smile', percent: percentages.smile },
    { key: 'facial', label: 'Jawline', percent: percentages.facial },
    { key: 'hair', label: 'Hair', percent: percentages.hair },
    { key: 'body', label: 'Physique', percent: percentages.body },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <Flex minH="100vh" bgGradient="linear(to-br, gray.50, blue.100)" justify="center" align="center">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Flex direction="column" minH="100vh" bgGradient="linear(to-br, gray.50, blue.100)">
      {/* Header */}
      <Box
        position="sticky"
        top="0"
        w="100%"
        bg="rgba(255, 255, 255, 0.8)"
        backdropFilter="blur(10px)"
        zIndex="sticky"
        borderBottomWidth="1px"
      >
        <Flex justify="space-between" align="center" p={4}>
          <Heading
            as="h1"
            size="xl"
            color="blue.700"
            fontWeight="bold"
            textShadow="1px 1px 2px rgba(0, 0, 0, 0.1)"
            cursor="pointer"
            onClick={() => navigate('/')}
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
      </Box>

      {/* Main Content */}
      <Flex flex={1} justify="center" align="center" style={{ backgroundColor: 'rgb(29, 78, 216)' }}>
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          w={{ base: '90%', md: '800px' }}
          p={12}
          bg="white"
          borderRadius="lg"
          boxShadow="md"
        >
          <VStack spacing={6} align="center">
            {/* Avatar with Differential Indicator */}
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              position="relative"
            >
              <Avatar
                src={userData?.profilePicture}
                name={userData?.displayName}
                boxSize="200px"
                borderRadius="full"
              />
              {/* Differential Indicator */}
              <MotionBox
                position="absolute"
                bottom="-10px"
                right="-10px"
                bg={differential >= 0 ? 'green.100' : 'red.100'}
                borderRadius="full"
                p={2}
                boxShadow="md"
                initial={{ opacity: 0 }}
                animate={{ opacity: showNewGrade ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <HStack spacing={1} align="center">
                  {differential >= 0 ? (
                    <FiArrowUp size={20} color="green.600" />
                  ) : (
                    <FiArrowDown size={20} color="red.600" />
                  )}
                  <Text
                    fontSize="lg"
                    fontWeight="bold"
                    color={differential >= 0 ? 'green.600' : 'red.600'}
                  >
                    {`${differential >= 0 ? '+' : ''}${differential}`}
                  </Text>
                </HStack>
              </MotionBox>
            </MotionBox>

            {/* Name */}
            <MotionBox
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Heading size="2xl" mb={6} color="blue.700">
                {userData?.displayName}
              </Heading>
            </MotionBox>

            {/* Grades */}
            <Flex align="center" w="100%" justify="center">
              {/* Old Grade */}
              <MotionVStack
                spacing={5}
                align="center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <Text fontSize="3xl" fontWeight="bold">
                  {initialRating}
                </Text>
                <Text fontSize="md" color="gray.500">
                  Old Grade
                </Text>
              </MotionVStack>

              {/* Divider */}
              <MotionDivider
                orientation="vertical"
                height="50px"
                mx={6}
                initial={{ opacity: 0 }}
                animate={{ opacity: showNewGrade ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              />

              {/* New Grade */}
              <MotionVStack
                spacing={5}
                align="center"
                initial={{ opacity: 0 }}
                animate={{ opacity: showNewGrade ? 1 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <Text fontSize="3xl" fontWeight="bold">
                  {rating.toFixed(1)}
                </Text>
                <Text fontSize="md" color="gray.500">
                  New Grade
                </Text>
              </MotionVStack>
            </Flex>

            {/* Feature Progress */}
            <MotionVStack
              spacing={6}
              w="100%"
              initial={{ opacity: 0 }}
              animate={{ opacity: showNewGrade ? 1 : 0 }}
              transition={{ duration: 0.5 }}
            >
              <Divider />
              <Heading size="md" fontWeight="semibold" color="blue.700">
                Rating Breakdown
              </Heading>

              <HStack spacing={8} justify="center" w="100%">
                {features.map((feature, index) => (
                  <VStack key={feature.key} spacing={3} align="center">
                    <CircularProgress
                      value={feature.percent}
                      color={featureColors[index]}
                      size="80px"
                      thickness="8px"
                    >
                      <CircularProgressLabel>
                        <Box position="relative">
                          <Text
                            fontSize="sm"
                            fontWeight="bold"
                            position="absolute"
                            top="50%"
                            left="50%"
                            transform="translate(-50%, -50%)"
                            mt={1}
                          >
                            {feature.percent}%
                          </Text>
                        </Box>
                      </CircularProgressLabel>
                    </CircularProgress>
                    <Text fontSize="lg" fontWeight="medium" color="gray.700">
                      {feature.label}
                    </Text>
                  </VStack>
                ))}
              </HStack>
            </MotionVStack>

            {/* Next Button */}
            {showNextButton && (
              <Button
                colorScheme="blue"
                onClick={() => navigate('/video-call')}
                mt={4}
              >
                Next
              </Button>
            )}
          </VStack>
        </MotionBox>
      </Flex>
    </Flex>
  );
}

export default Updates;