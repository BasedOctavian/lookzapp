import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  keyframes,
  styled
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import TopBar from '../Components/TopBar';
import '../App.css';

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backdropFilter: 'blur(16px)',
  backgroundColor: 'rgba(13, 17, 44, 0.7)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  borderRadius: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  minHeight: 300,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  cursor: 'pointer',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-8px)',
    backgroundColor: 'rgba(13, 17, 44, 0.85)',
    boxShadow: '0 8px 32px rgba(250, 14, 164, 0.3)',
    '& .feature-icon': {
      filter: 'drop-shadow(0 0 12px rgba(9, 194, 247, 0.4))'
    }
  },
  '&.locked': {
    cursor: 'not-allowed',
    opacity: 0.7,
    '&:hover': {
      transform: 'none',
    },
    '&::after': {
      content: '"🔒"',
      position: 'absolute',
      top: '10px',
      right: '10px',
      fontSize: '1.5rem',
    }
  }
}));

const gameOptions = [
  {
    title: 'Guess the Celebrity',
    route: '/games/celeb-blur',
    description: 'Test your knowledge of celebrities with our blur challenge game. Guess who\'s behind the blur!',
    icon: PersonIcon,
    locked: false
  },
  {
    title: 'Guess the Streamer',
    route: '/games/streamer-blur',
    description: 'Challenge yourself to identify popular streamers and content creators from blurred images.',
    icon: LiveTvIcon,
    locked: true
  }
];

function GamesSelection() {
  const navigate = useNavigate();
  const cardsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      },
      { threshold: 0.1 }
    );

    const cardElements = cardsRef.current?.querySelectorAll('.game-card');
    cardElements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSelection = (route, locked) => {
    if (locked) return;
    navigate(route);
  };

  return (
    <>
      <TopBar />
      <Box
        sx={{
          minHeight: '100vh',
          background: `
            radial-gradient(circle at center, #0d112c 0%, #66043e 100%),
            linear-gradient(45deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))
          `,
          color: '#fff',
          py: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
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
          }}
        />
        <Container maxWidth="xl" sx={{ position: 'relative' }}>
          <Box
            sx={{
              marginTop: '100px',
              display: 'flex',
              justifyContent: 'center',
              mb: 4,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: `${neonGlow} 2s infinite`,
                boxShadow: '0 0 32px rgba(9, 194, 247, 0.2)',
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              <img
                src="/lookzapp trans 2.png"
                alt="LookzApp"
                style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
              />
            </Box>
          </Box>
          <Typography
            variant="h4"
            component="h1"
            align="center"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            Choose Your Game
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              mb: 6,
            }}
          >
            Test your knowledge with our blur challenge games
          </Typography>
          <Grid container spacing={4} justifyContent="center" ref={cardsRef}>
            {gameOptions.map((option, index) => (
              <Grid item xs={12} sm={6} key={option.title}>
                <StyledPaper
                  className={`game-card ${option.locked ? 'locked' : ''}`}
                  sx={{
                    opacity: 0,
                    transform: 'translateY(20px)',
                    transition: 'all 0.5s ease-out',
                    transitionDelay: `${index * 0.1}s`,
                  }}
                  onClick={() => handleSelection(option.route, option.locked)}
                >
                  <option.icon
                    className="feature-icon"
                    sx={{
                      fontSize: 64,
                      color: '#09c2f7',
                      mb: 3,
                      filter: 'drop-shadow(0 0 8px rgba(9, 194, 247, 0.3))',
                    }}
                  />
                  <Typography variant="h4" sx={{ 
                    mb: 2, 
                    fontWeight: 600,
                    color: '#6ce9ff',
                    textShadow: '0 0 10px rgba(9, 194, 247, 0.3)'
                  }}>
                    {option.title}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    textShadow: '0 0 5px rgba(9, 194, 247, 0.2)',
                    fontSize: '1.1rem'
                  }}>
                    {option.description}
                  </Typography>
                  {option.locked && (
                    <Typography variant="body2" sx={{
                      color: '#fa0ea4',
                      mt: 2,
                      fontWeight: 'bold',
                      textShadow: '0 0 5px rgba(250, 14, 164, 0.3)'
                    }}>
                      Coming Soon
                    </Typography>
                  )}
                </StyledPaper>
              </Grid>
            ))}
          </Grid>
        </Container>

        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            py: 3,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.6)',
            fontSize: '0.9rem',
            animation: `${fadeIn} 1s ease-out`,
            opacity: 0,
            animationFillMode: 'forwards',
          }}
        >
          <Typography variant="body2">
            © 2025 Octavian Ideas. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </>
  );
}

export default GamesSelection;