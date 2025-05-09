import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  keyframes,
  styled,
  Switch,
  FormControlLabel,
  Button
} from '@mui/material';
import FaceIcon from '@mui/icons-material/Face';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PsychologyIcon from '@mui/icons-material/Psychology';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import GavelIcon from '@mui/icons-material/Gavel';
import FlagIcon from '@mui/icons-material/Flag';
import PersonIcon from '@mui/icons-material/Person';
import LiveTvIcon from '@mui/icons-material/LiveTv';
import MovieIcon from '@mui/icons-material/Movie';
import YouTubeIcon from '@mui/icons-material/YouTube';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import SearchIcon from '@mui/icons-material/Search';
import TimelineIcon from '@mui/icons-material/Timeline';
import BalanceIcon from '@mui/icons-material/Balance';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
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
  height: '400px',
  width: '100%',
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

const analysisOptions = [
  {
    title: 'Attractiveness',
    route: '/scan/attractiveness',
    description: 'Get your personal attractiveness rating and detailed breakdown.',
    icon: CameraAltIcon,
    locked: false
  },
  {
    title: 'Predict a Crime',
    route: '/scan/crime',
    description: 'Discover patterns in facial features that may indicate criminal tendencies.',
    icon: GavelIcon,
    locked: false
  },
  {
    title: 'Sum Me Up',
    route: '/scan/summary',
    description: 'Get a detailed breakdown of your facial features and characteristics.',
    icon: FaceIcon,
    locked: false
  },
  {
    title: 'Autism',
    route: '/scan/autism',
    description: 'Explore facial features commonly found in autism spectrum conditions.',
    icon: PsychologyIcon,
    locked: false,
    requiresAccount: true
  },
  {
    title: 'Lying Skill',
    route: '/scan/lying',
    description: 'Test your ability to detect deception through voice and facial cues.',
    icon: EmojiEmotionsIcon,
    locked: false,
    requiresAccount: true
  },
  {
    title: 'Sus Score',
    route: '/scan/sus',
    description: 'Quick 5-second scan of your face and voice for suspicious patterns.',
    icon: FlagIcon,
    locked: true
  },
  {
    title: 'Substances',
    route: '/scan/substances',
    description: 'Check your eye patterns and alertness levels for substance indicators.',
    icon: VisibilityIcon,
    locked: true
  },
];

const gameOptions = [
  {
    title: 'Guess the Celeb',
    route: '/games/guess-celeb',
    description: 'Test your knowledge of celebrities with our blur challenge game. Guess who\'s behind the blur!',
    icon: MovieIcon,
    locked: false,
    badge: 'images'
  },
  {
    title: 'Guess the Influencer',
    route: '/games/guess-influencer',
    description: 'Challenge yourself to identify popular streamers and content creators from blurred images.',
    icon: YouTubeIcon,
    locked: false,
    badge: 'images'
  },
  {
    title: 'Preference Predictor',
    route: '/games/preference-predictor',
    description: 'Discover your logical archetype through a series of thought-provoking questions. Find out which famous figures you align with!',
    icon: PsychologyAltIcon,
    locked: false,
    badge: 'quiz'
  },
  {
    title: 'Who Done It?',
    route: '/games/who-done-it',
    description: 'Test your detective skills! Guess who done it, with multiple chances and clues to solve the mystery.',
    icon: SearchIcon,
    locked: false,
    badge: 'game'
  },
  {
    title: 'Order the Events',
    route: '/games/order-events',
    description: 'Test your historical knowledge by arranging events in chronological order. Race against time to get the highest score!',
    icon: TimelineIcon,
    locked: false,
    badge: 'game'
  },
  {
    title: 'Match the Scandal',
    route: '/games/match-scandal',
    description: 'Match the scandals to the right people! Test your knowledge of celebrity controversies in this fast-paced matching game.',
    icon: GavelIcon,
    locked: false,
    badge: 'game'
  },
  {
    title: 'Morality Test',
    route: '/games/morality-test',
    description: 'Discover your moral compass! Answer ethical dilemmas to find out where you stand on the spectrum of utilitarianism, deontology, collectivism, and individualism.',
    icon: BalanceIcon,
    locked: false,
    badge: 'quiz'
  },
  {
    title: 'Life Predictor',
    route: '/games/life-predictor',
    description: 'Answer thought-provoking questions to discover your life path and destiny. Uncover which archetype guides your journey!',
    icon: AutoStoriesIcon,
    locked: false,
    badge: 'quiz'
  }
];

