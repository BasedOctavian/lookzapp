import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import {
  Text,
  Spinner,
  Box,
  Container,
  VStack,
  Heading,
  Flex,
  Button
} from "@chakra-ui/react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@chakra-ui/toast";
import { FiSearch, FiLogOut } from "react-icons/fi";
import { Input, InputGroup, InputLeftElement } from "@chakra-ui/input";
import TopBar from "../Components/TopBar";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from "@chakra-ui/table";

export default function TopRatedUsersGrid() {
  // State for users and streamers
  const [users, setUsers] = useState([]);
  const [streamers, setStreamers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingStreamers, setLoadingStreamers] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const toast = useToast();

  // Fetch users from Firestore
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          displayName: doc.data().displayName || "Unknown User",
          averageRating:
            (doc.data().timesRanked > 0
              ? (doc.data().ranking || 0) / (doc.data().timesRanked || 1)
              : 0) || 0,
          totalRatings: doc.data().timesRanked || 0,
          type: "user"
        }));
        setUsers(usersData);
        setLoadingUsers(false);
      },
      (err) => {
        console.error("Error fetching users:", err);
        setError(err.message);
        setLoadingUsers(false);
      }
    );
    return () => unsubscribeUsers();
  }, []);

  // Fetch streamers from Firestore
  useEffect(() => {
    const unsubscribeStreamers = onSnapshot(
      collection(db, "streamers"),
      (snapshot) => {
        const streamersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          displayName: doc.data().name || "Unknown Influencer",
          averageRating:
            (doc.data().timesRanked > 0
              ? (doc.data().ranking || 0) / (doc.data().timesRanked || 1)
              : 0) || 0,
          totalRatings: doc.data().timesRanked || 0,
          type: "streamer"
        }));
        setStreamers(streamersData);
        setLoadingStreamers(false);
      },
      (err) => {
        console.error("Error fetching streamers:", err);
        setError(err.message);
        setLoadingStreamers(false);
      }
    );
    return () => unsubscribeStreamers();
  }, []);

  // Combine and sort users and streamers by rating
  const combinedUsers = useMemo(() => {
    const allUsers = [...users, ...streamers];
    return allUsers.sort((a, b) => b.averageRating - a.averageRating);
  }, [users, streamers]);

  // Filter based on search query
  const filteredUsers = useMemo(() => {
    return combinedUsers.filter((user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [combinedUsers, searchQuery]);

  // Define table columns with conditional linking
  const columns = [
    {
      key: "displayName",
      name: "User",
      formatter: ({ row }) => (
        <Link
          to={row.type === "streamer" ? `/influencer-profile/${row.id}` : `/profile/${row.id}`}
          style={{ color: "#3182ce", fontWeight: "bold" }}
        >
          {row.displayName}
        </Link>
      )
    },
    {
      key: "averageRating",
      name: "Rating",
      formatter: ({ row }) => row.averageRating.toFixed(1)
    },
    { key: "totalRatings", name: "Total Ratings" }
  ];

  // Sign out handler
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
        isClosable: true
      });
    }
  };

  const isLoading = loadingUsers || loadingStreamers;

  return (
    <>
      <TopBar />
      <Flex direction="column" minH="100vh" bg="gray.50">
        <Container maxW="container.xl" py={8} flex={1}>
          <VStack spacing={6} align="stretch">
            <Heading size="xl">Top Rated Users</Heading>

            {/* Search Input */}
            <InputGroup>
              <InputLeftElement pointerEvents="none">
                <FiSearch color="gray.300" style={{ marginTop: 4 }} />
              </InputLeftElement>
              <Input
                style={{ marginLeft: 30 }}
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                borderRadius="lg"
              />
            </InputGroup>

            {/* Table */}
            {isLoading ? (
              <Spinner size="xl" alignSelf="center" />
            ) : error ? (
              <Text color="red.500" textAlign="center">
                Error: {error}
              </Text>
            ) : filteredUsers.length === 0 ? (
              <Text textAlign="center">No users found.</Text>
            ) : (
              <Box
                border="1px"
                borderColor="gray.200"
                borderRadius="xl"
                boxShadow="md"
                bg="white"
              >
                <TableContainer>
                  <Table variant="striped" colorScheme="gray">
                    <Thead bg="gray.50">
                      <Tr>
                        {columns.map((column) => (
                          <Th
                            key={column.key}
                            textAlign="left"
                            px={6}
                            py={4}
                            fontSize="md"
                          >
                            {column.name}
                          </Th>
                        ))}
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredUsers.map((user) => (
                        <Tr key={user.id} _hover={{ bg: "gray.100" }}>
                          {columns.map((column) => {
                            const cellValue = user[column.key];
                            const formatter = column.formatter;
                            return (
                              <Td
                                key={column.key}
                                px={6}
                                py={4}
                                borderColor="gray.200"
                              >
                                {formatter ? formatter({ row: user }) : cellValue}
                              </Td>
                            );
                          })}
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </VStack>
        </Container>
      </Flex>
    </>
  );
}