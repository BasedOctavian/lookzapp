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
import Footer from "../Components/Footer";
import { useTopRatedData } from "../hooks/useTopRatedData"; // Added new hook import

export default function TopRatedUsersGrid() {
  // State for search and sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("averageRating"); // Default sort by averageRating
  const [sortOrder, setSortOrder] = useState("desc");    // Default descending order
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const toast = useToast();

  // Fetch data using the new hook
  const { data, loading, error } = useTopRatedData();

  // Sort data based on sortBy and sortOrder
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "displayName") {
        // String sorting (case-insensitive)
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      } else {
        // Numerical sorting
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      }
    });
  }, [data, sortBy, sortOrder]);

  // Filter sorted data based on search query
  const filteredUsers = useMemo(() => {
    return sortedData.filter((user) =>
      user.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedData, searchQuery]);

  // Define table columns, including feature ratings
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
      ),
    },
    {
      key: "averageRating",
      name: "Rating",
      formatter: ({ row }) => row.averageRating.toFixed(1),
    },
    { key: "totalRatings", name: "Total Ratings" },
    {
      key: "eyesAverage",
      name: "Eyes",
      formatter: ({ row }) => row.eyesAverage.toFixed(1),
    },
    {
      key: "smileAverage",
      name: "Smile",
      formatter: ({ row }) => row.smileAverage.toFixed(1),
    },
    {
      key: "jawlineAverage",
      name: "Jawline",
      formatter: ({ row }) => row.jawlineAverage.toFixed(1),
    },
    {
      key: "hairAverage",
      name: "Hair",
      formatter: ({ row }) => row.hairAverage.toFixed(1),
    },
    {
      key: "bodyAverage",
      name: "Body",
      formatter: ({ row }) => row.bodyAverage.toFixed(1),
    },
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
        isClosable: true,
      });
    }
  };

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
            {loading ? (
              <Spinner size="xl" alignSelf="center" />
            ) : error ? (
              <Text color="red.500" textAlign="center">Error: {error}</Text>
            ) : filteredUsers.length === 0 ? (
              <Text textAlign="center">No users found.</Text>
            ) : (
              <Box border="1px" borderColor="gray.200" borderRadius="xl" boxShadow="md" bg="white">
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
                            onClick={() => {
                              if (sortBy === column.key) {
                                setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                              } else {
                                setSortBy(column.key);
                                setSortOrder("desc");
                              }
                            }}
                            cursor="pointer"
                          >
                            {column.name}
                            {sortBy === column.key && (sortOrder === "desc" ? " ↓" : " ↑")}
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
      <Footer />
    </>
  );
}