function Selection() {
  const navigate = useNavigate();
  const location = useLocation();
  const cardsRef = useRef(null);
  const [showGames, setShowGames] = useState(location.state?.initialView === 'games');

  // Sort options by badge
  const sortedOptions = showGames 
    ? [...gameOptions].sort((a, b) => a.badge.localeCompare(b.badge))
    : analysisOptions;

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

    const cardElements = cardsRef.current?.querySelectorAll('.selection-card');
    cardElements?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [showGames]);

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
              flexDirection: 'column',
              alignItems: 'center',
              mb: 0,
            }}
          >
            <Box
              sx={{
                width: 120,
                height: 120,
                marginTop: -5,
                background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: `${neonGlow} 2s infinite`,
                boxShadow: '0 0 32px rgba(9, 194, 247, 0.2)',
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
              onClick={() => navigate('/')}
            >
              <img
                src="/lookzapp trans 2.png"
                alt="LookzApp"
                style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mt: 4,
                mb: 2,
                background: 'rgba(13, 17, 44, 0.9)',
                borderRadius: '16px',
                padding: '8px',
                border: '1px solid rgba(250, 14, 164, 0.2)',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <Button
                  onClick={() => setShowGames(false)}
                  sx={{
                    color: showGames ? 'rgba(255,255,255,0.6)' : '#fff',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    padding: '12px 32px',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    zIndex: 1,
                    minWidth: '140px',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  Analysis
                </Button>
                <Button
                  onClick={() => setShowGames(true)}
                  sx={{
                    color: showGames ? '#fff' : 'rgba(255,255,255,0.6)',
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    padding: '12px 32px',
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    zIndex: 1,
                    minWidth: '140px',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  Games
                </Button>
              </Box>
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
            {showGames ? 'Choose Your Game' : 'What do you want to scan for?'}
          </Typography>
          <Typography
            variant="subtitle1"
            align="center"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              mb: 6,
            }}
          >
            {showGames 
              ? 'Test your knowledge with our blur challenge games'
              : 'Choose an analysis option to proceed.'}
          </Typography>

          <Grid container spacing={4} justifyContent="center" ref={cardsRef}>
            {sortedOptions.map((option, index) => (
              <Grid item xs={12} sm={6} md={3} key={option.title}>
                <StyledPaper
                  className={`selection-card ${option.locked ? 'locked' : ''}`}
                  sx={{
                    opacity: 0,
                    transform: 'translateY(20px)',
                    transition: 'all 0.5s ease-out',
                    transitionDelay: `${index * 0.1}s`,
                  }}
                  onClick={() => handleSelection(option.route, option.locked)}
                >
                  <Box sx={{ position: 'relative', width: '100%' }}>
                    {showGames && option.badge && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -12,
                          right: -12,
                          backgroundColor: option.badge === 'images' ? '#09c2f7' : 
                                         option.badge === 'quiz' ? '#fa0ea4' : '#6ce9ff',
                          color: '#fff',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          zIndex: 1,
                        }}
                      >
                        {option.badge}
                      </Box>
                    )}
                    <option.icon
                      className="feature-icon"
                      sx={{
                        fontSize: 48,
                        color: '#09c2f7',
                        mb: 3,
                        filter: 'drop-shadow(0 0 8px rgba(9, 194, 247, 0.3))',
                      }}
                    />
                  </Box>
                  <Typography variant="h5" sx={{ 
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
                    fontSize: '1rem',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center'
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
                  {option.requiresAccount && (
                    <Typography variant="body2" sx={{
                      color: '#09c2f7',
                      mt: 2,
                      fontWeight: 'bold',
                      textShadow: '0 0 5px rgba(9, 194, 247, 0.3)'
                    }}>
                      Requires FREE Account
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

export default Selection; 