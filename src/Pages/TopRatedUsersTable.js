import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Text, Spinner, Box, Container, VStack, Heading, Flex, HStack, Button } from "@chakra-ui/react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@chakra-ui/toast";
import { FiSearch, FiVideo, FiLogOut } from "react-icons/fi";
import { Input, InputGroup, InputLeftElement } from "@chakra-ui/input";
import { Table, Thead, Tbody, Tr, Th, Td, TableContainer } from "@chakra-ui/table";

export default function TopRatedUsersGrid() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
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
          averageRating: doc.data().timesRanked > 0
            ? (doc.data().ranking || 0) / (doc.data().timesRanked || 1)
            : 0,
          totalRatings: doc.data().timesRanked || 0,
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

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const columns = [
    { 
      key: "displayName", 
      name: "User", 
      formatter: ({ row }) => (
        <Link to={`/profile/${row.id}`} style={{ color: "#3182ce", fontWeight: "bold" }}>
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
    <Flex direction="column" minH="100vh" bg="gray.50">
      {/* Sticky Header */}
      <Box
        position="sticky"
        top="0"
        w="100%"
        bg="white"
        backdropFilter="blur(10px)"
        zIndex="sticky"
        borderBottomWidth="1px"
        boxShadow="sm"
      >
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <Heading
              as="h1"
              size="lg"
              color="blue.600"
              fontWeight="bold"
              cursor="pointer"
              onClick={() => navigate("/")}
            >
              Lookzapp
            </Heading>
            <HStack spacing={4}>
              <Button leftIcon={<FiVideo />} onClick={() => navigate("/video-call")} colorScheme="blue" variant="ghost">
                Video Chat
              </Button>
              <Button leftIcon={<FiLogOut />} onClick={handleSignOut} colorScheme="red" variant="solid">
                Sign Out
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

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
          {loading ? (
            <Spinner size="xl" alignSelf="center" />
          ) : error ? (
            <Text color="red.500" textAlign="center">
              Error: {error}
            </Text>
          ) : filteredUsers.length === 0 ? (
            <Text textAlign="center">No users found.</Text>
          ) : (
            <Box border="1px" borderColor="gray.200" borderRadius="xl" boxShadow="md" bg="white">
              <TableContainer>
                <Table variant="striped" colorScheme="gray">
                  <Thead bg="gray.50">
                    <Tr>
                      {columns.map(column => (
                        <Th key={column.key} textAlign="left" px={6} py={4} fontSize="md">
                          {column.name}
                        </Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredUsers.map(user => (
                      <Tr key={user.id} _hover={{ bg: "gray.100" }}>
                        {columns.map(column => {
                          const cellValue = user[column.key];
                          const formatter = column.formatter;
                          return (
                            <Td key={column.key} px={6} py={4} borderColor="gray.200">
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
  );
}
