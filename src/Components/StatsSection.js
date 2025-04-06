import React from 'react';
import { Box, SimpleGrid, Icon, Text, Flex, VStack, Heading } from '@chakra-ui/react';
import { FaStar, FaTrophy, FaEye, FaChartLine } from 'react-icons/fa';
import '../App.css';
import { time } from '@tensorflow/tfjs';

const StatItem = ({ icon, label, value, color }) => (
  <Flex
    align="center"
    p={8}
    bg="white"
    borderRadius="lg"
    boxShadow="sm"
    w="full" // Already full width, reinforcing it
    h="full" // Ensure it takes full height of its container
    justify="flex-start" // Align content to the start for consistency
    _hover={{ boxShadow: 'md', transform: 'scale(1.02)', transition: '0.2s ease-in-out' }}
  >
    <Icon as={icon} color={color} w={7} h={7} mr={3} />
    <VStack align="start" spacing={0} flex="1">
      <Text fontSize="sm" color="black.600" fontWeight="medium" fontFamily={'Matt Bold'}>
        {label}
      </Text>
      <Text fontSize="lg" fontWeight="bold" color="gray.600" fontFamily={'Matt Light'}>
        {value}
      </Text>
    </VStack>
  </Flex>
);

const StatsSection = ({ rating, bestFeature, ranking, timesRanked }) => {
  const bestFeatureValue =
    bestFeature && bestFeature.average > 0
      ? `${bestFeature.name}`
      : 'Not rated yet';

  return (
    <Box bg="white" borderRadius="lg" p={6} boxShadow="md" style={{  }}>
      <Heading as="h2" size="lg" mb={4} fontFamily={'Matt Bold'} color="black.600">
        Your Stats
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={8} style={{  }}>
        <StatItem icon={FaStar} label="Rating" value={rating.toFixed(1)} color="yellow.500" />
        <StatItem
          icon={FaTrophy}
          label="World Rank"
          value={typeof ranking === 'number' ? `#${ranking}` : 'N/A'}
          color="gray.600"
        />
        <StatItem icon={FaEye} label="Times Ranked" value={timesRanked} color="blue.500" />
        <StatItem icon={FaChartLine} label="Best Feature" value={bestFeatureValue} color="green.500" />
      </SimpleGrid>
    </Box>
  );
};

export default StatsSection;