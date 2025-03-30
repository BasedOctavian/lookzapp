import { HStack, VStack, Text, Box } from '@chakra-ui/react';
import '../App.css'; 

function InfluencerTopStats({ influencerData }) {
  // If no data or no ratings, display a message
  if (!influencerData || influencerData.timesRanked === 0) {
    return <Text fontSize="lg" color="gray.500">No ratings yet</Text>;
  }

  // Define features with their ratings and emojis
  const features = [
    { name: 'Eyes', emoji: '👀', average: (influencerData.eyesRating || 0) / influencerData.timesRanked },
    { name: 'Smile', emoji: '😊', average: (influencerData.smileRating || 0) / influencerData.timesRanked },
    { name: 'Jawline', emoji: '🧔', average: (influencerData.facialRating || 0) / influencerData.timesRanked },
    { name: 'Hair', emoji: '💇', average: (influencerData.hairRating || 0) / influencerData.timesRanked },
    { name: 'Body', emoji: '💪', average: (influencerData.bodyRating || 0) / influencerData.timesRanked },
  ];

  // Find best and worst features
  const bestFeature = features.reduce((prev, current) => 
    prev.average > current.average ? prev : current
  );
  const worstFeature = features.reduce((prev, current) => 
    prev.average < current.average ? prev : current
  );

  return (
    <HStack spacing={8} justify="center">
      <Box p={4} shadow="md" borderWidth="1px" bg="gray.100" borderRadius="md">
        <VStack>
          <Text fontSize="lg" fontWeight="bold" fontFamily={'Matt Light'}>Best Feature</Text>
          <Text fontSize="2xl">{bestFeature.emoji}</Text>
          <Text fontFamily={'Matt Light'}>{bestFeature.name}</Text>
        </VStack>
      </Box>
      <Box p={4} shadow="md" borderWidth="1px" bg="gray.100" borderRadius="md">
        <VStack>
          <Text fontSize="lg" fontWeight="bold" fontFamily={'Matt Light'}>Worst Feature</Text>
          <Text fontSize="2xl">{worstFeature.emoji}</Text>
          <Text fontFamily={'Matt Light'}>{worstFeature.name}</Text>
        </VStack>
      </Box>
    </HStack>
  );
}

export default InfluencerTopStats;