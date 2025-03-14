import React, { useState } from 'react';
import { Box, Button, Heading, Text, VStack, HStack, useToken } from '@chakra-ui/react';
import { Fade } from '@chakra-ui/transition';

const RatingScale = ({ onRate }) => {
  const [selectedRating, setSelectedRating] = useState(null);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showCategories, setShowCategories] = useState(false);
  const [blue400, pink400, purple400, teal400, orange400] = useToken('colors', [
    'blue.400',
    'pink.400',
    'purple.400',
    'teal.400',
    'orange.400',
  ]);

  const categories = [
    { category: 'Eyes', emoji: '👀', color: blue400 },
    { category: 'Smile', emoji: '😊', color: pink400 },
    { category: 'Jawline', emoji: '👤', color: purple400 },
    { category: 'Hair', emoji: '💇', color: teal400 },
    { category: 'Body', emoji: '💪', color: orange400 },
  ];

  const handleNumberClick = (rating) => {
    setSelectedRating(rating);
    setShowNumbers(false);
    setShowCategories(true);
  };

  const handleCategoryClick = (category) => {
    onRate(selectedRating, category);
    setShowCategories(false);
  };

  return (
    <Box textAlign="center" mt={4} p={6} bg="white" borderRadius="2xl" boxShadow="xl">
      <Fade in={showNumbers}>
        {showNumbers && (
          <>
            <Heading size="md" mb={6} color="gray.700" fontWeight="semibold">
              How would you rate this appearance?
            </Heading>
            <HStack wrap="wrap" gap={3} justify="center">
              {[...Array(10)].map((_, i) => (
                <Button
                  key={i + 1}
                  size="lg"
                  borderRadius="full"
                  bgGradient="linear(to-br, blue.400, purple.500)"
                  color="white"
                  _hover={{ transform: 'scale(1.1)', boxShadow: 'lg' }}
                  onClick={() => handleNumberClick(i + 1)}
                  transition="all 0.2s cubic-bezier(.27,.67,.47,1.6)"
                  fontSize="lg"
                  fontWeight="bold"
                  boxShadow="md"
                >
                  {i + 1}
                </Button>
              ))}
            </HStack>
          </>
        )}
      </Fade>
      <Fade in={showCategories}>
        {showCategories && (
          <VStack spacing={4}>
            <Heading size="md" color="gray.700" fontWeight="semibold">
              Select the most impressive feature
              <Text fontSize="sm" color="gray.500" mt={1}>
                (You rated {selectedRating}/10)
              </Text>
            </Heading>
            <HStack wrap="wrap" gap={5} justify="center" w="100%" style={{ marginTop: '1rem' }}>
              {categories.map(({ category, emoji, color }) => (
                <Button
                  key={category}
                  p={3}
                  borderRadius="xl"
                  borderWidth="2px"
                  borderColor="gray.100"
                  _hover={{
                    transform: 'scale(1.05)',
                    borderColor: color,
                    boxShadow: `0 0 12px ${color}`,
                  }}
                  style={{ backgroundColor: color, height: '100px', width: '100px' }}
                  transition="all 0.2s cubic-bezier(.27,.67,.47,1.6)"
                  onClick={() => handleCategoryClick(category)}
                >
                  <VStack spacing={2}>
                    <Text fontSize="4xl" style={{ lineHeight: 1 }}>{emoji}</Text>
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      color="gray.700"
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      {category}
                    </Text>
                  </VStack>
                </Button>
              ))}
            </HStack>
          </VStack>
        )}
      </Fade>
    </Box>
  );
};

export default RatingScale;