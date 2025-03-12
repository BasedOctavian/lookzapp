import { useParams, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { db, auth } from '../firebase';
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
  Icon,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { useUserRatingData } from '../hooks/useUserRatingData';
import { CircularProgress, CircularProgressLabel } from "@chakra-ui/progress";
import { FiMail, FiAward, FiLogOut, FiStar, FiUsers } from 'react-icons/fi';
import Avatar from '@mui/material/Avatar';
import { Divider } from '@mui/material';


function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userData, rating, loading } = useUserRatingData(userId);
  const cardBg = 'white'; // Static background color
  const headerBg = 'rgba(255, 255, 255, 0.8)'; // Static header background
  const featureColors = ['blue.400', 'pink.400', 'purple.400', 'teal.400', 'orange.400']; // Static feature colors

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
    profileContent = (
      <VStack spacing={4} py={12}>
        <Spinner size="xl" thickness="3px" />
        <Text fontWeight="medium">Loading profile...</Text>
      </VStack>
    );
  } else if (!userData) {
    profileContent = (
      <VStack spacing={4} py={12}>
        <Icon as={FiUsers} boxSize={12} color="gray.400" />
        <Text fontSize="xl" fontWeight="semibold" color="gray.500">
          User not found
        </Text>
      </VStack>
    );
  } else {
    const {
      eyesRating = 0,
      smileRating = 0,
      facialRating = 0,
      hairRating = 0,
      bodyRating = 0,
    } = userData;

    const totalFeatureRating =
      eyesRating + smileRating + facialRating + hairRating + bodyRating;

    let percentages = {
      eyes: totalFeatureRating ? (eyesRating / totalFeatureRating) * 100 : 0,
      smile: totalFeatureRating ? (smileRating / totalFeatureRating) * 100 : 0,
      facial: totalFeatureRating ? (facialRating / totalFeatureRating) * 100 : 0,
      hair: totalFeatureRating ? (hairRating / totalFeatureRating) * 100 : 0,
      body: totalFeatureRating ? (bodyRating / totalFeatureRating) * 100 : 0,
    };

    // Adjust to make sure total is exactly 100%
    const totalPercentage = Object.values(percentages).reduce((a, b) => a + b, 0);
    const scale = totalPercentage > 0 ? 100 / totalPercentage : 1;
    Object.keys(percentages).forEach(key => {
      percentages[key] = Math.round(percentages[key] * scale);
    });

    // Recalculate total to handle rounding discrepancies
    let adjustedTotal = Object.values(percentages).reduce((a, b) => a + b, 0);
    if (adjustedTotal !== 100) {
      const maxKey = Object.keys(percentages).reduce((a, b) =>
        percentages[a] > percentages[b] ? a : b
      );
      percentages[maxKey] += 100 - adjustedTotal;
    }

    const features = [
      { key: 'eyes', label: 'Eyes', percent: percentages.eyes, icon: FiStar },
      { key: 'smile', label: 'Smile', percent: percentages.smile, icon: FiStar },
      { key: 'facial', label: 'Jawline', percent: percentages.facial, icon: FiStar },
      { key: 'hair', label: 'Hair', percent: percentages.hair, icon: FiStar },
      { key: 'body', label: 'Physique', percent: percentages.body, icon: FiStar },
    ];

    profileContent = (
      <Box 
        w="100%"
        maxW="xl"
        bg={cardBg}
        borderRadius="2xl"
        boxShadow="xl"
        position="relative"
        overflow="hidden"
        mt={6}
      >
        {/* Profile Header */}
        <Box 
          h="140px"
          bgGradient="linear(to-r, blue.400, purple.500)"
          position="relative"
        >
          <Avatar 
            alt={userData.displayName}
            src={userData.profilePicture}
            sx={{
              width: 180,
              height: 180,
              border: '4px solid',
              borderColor: cardBg,
              position: 'absolute',
              bottom: '-60px',
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          />
        </Box>

        {/* Profile Content */}
        <VStack spacing={6} pt={20} px={6} pb={8}>
          <VStack spacing={1}>
            <Heading as="h1" size="xl" fontWeight="bold">
              {userData.displayName}
            </Heading>
            <Text color="gray.500" fontSize="lg">
              @{userData.username || userData.email.split('@')[0]}
            </Text>
          </VStack>

          {/* Stats Grid */}
          <Grid templateColumns="repeat(3, 1fr)" gap={6} w="100%">
            <GridItem>
              <VStack spacing={1}>
                <Text fontSize="2xl" fontWeight="black" color="blue.500">
                  N/A
                </Text>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Global Rank
                </Text>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack spacing={1}>
                <Text fontSize="2xl" fontWeight="black" color="purple.500">
                  {rating.toFixed(1)}
                </Text>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Average Rating
                </Text>
              </VStack>
            </GridItem>
            <GridItem>
              <VStack spacing={1}>
                <Text fontSize="2xl" fontWeight="black" color="teal.500">
                  N/A
                </Text>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Total Ratings
                </Text>
              </VStack>
            </GridItem>
          </Grid>

          <Divider />

          {/* Feature Progress Grid */}
          <VStack spacing={4} w="100%">
            <Heading size="md" fontWeight="semibold" alignSelf="start">
              Rating Breakdown
            </Heading>
            <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={4} w="100%">
              {features.map((feature, index) => (
                <GridItem key={feature.key}>
                  <HStack spacing={4}>
                    <CircularProgress
                      value={feature.percent}
                      color={featureColors[index % featureColors.length]}
                      size="60px"
                      thickness="8px"
                    >
                      <CircularProgressLabel>
                        <Icon as={feature.icon} color="gray.500" boxSize={5} />
                      </CircularProgressLabel>
                    </CircularProgress>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="medium">{feature.label}</Text>
                      <Text fontSize="2xl" fontWeight="bold">
                        {feature.percent}%
                      </Text>
                    </VStack>
                  </HStack>
                </GridItem>
              ))}
            </Grid>
          </VStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Flex direction="column" minH="100vh" bg="gray.50">
      {/* Sticky Header */}
      <Box
        position="sticky"
        top="0"
        w="100%"
        bg={headerBg}
        backdropFilter="blur(10px)"
        zIndex="sticky"
        borderBottomWidth="1px"
      >
        <Container maxW="container.xl" py={4}>
          <Flex justify="space-between" align="center">
            <Heading as="h1" size="lg" color="blue.600" fontWeight="black"
              onClick={() => navigate('/')}>
              Lookzapp
            </Heading>
            <HStack spacing={4}>
              <Button 
                leftIcon={<FiAward />}
                onClick={() => navigate('/top-rated-users')}
                variant="ghost"
                colorScheme="blue"
              >
                Top Rated
              </Button>
              <Button 
                leftIcon={<FiLogOut />}
                onClick={handleSignOut}
                variant="solid"
                colorScheme="red"
              >
                Sign Out
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Flex flex={1} justify="center" p={4}>
        {profileContent}
      </Flex>
    </Flex>
  );
}

export default Profile;