import React, { useState } from 'react';
import { 
  Box, 
  Flex, 
  HStack, 
  Icon, 
  IconButton, 
  Text, 
  Button, 
  Spacer, 
  useBreakpointValue, 
  Popover
} from '@chakra-ui/react';
import { FaVideo, FaGamepad, FaTrophy, FaStar, FaMapMarkedAlt, FaEnvelope, FaBars } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MuiButton from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../hooks/useAuth'; // Import useAuth hook
import '../App.css'; 




const TopBar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth(); // Get user and signOut from useAuth

  const navItems = [
    { title: 'Video Chat', icon: FaVideo, route: '/video-call' },
    { title: 'Other Games', icon: FaGamepad, route: '/two-truths' },
    { title: 'Rating', icon: FaTrophy, route: '/top-rated-users' },
    { title: 'Get Ranked', icon: FaStar, route: '/get-ranked-selection' },
    { title: 'Guess Location', icon: FaMapMarkedAlt, route: '/geo-call' },
    { title: 'Messages', icon: FaEnvelope, route: '/messages' },
  ];

  const isDesktop = useBreakpointValue({ base: false, md: true });
  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = () => setIsOpen(!isOpen);

  // Handle sign-out action
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/'); // Navigate to home page after sign-out
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box 
      bg="white" 
      boxShadow="md" 
      px={4} 
      py={2} 
      mb={6} 
      style={{ position: 'sticky', top: 0, zIndex: 100, marginTop: '-50' }}
    >
      <Flex align="center">
        {/* Logo */}
        <Box 
          as="img" 
          src="/lookzapp.png" 
          alt="Lookzapp Logo" 
          maxH="60px" 
          cursor="pointer" 
          onClick={() => navigate('/')} 
          style={{ objectFit: 'contain', marginLeft: '-70px' }}
        />
        <Spacer />

        {isDesktop ? (
          <HStack spacing={6}>
            {navItems.map((item) => (
              <Button
                key={item.title}
                variant="ghost"
                onClick={() => navigate(item.route)}
                _hover={{ bg: 'gray.100' }}
              >
                <HStack spacing={2}>
                  <Icon 
                    as={item.icon} 
                    w={5} 
                    h={5} 
                    color={item.title === 'Rating' ? 'yellow.500' : 'gray.600'} 
                  />
                  <Text fontSize="sm" fontFamily={'Matt Bold'}>{item.title}</Text>
                </HStack>
              </Button>
            ))}
            {/* Sign In/Sign Out Button for Desktop */}
            {user ? (
              <Button variant="ghost" onClick={handleSignOut} fontFamily={'Matt Light'}>
                Sign Out
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => navigate('/signin')} fontFamily={'Matt Light'}>
                Sign In
              </Button>
            )}
          </HStack>
        ) : (
          <MuiIconButton onClick={handleToggle}>
            <FaBars />
          </MuiIconButton>
        )}
      </Flex>

      {!isDesktop && (
        <Drawer anchor="right" open={isOpen} onClose={handleToggle}>
          <MuiBox sx={{ width: 250 }} role="presentation">
            <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
              <Typography variant="h6">Menu</Typography>
              <MuiIconButton onClick={handleToggle}>
                <CloseIcon />
              </MuiIconButton>
            </MuiBox>
            <MuiBox sx={{ p: 2 }}>
              {navItems.map((item) => (
                <MuiButton
                  key={item.title}
                  fullWidth
                  variant="text"
                  startIcon={<item.icon size={20} color={item.title === 'Rating' ? '#FFD700' : '#4B5563'} />}
                  onClick={() => {
                    navigate(item.route);
                    handleToggle();
                  }}
                  sx={{ mb: 1 }}
                >
                  {item.title}
                </MuiButton>
              ))}
              {/* Sign In/Sign Out Button for Mobile Drawer */}
              {user ? (
                <MuiButton
                  fullWidth
                  variant="text"
                  onClick={() => {
                    handleSignOut();
                    handleToggle();
                  }}
                  sx={{ mb: 1 }}
                >
                  Sign Out
                </MuiButton>
              ) : (
                <MuiButton
                  fullWidth
                  variant="text"
                  onClick={() => {
                    navigate('/signin');
                    handleToggle();
                  }}
                  sx={{ mb: 1 }}
                >
                  Sign In
                </MuiButton>
              )}
            </MuiBox>
          </MuiBox>
        </Drawer>
      )}
    </Box>
  );
};

export default TopBar;