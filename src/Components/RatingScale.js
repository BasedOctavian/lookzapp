import React, { useState } from 'react';
import { Box, Button, Heading, Text, VStack, HStack, Badge } from '@chakra-ui/react';
import { Fade } from '@chakra-ui/transition';
import { Slider, SliderTrack, SliderFilledTrack, SliderThumb } from '@chakra-ui/slider';

const RatingScale = ({ onRate }) => {
  const [selectedRating, setSelectedRating] = useState(null);
  const [showNumbers, setShowNumbers] = useState(true);
  const [showSliders, setShowSliders] = useState(false);

  const categories = [
    { category: 'Eyes', emoji: '👀', color: 'blue.400' },
    { category: 'Smile', emoji: '😊', color: 'pink.400' },
    { category: 'Jawline', emoji: '🦴', color: 'purple.400' },
    { category: 'Hair', emoji: '💇', color: 'teal.400' },
    { category: 'Body', emoji: '💪', color: 'orange.400' },
  ];

  const [featurePercentages, setFeaturePercentages] = useState(() => {
    const initialPercentage = 100 / categories.length;
    return categories.reduce((acc, { category }) => {
      acc[category] = initialPercentage;
      return acc;
    }, {});
  });

  const handleNumberClick = (rating) => {
    setSelectedRating(rating);
    setShowNumbers(false);
    setShowSliders(true);
  };

  const handlePercentageChange = (changedFeature, newValue) => {
    setFeaturePercentages((prev) => {
      const prevTotalExcludingFeature = 100 - prev[changedFeature];
      const newTotalExcludingFeature = 100 - newValue;
      const scaleFactor = prevTotalExcludingFeature > 0 ? newTotalExcludingFeature / prevTotalExcludingFeature : 0;

      const newPercentages = { ...prev };
      for (const feature in prev) {
        if (feature === changedFeature) {
          newPercentages[feature] = newValue;
        } else {
          newPercentages[feature] = prev[feature] * scaleFactor;
        }
      }
      return newPercentages;
    });
  };

  const total = categories.reduce((acc, { category }) => acc + (featurePercentages[category] / 100) * selectedRating, 0);
  const isTotalMatching = Math.abs(total - selectedRating) < 0.01;

  return (
    <Box p={16} bg="white" borderRadius="2xl" boxShadow="2xl">
      <Fade in={showNumbers}>
        {showNumbers && (
          <VStack spacing={8}>
            <Heading size="2xl">Rate This Appearance</Heading>
            <HStack wrap="wrap" gap={6} justify="center">
              {[...Array(10)].map((_, i) => (
                <Button
                  key={i + 1}
                  width="5rem"
                  height="5rem"
                  borderRadius="full"
                  bgGradient="linear(to-br, blue.400, purple.500)"
                  color="white"
                  _hover={{ transform: 'scale(1.1)' }}
                  onClick={() => handleNumberClick(i + 1)}
                  fontSize="2xl"
                >
                  {i + 1}
                </Button>
              ))}
            </HStack>
          </VStack>
        )}
      </Fade>

      <Fade in={showSliders}>
        {showSliders && (
          <VStack spacing={10}>
            <Heading size="2xl">Allocate Your Rating Points</Heading>
            {categories.map(({ category, emoji, color }) => (
              <Box key={category} w="100%" bg="gray.50" p={6} borderRadius="lg">
                <HStack justify="space-between" mb={4}>
                  <HStack>
                    <Text fontSize="3xl">{emoji}</Text>
                    <Text fontSize="xl" fontWeight="semibold">{category}</Text>
                  </HStack>
                  <Text fontSize="lg">
                    {featurePercentages[category].toFixed(1)}% ({((featurePercentages[category] / 100) * selectedRating).toFixed(1)} pts)
                  </Text>
                </HStack>
                <Slider
                  value={featurePercentages[category]}
                  onChange={(val) => handlePercentageChange(category, val)}
                  min={0}
                  max={100}
                  step={0.1}
                >
                  <SliderTrack h="8" bg="gray.200">
                    <SliderFilledTrack
                      bg={`linear-gradient(to right, ${color.replace('400', '100')} 0%, ${color} 40%, ${color} 100%)`}
                    />
                  </SliderTrack>
                  <SliderThumb width="2px" height="20px" bg="black" style={{ marginTop: -130 }}/>
                </Slider>
              </Box>
            ))}
            <HStack>
              <Text fontSize="xl" fontWeight="bold" color={isTotalMatching ? 'green.500' : 'red.500'}>
                Total Points: {total.toFixed(2)} / {selectedRating}
              </Text>
              <Badge colorScheme={isTotalMatching ? 'green' : 'red'}>
                {isTotalMatching ? 'Ready to submit' : 'Adjust percentages'}
              </Badge>
            </HStack>
            <Button
              width="full"
              height="60px"
              fontSize="lg"
              bgGradient="linear(to-r, purple.400, blue.500)"
              color="white"
              onClick={() => {
                const featureScores = {};
                for (const feature in featurePercentages) {
                  featureScores[feature] = (featurePercentages[feature] / 100) * selectedRating;
                }
                onRate(selectedRating, featureScores);
              }}
            >
              Submit Final Rating
            </Button>
          </VStack>
        )}
      </Fade>
    </Box>
  );
};

export default RatingScale;