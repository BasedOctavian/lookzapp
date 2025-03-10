import React, { useState } from 'react';
import { Box, Button, Text, Wrap, WrapItem } from '@chakra-ui/react';

function RatingScale({ onRate }) {
  const [selectedRating, setSelectedRating] = useState(null);

  const handleRate = (rating) => {
    setSelectedRating(rating);
    onRate(rating);
  };

  return (
    <Box p={{ base: 2, md: 4 }} bg="white" borderRadius="md" boxShadow="md">
      <Text fontSize={{ base: 'md', md: 'lg' }} mb={2} textAlign="center">
        Rate the other person:
      </Text>
      <Wrap spacing={{ base: 1, md: 2 }} justify="center">
        {[...Array(10)].map((_, i) => {
          const rating = i + 1;
          return (
            <WrapItem key={rating} w={{ base: '20%', md: 'auto' }}>
              <Button
                colorScheme={selectedRating === rating ? 'blue' : 'gray'}
                variant="outline"
                onClick={() => handleRate(rating)}
                size={{ base: 'sm', md: 'md' }}
                aria-label={`Rate ${rating}`}
                w="100%"
              >
                {rating}
              </Button>
            </WrapItem>
          );
        })}
      </Wrap>
    </Box>
  );
}

export default RatingScale;