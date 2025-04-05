import React, { useState } from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Button,
  Spacer,
  useBreakpointValue,
  VStack,
  Icon,
} from '@chakra-ui/react';
import {
  FaTrophy,
  FaUser,
  FaEnvelope,
  FaCog,
  FaGamepad,
  FaVideo,
  FaStar,
  FaSearch,
  FaBars,
  FaEye,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import MuiBox from '@mui/material/Box';
import MuiIconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MuiButton from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../hooks/useAuth';
import '../App.css';
import { Popover, PopoverTrigger, PopoverContent, PopoverBody, PopoverArrow } from '@chakra-ui/popover';

const TopBar = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Define navigation items with dropdowns
  const navItems = [
    { title: 'Leaderboard', icon: FaTrophy, route: '/leaderboard' },
    {
      title: 'Games',
      icon: FaGamepad,
      dropdown: [
        { title: 'GeoLocate', route: '/geo-locate' },
        { title: 'Two Truths & a Lie', route: '/two-truths' },
      ],
    },
    {
      title: 'Video Chat',
      icon: FaVideo,
      dropdown: [
        { title: 'Random Room', route: '/video-chat' },
        { title: 'Private Room', route: '/video-chat/private' },
      ],
    },
    {
      title: 'Get Ranked',
      icon: FaStar,
      dropdown: [
        { title: 'Celebs', route: '/ranking?category=celebs' },
        { title: 'Influencers', route: '/ranking?category=influencers' },
        { title: 'Other Users', route: '/ranking?category=other-users' },
        { title: 'All', route: '/ranking?category=all' },
      ],
    },
    {
      title: 'Analysis',
      icon: FaEye,
      dropdown: [
        { title: 'Looksmatch', route: '/looksmatch' },
        { title: 'Face Scan', route: '/analysis' },
      ],
    },
    { title: 'Messages', icon: FaEnvelope, route: '/messages' },
    { title: 'Settings', icon: FaCog, route: '/settings' },
  ];

  const isDesktop = useBreakpointValue({ base: false, md: true });
  const [isOpen, setIsOpen] = useState(false);
  const handleToggle = () => setIsOpen(!isOpen);

  // Handle sign-out action
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
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
      style={{ position: 'sticky', top: 0, zIndex: 100 }}
    >
      <Flex align="center">
        {/* Logo */}
        <Box
          as="img"
          src="/lookzapp trans.png"
          alt="Lookzapp Logo"
          maxH="50px"
          cursor="pointer"
          onClick={() => navigate('/')}
        />
        <Spacer />

        {isDesktop ? (
          <HStack spacing={4}>
          {navItems.map((item) => {
            if (item.dropdown) {
              return (
                <Popover key={item.title} trigger="hover">
                  <PopoverTrigger>
                    <Button variant="ghost" colorScheme="gray">
                      <HStack spacing={1}>
                        <Icon as={item.icon} w={4} h={4} color="gray.700" />
                        <Text fontSize="sm" fontWeight="medium" color="gray.700">
                          {item.title}
                        </Text>
                      </HStack>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent bg="white" borderColor="gray.200">
                    <PopoverArrow bg="white" />
                    <PopoverBody>
                      <VStack align="start" spacing={1}>
                        {item.dropdown.map((subItem) => (
                          <Button
                            key={subItem.title}
                            variant="ghost"
                            color="black"
                            _hover={{ bg: 'gray.100' }}
                            w="full"
                            justifyContent="flex-start"
                            onClick={() => navigate(subItem.route)}
                          >
                            {subItem.title}
                          </Button>
                        ))}
                      </VStack>
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              );
            } else {
              return (
                <Button
                  key={item.title}
                  variant="ghost"
                  colorScheme="gray"
                  onClick={() => navigate(item.route)}
                >
                  <HStack spacing={1}>
                    <Icon as={item.icon} w={4} h={4} color="gray.700" />
                    <Text fontSize="sm" fontWeight="medium" color="gray.700">
                      {item.title}
                    </Text>
                  </HStack>
                </Button>
              );
            }
          })}
          {/* Profile Icon */}
          <MuiIconButton aria-label="Profile" onClick={() => navigate('/profile/' + user?.uid)}>
            <FaUser color="gray.700" size={16} />
          </MuiIconButton>
          {/* Sign In/Sign Out Button for Desktop */}
          {user ? (
            <Button variant="ghost" colorScheme="gray" onClick={handleSignOut}>
              Sign Out
            </Button>
          ) : (
            <Button variant="ghost" colorScheme="gray" onClick={() => navigate('/signin')}>
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
          <MuiBox sx={{ width: 250, bgcolor: 'white' }} role="presentation">
            <MuiBox sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'white' }}>
              <Typography variant="h6">Menu</Typography>
              <MuiIconButton onClick={handleToggle}>
                <CloseIcon />
              </MuiIconButton>
            </MuiBox>
            <MuiBox sx={{ p: 2, bgcolor: 'white' }}>
              {navItems.map((item) => (
                <React.Fragment key={item.title}>
                  {item.dropdown ? (
                    <>
                      <Typography variant="subtitle1" sx={{ mt: 2 }}>
                        {item.title}
                      </Typography>
                      {item.dropdown.map((subItem) => (
                        <MuiButton
                          key={subItem.title}
                          fullWidth
                          variant="text"
                          onClick={() => {
                            navigate(subItem.route);
                            handleToggle();
                          }}
                          sx={{ mb: 1 }}
                        >
                          {subItem.title}
                        </MuiButton>
                      ))}
                    </>
                  ) : (
                    <MuiButton
                      fullWidth
                      variant="text"
                      startIcon={<item.icon size={20} color="#4B5563" />}
                      onClick={() => {
                        navigate(item.route);
                        handleToggle();
                      }}
                      sx={{ mb: 1 }}
                    >
                      {item.title}
                    </MuiButton>
                  )}
                </React.Fragment>
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