import React from "react";
import { Box, HStack, VStack, Text, Spinner } from "@chakra-ui/react";
import { Avatar } from "@mui/material";
import { useTopRatedData } from "../hooks/useTopRatedData";
import { Link } from "react-router-dom";
import '../App.css';

const Leaderboard = () => {
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
    <Box
      bg="white"
      borderRadius="lg"
      p={6}
      boxShadow="lg"
      w="full"
      maxW="90vw"
      mx="auto"
      overflowX="auto" // Enable scrolling for more users
      whiteSpace="nowrap"
    >
      <Text
        fontSize="2xl"
        fontWeight="bold"
        color="black.600"
        mb={4}
        textAlign="center"
        fontFamily="Matt Bold"
      >
        🔥 Top Rated Users
      </Text>

      <HStack spacing={6} align="center">
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
            <VStack spacing={2} minW="120px">
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
                sx={{ width: 60, height: 60 }}
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
            </VStack>
          </Link>
        ))}
      </HStack>
    </Box>
  );
};

export default Leaderboard;
