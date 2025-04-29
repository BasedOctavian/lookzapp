import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  styled, 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@emotion/react';
import Topbar from '../Components/TopBar'; // Adjust path as needed

// Animation definitions
const neonGlow = keyframes`
  0% { box-shadow: 0 0 5px #09c2f7, 0 0 10px rgba(9, 194, 247, 0.3); }
  50% { box-shadow: 0 0 15px #09c2f7, 0 0 30px rgba(9, 194, 247, 0.5); }
  100% { box-shadow: 0 0 5px #09c2f7, 0 0 10px rgba(9, 194, 247, 0.3); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Styled components
const CyberContainer = styled(Container)(({ theme }) => ({
  position: 'relative',
  paddingTop: '80px', // Account for TopBar height
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: `
    radial-gradient(circle at center, #0d112c 0%, #66043e 100%),
    linear-gradient(45deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))
  `,
  '&:before': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    background: `
      linear-gradient(45deg, 
        rgba(9, 194, 247, 0.05) 0%, 
        rgba(250, 14, 164, 0.05) 50%,
        rgba(9, 194, 247, 0.05) 100%)
    `,
    animation: `${gradientFlow} 12s ease infinite`,
    backgroundSize: '200% 200%',
    opacity: 0.3,
    zIndex: -1
  }
}));

const CyberPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 600,
  backdropFilter: 'blur(16px)',
  backgroundColor: 'rgba(13, 17, 44, 0.7)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  borderRadius: '24px',
  boxShadow: '0 8px 32px rgba(9, 194, 247, 0.2)',
  animation: `${neonGlow} 3s infinite alternate`,
  transition: 'all 0.3s ease',
  textAlign: 'center',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 40px rgba(250, 14, 164, 0.3)'
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
    margin: theme.spacing(2),
    width: '90%'
  }
}));

const CyberButton = styled(Button)({
  background: 'linear-gradient(45deg, #09c2f7 0%, #fa0ea4 100%)',
  backgroundSize: '200% 200%',
  color: '#fff',
  fontWeight: 700,
  padding: '12px 24px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  animation: `${gradientFlow} 6s ease infinite`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 0 24px rgba(9, 194, 247, 0.4)',
  }
});

const OutlineButton = styled(Button)({
  color: '#fff',
  borderColor: 'rgba(250, 14, 164, 0.3)',
  padding: '12px 24px',
  borderRadius: '12px',
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: '#09c2f7',
    backgroundColor: 'rgba(9, 194, 247, 0.1)',
    transform: 'translateY(-2px)'
  }
});

const ScanLimitPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Topbar />
      <CyberContainer maxWidth={false}>
        <CyberPaper elevation={0}>
          <Typography 
            variant="h3" 
            sx={{ 
              mb: 3,
              background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 800,
              fontSize: { xs: '2rem', sm: '2.5rem' }
            }}
          >
            Scan Limit Reached
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255,255,255,0.9)',
              mb: 3,
              fontSize: '1.1rem',
              lineHeight: 1.6
            }}
          >
            You've reached the limit for free scans. Create a free account to continue using our service!
          </Typography>

          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              mb: 4,
              fontStyle: 'italic',
              textShadow: '0 0 5px rgba(9, 194, 247, 0.2)'
            }}
          >
            Creating an account is completely free and gives you unlimited access to our scanning features.
          </Typography>

          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <CyberButton
              onClick={() => navigate('/signup')}
            >
              Create Free Account
            </CyberButton>
            <OutlineButton
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Back to Home
            </OutlineButton>
          </Box>
        </CyberPaper>
      </CyberContainer>
    </>
  );
};

export default ScanLimitPage;