import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  useTheme,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemText,
  Collapse,
  Divider,
  SwipeableDrawer
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SearchIcon from '@mui/icons-material/Search';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';
import { useAuth } from '../hooks/useAuth';
import FaceIcon from '@mui/icons-material/Face';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PsychologyIcon from '@mui/icons-material/Psychology';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';

const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const NavText = styled(Typography)(({ theme }) => ({
  cursor: 'pointer',
  fontSize: '0.9rem',
  fontWeight: 500,
  letterSpacing: '0.5px',
  transition: 'all 0.3s ease',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: -4,
    left: 0,
    width: 0,
    height: '2px',
    background: 'linear-gradient(90deg, #09c2f7, #fa0ea4)',
    transition: 'width 0.3s ease'
  },
  '&:hover': {
    '&:after': {
      width: '100%'
    }
  }
}));

const MenuItem = styled(ListItem)(({ theme }) => ({
  cursor: 'pointer',
  padding: theme.spacing(2),
  transition: 'all 0.2s ease',
  '&:hover': {
    background: 'linear-gradient(90deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))',
    '& .MuiListItemText-primary': {
      color: '#09c2f7',
      textShadow: '0 0 8px rgba(9, 194, 247, 0.5)'
    },
    '& .MuiSvgIcon-root': {
      color: '#fa0ea4'
    }
  },
  '&:active': {
    transform: 'scale(0.98)'
  }
}));

const MenuIconWrapper = styled(Box)(({ theme }) => ({
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(2),
  color: 'rgba(255,255,255,0.7)'
}));

const Topbar = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAuthClick = () => {
    if (user) {
      signOut();
    } else {
      navigate('/signin');
    }
  };

  const menuItems = [
    { 
      text: 'Attractiveness Test', 
      icon: <FaceIcon />,
      action: () => navigate('/attractiveness-test')
    },
    { 
      text: 'Autism Test', 
      icon: <PsychologyIcon />,
      action: () => navigate('/autism-test')
    },
    { 
      text: 'Geeked Guess', 
      icon: <SearchIcon />,
      action: () => navigate('/geeked-guess')
    },
    { divider: true },
    { 
      text: 'About', 
      icon: <VisibilityIcon />,
      action: () => navigate('/about')
    },
    { 
      text: "What's Next", 
      icon: <CameraAltIcon />,
      action: () => navigate('/whats-next')
    },
    { 
      text: 'Home', 
      icon: <AccountCircleIcon />,
      action: () => navigate('/')
    }
  ];

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        background: 'rgba(13, 17, 44, 0.25)',
        backdropFilter: 'blur(10px)',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(250, 14, 164, 0.1)',
        height: '70px',
        transition: 'all 0.3s ease',
        '&:hover': {
          background: 'rgba(13, 17, 44, 0.4)',
          borderBottom: '1px solid rgba(250, 14, 164, 0.2)'
        }
      }}
    >
      <Toolbar sx={{ 
        justifyContent: 'space-between', 
        height: '100%',
        px: 2
      }}>
        {/* Left Menu Button */}
        <IconButton
          onClick={() => setIsDrawerOpen(true)}
          sx={{
            color: 'rgba(255,255,255,0.9)',
            '&:hover': {
              color: '#09c2f7'
            }
          }}
        >
          <MenuIcon />
        </IconButton>

        {/* Center Logo */}
        <Box
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 48,
            height: 48,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            background: 'linear-gradient(45deg, rgba(9, 194, 247, 0.2), rgba(250, 14, 164, 0.2))',
            animation: `${neonGlow} 2s infinite`,
            '&:hover': {
              transform: 'translateX(-50%) scale(1.05)',
              boxShadow: '0 0 15px rgba(9, 194, 247, 0.4)'
            }
          }}
        >
          <img
            src="/favicon-96x96.png"
            alt="Lookzapp"
            style={{ 
              width: '70%', 
              height: '70%', 
              objectFit: 'contain',
              filter: 'brightness(0) invert(1)'
            }}
          />
        </Box>

        {/* Right Auth Icon */}
        <IconButton
          onClick={handleAuthClick}
          sx={{
            color: 'rgba(255,255,255,0.9)',
            '&:hover': {
              color: '#09c2f7'
            }
          }}
        >
          {user ? <LogoutIcon /> : <AccountCircleIcon />}
        </IconButton>

        {/* Mobile Drawer */}
        <SwipeableDrawer
          anchor="left"
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onOpen={() => setIsDrawerOpen(true)}
          sx={{
            '& .MuiDrawer-paper': {
              width: '80%',
              maxWidth: 300,
              background: 'rgba(13, 17, 44, 0.95)',
              backdropFilter: 'blur(16px)',
              borderRight: '1px solid rgba(250, 14, 164, 0.3)'
            }
          }}
        >
          <Box sx={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center',
              borderBottom: '1px solid rgba(250, 14, 164, 0.2)'
            }}>
              <img
                src="/favicon-96x96.png"
                alt="LookzApp"
                style={{ 
                  width: 40, 
                  height: 40, 
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                  marginRight: 16
                }}
              />
              <Typography variant="h6" sx={{ color: '#fff' }}>
                LookzApp
              </Typography>
            </Box>

            <List sx={{ flex: 1, overflowY: 'auto' }}>
              {menuItems.map((item, index) => (
                item.divider ? (
                  <Divider key={index} sx={{ borderColor: 'rgba(250, 14, 164, 0.15)', my: 1 }} />
                ) : (
                  <MenuItem 
                    key={index}
                    onClick={() => {
                      item.action();
                      setIsDrawerOpen(false);
                    }}
                  >
                    {item.icon && <MenuIconWrapper>{item.icon}</MenuIconWrapper>}
                    <ListItemText 
                      primary={item.text}
                      sx={{
                        '& .MuiListItemText-primary': {
                          color: 'rgba(255,255,255,0.9)',
                          fontSize: '1rem',
                          fontWeight: 500
                        }
                      }}
                    />
                  </MenuItem>
                )
              ))}
            </List>
          </Box>
        </SwipeableDrawer>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;