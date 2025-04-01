// ImprovedStatsSection.js
import React from 'react';
import { Box, VStack, Heading, SimpleGrid, Icon, Text, Flex } from '@chakra-ui/react';
import { FaStar, FaTrophy, FaEye, FaChartLine } from 'react-icons/fa';
import '../App.css';

const StatItem = ({ icon, label, value, color }) => (
  <Flex
    align="center"
    p={4}
    bg="gray.50"
    borderRadius="lg"
    boxShadow="sm"
    w="full"
    _hover={{ boxShadow: 'md', transform: 'scale(1.02)', transition: '0.2s ease-in-out' }}
  >
    <Icon as={icon} color={color} w={7} h={7} mr={3} />
    <VStack align="start" spacing={0}>
      <Text fontSize="sm" color="gray.500" fontWeight="medium" fontFamily={'Matt Bold'}>
        {label}
      </Text>
      <Text fontSize="lg" fontWeight="bold" color="gray.800" fontFamily={'Matt Light'}>
        {value}
      </Text>
    </VStack>
  </Flex>
);

const StatsSection = ({ rating }) => {
  return (
    <Box bg="white" borderRadius="lg" p={6} boxShadow="md" style={{marginTop: 16}}>
      <Heading size="md" mb={4} color="gray.800">
        Your Stats
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={8} style={{marginBottom: 17}}>
        <StatItem icon={FaStar} label="Rating" value={rating.toFixed(1)} color="yellow.500" />
        <StatItem icon={FaTrophy} label="World Rank" value="#TBD" color="gray.500" />
        <StatItem icon={FaEye} label="Total Ratings Given" value="42" color="blue.500" />
        <StatItem icon={FaChartLine} label="Avg Feature Rating" value="7.5" color="green.500" />
      </SimpleGrid>
    </Box>
  );
};

export default StatsSection;
