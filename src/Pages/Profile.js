import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signOut } from 'firebase/auth';
import {
  Flex,
  Box,
  Heading,
  Text,
  Spinner,
  HStack,
  Button,
  Container,
  VStack,
} from '@chakra-ui/react';
import { Avatar } from '@chakra-ui/avatar';


function Profile() {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          console.log('No such user!');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  let profileContent;
  if (loading) {
    profileContent = <Spinner size="xl" />;
  } else if (!userData) {
    profileContent = <Text fontSize="xl" color="red.500">User not found</Text>;
  } else {
    profileContent = (
      <Box
        p={8}
        borderRadius="lg"
        boxShadow="md"
        bg="white"
        w={{ base: '90%', md: '600px' }}
      >
        <VStack spacing={6} align="center">
          <Avatar size="2xl" name={userData.displayName} src={userData.profilePicture} />
          <Heading as="h1" size="xl" textAlign="center">
            {userData.displayName}'s Profile
          </Heading>
          <VStack spacing={2} align="start" w="full">
            <HStack>
              <Text fontWeight="bold">Email:</Text>
              <Text>{userData.email}</Text>
            </HStack>
            <HStack>
              <Text fontWeight="bold">Ranking:</Text>
              <Text>{userData.ranking || 'N/A'}</Text>
            </HStack>
          </VStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Flex
      direction="column"
      minH="100vh"
      bgGradient="linear(to-br, gray.50, blue.100)"
    >
      <Container maxW="container.xl" py={{ base: 4, md: 6 }}>
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
              onClick={() => navigate('/top-rated-users')}
            >
              Top Rated Users
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
      </Container>
      <Flex flex={1} align="center" justify="center">
        {profileContent}
      </Flex>
    </Flex>
  );
}

export default Profile;