import { useState, useRef, useEffect } from 'react';
import { HStack, VStack, Text, Box } from '@chakra-ui/react';
import { Tooltip } from '@mui/material';

// Variation 4: Card-Style Badges with MUI Tooltip for Description
function BadgeVariation4({ earnedBadges }) {
  const [maxDimensions, setMaxDimensions] = useState({ width: 0, height: 0 });

  // Callback to update max dimensions based on badge sizes
  const updateMaxDimensions = (width, height) => {
    setMaxDimensions((prev) => ({
      width: Math.max(prev.width, width),
      height: Math.max(prev.height, height),
    }));
  };

  return (
    <HStack spacing={4} justify="center" mt={4} flexWrap="wrap">
      {earnedBadges.length > 0 ? (
        earnedBadges.map((badge) => (
          <BadgeWithTooltip
            key={badge.name}
            badge={badge}
            updateMaxDimensions={updateMaxDimensions}
            maxWidth={maxDimensions.width}
            maxHeight={maxDimensions.height}
          />
        ))
      ) : (
        <Text fontSize="sm" color="gray.500">
          No badges yet
        </Text>
      )}
    </HStack>
  );
}

// Component to handle MUI Tooltip for each badge
function BadgeWithTooltip({ badge, updateMaxDimensions, maxWidth, maxHeight }) {
  const badgeRef = useRef(null);

  useEffect(() => {
    if (badgeRef.current) {
      const { offsetWidth, offsetHeight } = badgeRef.current;
      updateMaxDimensions(offsetWidth, offsetHeight);
    }
  }, [badge, updateMaxDimensions]);

  return (
    <Tooltip title={badge.description} arrow placement="bottom">
      <Box
        ref={badgeRef}
        cursor="pointer"
        bg="gray.50"
        p={3}
        borderRadius="md"
        boxShadow="sm"
        textAlign="center"
        width={maxWidth > 0 ? `${maxWidth}px` : 'auto'} // Apply max width if set
        height={maxHeight > 0 ? `${maxHeight}px` : 'auto'} // Apply max height if set
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        role="button"
        tabIndex={0}
      >
        <Text fontSize="2xl">{badge.emoji}</Text>
        <Text
          fontSize="sm"
          color="gray.700"
          fontWeight="medium"
          mt={1}
          whiteSpace="nowrap"
        >
          {badge.name}
        </Text>
      </Box>
    </Tooltip>
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