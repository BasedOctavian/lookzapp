// src/Components/Badges.js
import { HStack, VStack, Text, Badge, Box } from '@chakra-ui/react';

// Variation 1: Classic Emoji with Text
function BadgeVariation1({ earnedBadges }) {
  return (
    <HStack spacing={4} justify="center" mt={4}>
      {earnedBadges.length > 0 ? (
        earnedBadges.map((badge) => (
          <VStack key={badge.name}>
            <Text fontSize="2xl">{badge.emoji}</Text>
            <Text fontSize="sm" color="gray.600">
              {badge.name}
            </Text>
          </VStack>
        ))
      ) : (
        <Text fontSize="sm" color="gray.500">
          No badges yet
        </Text>
      )}
    </HStack>
  );
}

// Variation 2: Badge with Subtle Background
function BadgeVariation2({ earnedBadges }) {
  return (
    <HStack spacing={6} justify="center" mt={4}>
      {earnedBadges.length > 0 ? (
        earnedBadges.map((badge) => (
          <VStack key={badge.name}>
            <Badge
              variant="subtle"
              colorScheme="blue"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="lg"
            >
              {badge.emoji}
            </Badge>
            <Text fontSize="sm" color="gray.600" fontWeight="medium">
              {badge.name}
            </Text>
          </VStack>
        ))
      ) : (
        <Text fontSize="sm" color="gray.500" fontStyle="italic">
          No badges yet
        </Text>
      )}
    </HStack>
  );
}

// Variation 3: Icon-Text Horizontal Layout
function BadgeVariation3({ earnedBadges }) {
  return (
    <HStack spacing={4} justify="center" mt={4} flexWrap="wrap">
      {earnedBadges.length > 0 ? (
        earnedBadges.map((badge) => (
          <HStack key={badge.name} spacing={2}>
            <Text fontSize="xl">{badge.emoji}</Text>
            <Text fontSize="md" color="gray.700" fontWeight="medium">
              {badge.name}
            </Text>
          </HStack>
        ))
      ) : (
        <Text fontSize="sm" color="gray.500">
          No badges yet
        </Text>
      )}
    </HStack>
  );
}

// Variation 4: Card-Style Badges
function BadgeVariation4({ earnedBadges }) {
  return (
    <HStack spacing={4} justify="center" mt={4} flexWrap="wrap">
      {earnedBadges.length > 0 ? (
        earnedBadges.map((badge) => (
          <Box
            key={badge.name}
            bg="gray.50"
            p={3}
            borderRadius="md"
            boxShadow="sm"
            textAlign="center"
            minW="100px"
          >
            <Text fontSize="2xl">{badge.emoji}</Text>
            <Text fontSize="sm" color="gray.700" fontWeight="medium" mt={1}>
              {badge.name}
            </Text>
          </Box>
        ))
      ) : (
        <Text fontSize="sm" color="gray.500">
          No badges yet
        </Text>
      )}
    </HStack>
  );
}

// Main component stacking all variations vertically
function Badges({ earnedBadges }) {
  return (
    <VStack spacing={8} align="stretch">
      <VStack>
        <BadgeVariation4 earnedBadges={earnedBadges} />
      </VStack>
    </VStack>
  );
}

export default Badges;