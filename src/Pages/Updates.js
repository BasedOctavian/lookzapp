import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUserData } from '../hooks/useUserData';
import {
  Flex,
  Box,
  Heading,
  Text,
  VStack,
  Spinner,
  Button,
  HStack,
  Separator, // Replaced Divider with Separator
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FiStar, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { CircularProgress, CircularProgressLabel } from '@chakra-ui/progress';
import { Avatar } from '@mui/material';





// Define Motion components (note: updated MotionSeparator instead of MotionDivider)
const MotionBox = motion(Box);
const MotionSeparator = motion(Separator); // Changed from MotionDivider
const MotionVStack = motion(VStack);

function Updates() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { userData, rating, loading } = useUserData(user?.uid);
  const [showNewGrade, setShowNewGrade] = useState(false);
  const [showNextButton, setShowNextButton] = useState(false);
  const location = useLocation();
  const initialRating = location.state?.initialRating || 0;
  const differential = (rating - initialRating).toFixed(1);

  // Feature colors for rating breakdown
  const featureColors = ['blue.400', 'pink.400', 'purple.400', 'teal.400', 'orange.400'];

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

  // Keyboard event listener for spacebar navigation
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
        <Spinner size="xl" color="blue.500" />
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
        boxShadow="sm"
      >
        <Flex justify="space-between" align="center" p={4}>
          <Heading
            as="h1"
            size="xl"
            color="blue.700"
            fontWeight="bold"
            cursor="pointer"
            onClick={() => navigate('/')}
          >
            Lookzapp
          </Heading>
          <HStack spacing={4}>
            <Button
              variant="link"
              color="blue.500"
              onClick={() => navigate('/top-rated-users')}
            >
              Top Rated Users
            </Button>
            <Button
              variant="link"
              color="red.500"
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Main Content */}
      <Flex flex={1} justify="center" align="center">
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          w={{ base: '90%', md: '800px' }}
          p={12}
          bg="white"
          borderRadius="lg"
          boxShadow="xl"
        >
          <VStack spacing={8} align="center">
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
                sx={{ width: 180, height: 180 }}
                borderRadius="full"
                boxShadow="md"
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
                <Text fontSize="3xl" fontWeight="bold" color="gray.700">
                  {initialRating}
                </Text>
                <Text fontSize="md" color="gray.500">
                  Old Grade
                </Text>
              </MotionVStack>

              {/* Vertical Separator */}
              <MotionSeparator
                orientation="vertical"
                size="md"
                colorPalette="gray"
                variant="solid"
                h="50px"
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
                <Text fontSize="3xl" fontWeight="bold" color="gray.700">
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
              {/* Horizontal Separator */}
              <Separator size="sm" colorPalette="gray" variant="solid" />

              <Heading size="md" fontWeight="semibold" color="blue.700">
                Rating Breakdown
              </Heading>

              <HStack spacing={8} justify="center" w="100%" flexWrap="wrap">
                {features.map((feature, index) => (
                  <VStack key={feature.key} spacing={3} align="center">
                    <CircularProgress
                      value={feature.percent}
                      color={featureColors[index]}
                      size="80px"
                      thickness="8px"
                    >
                      <CircularProgressLabel>
                        <Text fontSize="sm" fontWeight="bold">
                          {feature.percent}%
                        </Text>
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
                boxShadow="md"
                _hover={{ transform: 'scale(1.05)' }}
                transition="all 0.2s cubic-bezier(.27,.67,.47,1.6)"
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