import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  Grid,
  Text,
  Spinner,
  Box,
  Container,
  VStack,
  Heading,
  Flex,
  HStack,
  Button,
} from "@chakra-ui/react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@chakra-ui/toast";

export default function TopRatedUsersGrid() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { signOut } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          displayName: doc.data().displayName || "Unknown User",
          averageRating:
            doc.data().timesRanked > 0
              ? (doc.data().ranking || 0) / (doc.data().timesRanked || 1)
              : 0,
        }));
        setUsers(usersData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => b.averageRating - a.averageRating),
    [users]
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign out error",
        description: "An error occurred while signing out",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-br, gray.50, blue.100)"
      p={{ base: 2, md: 4 }}
    >
      <Container maxW="container.md" py={{ base: 4, md: 6 }}>
        <VStack spacing={{ base: 4, md: 6 }} align="stretch">
          {/* Top Bar */}
          <Flex justify="space-between" align="center">
            <Heading
              as="h1"
              size="xl"
              color="blue.700"
              fontWeight="bold"
              textShadow="1px 1px 2px rgba(0, 0, 0, 0.1)"
            >
              Lookzapp
            </Heading>
            <HStack spacing={4}>
              <Button
                variant="link"
                color="blue.500"
                fontWeight="medium"
                onClick={() => navigate("/video-call")}
              >
                Video Chat
              </Button>
              <Button
                variant="link"
                color="red.500"
                fontWeight="medium"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </HStack>
          </Flex>

          {/* Main Content */}
          <Heading size="lg" textShadow="1px 1px 2px rgba(0, 0, 0, 0.1)">
            Top Rated Users
          </Heading>
          {loading ? (
            <Spinner size="xl" alignSelf="center" />
          ) : error ? (
            <Text color="red.500" textAlign="center">
              Error: {error}
            </Text>
          ) : sortedUsers.length === 0 ? (
            <Text textAlign="center">No users found.</Text>
          ) : (
            <Box overflowX="auto">
              <Grid
                templateColumns="1fr 2fr 1fr"
                gap={4}
                p={4}
                bg="white"
                borderRadius="md"
                boxShadow="md"
              >
                <Text fontWeight="bold">Rank</Text>
                <Text fontWeight="bold">User</Text>
                <Text fontWeight="bold">Rating</Text>
                {sortedUsers.map((user, index) => (
                  <React.Fragment key={user.id}>
                    <Text>{index + 1}</Text>
                    <Text
                      as={Link}
                      to={`/profile/${user.id}`}
                      color="blue.500"
                      _hover={{ textDecoration: "underline" }}
                    >
                      {user.displayName}
                    </Text>
                    <Text>{user.averageRating.toFixed(1)}</Text>
                  </React.Fragment>
                ))}
              </Grid>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
}