import { useState, useRef, useEffect } from 'react';
import { HStack, VStack, Text, Box } from '@chakra-ui/react';
import { Tooltip } from '@mui/material';
import '../App.css';

// Variation 4: Card-Style Badges with MUI Tooltip for Description
function BadgeVariation4({ earnedBadges }) {
  const [maxDimensions, setMaxDimensions] = useState({ width: 0, height: 0 });
  const badgeRefs = useRef([]);

  useEffect(() => {
    if (badgeRefs.current.length === earnedBadges.length) {
      const widths = badgeRefs.current.map(ref => ref?.offsetWidth || 0);
      const heights = badgeRefs.current.map(ref => ref?.offsetHeight || 0);
      const maxWidth = Math.max(...widths);
      const maxHeight = Math.max(...heights);
      setMaxDimensions({ width: maxWidth, height: maxHeight });
    }
  }, [earnedBadges]);

  return (
    <HStack spacing={4} justify="center" mt={4} flexWrap="wrap">
      {earnedBadges.length > 0 ? (
        earnedBadges.map((badge, index) => (
          <BadgeWithTooltip
            key={badge.name}
            badge={badge}
            badgeRef={(el) => (badgeRefs.current[index] = el)}
            maxWidth={maxDimensions.width}
            maxHeight={maxDimensions.height}
          />
        ))
      ) : (
        <Text fontSize="sm" color="gray.500">
          
        </Text>
      )}
    </HStack>
  );
}

// Component to handle MUI Tooltip for each badge
function BadgeWithTooltip({ badge, badgeRef, maxWidth, maxHeight }) {
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
        width={maxWidth > 0 ? `${maxWidth}px` : 'auto'}
        height={maxHeight > 0 ? `${maxHeight}px` : 'auto'}
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
          fontFamily={'Matt Light'}
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