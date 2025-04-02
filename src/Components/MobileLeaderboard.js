import React from "react";
import { Box, HStack, VStack, Text, Spinner } from "@chakra-ui/react";
import { Avatar } from "@mui/material";
import { useTopRatedData } from "../hooks/useTopRatedData";
import { Link } from "react-router-dom";
import "../App.css";

const MobileLeaderboard = () => {
  const { data, loading, error } = useTopRatedData();

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6} textAlign="center">
        <Text color="red.500" fontSize="lg">
          Error: {error}
        </Text>
      </Box>
    );
  }

  // Sort data by averageRating in descending order and take the top 10
  const sortedData = data.sort((a, b) => b.averageRating - a.averageRating);
  const top10 = sortedData.slice(0, 10);

  return (
    <VStack
      bg="white"
      borderRadius="lg"
      p={6}
      boxShadow="lg"
      w="full"
      maxW="100vw"
      mx="auto"
      spacing={4}
    >
      {/* Fixed Title */}
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color="black.600"
        textAlign="center"
        fontFamily="Matt Bold"
      >
        🔥 Top Rated Users
      </Text>

      {/* Scrollable Leaderboard */}
      <Box
        w="full"
        overflowX="auto"
        whiteSpace="nowrap"
        sx={{
          scrollbarWidth: "none", // Hide scrollbar for better UX
          "-ms-overflow-style": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        }}
      >
        <HStack spacing={6} align="center" justify="center" minW="max-content">
          {top10.map((user, index) => (
            <Link
              key={user.id}
              to={
                user.type === "streamer"
                  ? `/influencer-profile/${user.id}`
                  : `/profile/${user.id}`
              }
              style={{ textDecoration: "none" }}
            >
              <Box
                p={4}
                borderWidth="1px"
                borderRadius="lg"
                textAlign="center"
                minW="140px" // Adjust size for 1-3 users visible at a time
                display="flex"
                flexDirection="column"
                alignItems="center"
                _hover={{ boxShadow: "md" }}
              >
                <Text
                  fontSize="lg"
                  fontWeight="bold"
                  color="gray.600"
                  fontFamily="Matt Light Italic"
                >
                  #{index + 1}
                </Text>
                <Avatar
                  src={user.profilePicture}
                  alt={user.displayName}
                  sx={{ width: 80, height: 80 }}
                />
                <Text
                  fontSize="md"
                  fontWeight="medium"
                  fontFamily="Matt Bold"
                  color="black.600"
                >
                  {user.displayName}
                </Text>
                <Text
                  fontSize="md"
                  fontWeight="bold"
                  color="blue.500"
                  fontFamily="Matt Light"
                >
                  {user.averageRating.toFixed(1)}
                </Text>
              </Box>
            </Link>
          ))}
        </HStack>
      </Box>
    </VStack>
  );
};

export default MobileLeaderboard;
