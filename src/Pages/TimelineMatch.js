import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Box, Typography, Paper, CircularProgress, keyframes, styled, Button } from '@mui/material';
import SortableItem from '../Components/TimelineMatch/SortableItem';
import TopBar from '../Components/TopBar';
import { useNavigate } from 'react-router-dom';

// Define keyframes
const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const neonGlow = keyframes`
  0% { filter: drop-shadow(0 0 2px #09c2f7); }
  50% { filter: drop-shadow(0 0 6px #09c2f7); }
  100% { filter: drop-shadow(0 0 2px #09c2f7); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const shake = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backdropFilter: 'blur(16px)',
  backgroundColor: 'rgba(13, 17, 44, 0.7)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  borderRadius: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  width: { xs: '100%', md: '280px' },
  height: '100px',
  margin: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  userSelect: 'none',
  WebkitUserSelect: 'none',
  MozUserSelect: 'none',
  msUserSelect: 'none',
  '&:hover': {
    backgroundColor: 'rgba(13, 17, 44, 0.85)',
    boxShadow: '0 8px 32px rgba(250, 14, 164, 0.3)',
  },
}));

const ProgressBar = styled(Box)(({ theme }) => ({
  height: '6px',
  background: 'linear-gradient(90deg, #09c2f7, #fa0ea4)',
  borderRadius: '3px',
  transition: 'width 0.3s ease',
}));

const difficultySettings = {
  easy: { numEvents: 3, timeLimit: 30 },
  medium: { numEvents: 5, timeLimit: 20 },
  hard: { numEvents: 7, timeLimit: 15 },
};

const TimelineMatch = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [displayEvents, setDisplayEvents] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState('selectDifficulty');
  const [difficulty, setDifficulty] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // Add loading screen effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'timelineEvents'));
        const eventsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setEvents(eventsData);
      } catch (error) {
        console.error('Error fetching timeline events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const startNewRound = () => {
    if (!difficulty || events.length < difficultySettings[difficulty].numEvents) return;
    const { numEvents, timeLimit } = difficultySettings[difficulty];
    setTimeLeft(timeLimit);

    const shuffledEvents = [...events].sort(() => Math.random() - 0.5);
    const selected = [];
    const usedYears = new Set();

    for (const event of shuffledEvents) {
      if (!usedYears.has(event.year)) {
        selected.push(event);
        usedYears.add(event.year);
        if (selected.length === numEvents) break;
      }
    }

    // Sort by year to get correct order
    const correctOrder = [...selected].sort((a, b) => parseInt(a.year) - parseInt(b.year));
    
    // Keep shuffling until we get a different order than the correct one
    let displayOrder;
    do {
      displayOrder = [...selected].sort(() => Math.random() - 0.5);
    } while (displayOrder.every((event, index) => event.id === correctOrder[index].id));

    setDisplayEvents(displayOrder);
    setSubmitted(false);
    setFeedback([]);
    setMessage('');
  };

  useEffect(() => {
    // Auto-select medium difficulty on mobile
    const isMobile = window.innerWidth < 900;
    if (isMobile && !difficulty) {
      setDifficulty('medium');
      setPhase('playing');
    }
  }, [difficulty]);

  useEffect(() => {
    if (phase === 'playing' && round <= 5 && events.length > 0) {
      startNewRound();
    } else if (round > 5) {
      setPhase('gameOver');
    }
  }, [round, events, phase, difficulty]);

  useEffect(() => {
    if (timeLeft > 0 && phase === 'playing') {
      const timerId = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft, phase]);

  const checkArrangement = (isSubmission) => {
    const correctOrder = [...displayEvents].sort((a, b) => parseInt(a.year) - parseInt(b.year));
    const isCorrect = displayEvents.every((event, index) => event.id === correctOrder[index].id);
    const feedbackData = displayEvents.map((event, index) => event.id === correctOrder[index].id);
    setFeedback(feedbackData);

    if (isCorrect) {
      const basePoints = 10;
      const timeBonus = isSubmission ? timeLeft : 0;
      const totalPoints = basePoints + timeBonus;
      setScore(prev => prev + totalPoints);
      setMessage(`Correct! +${totalPoints} points${timeBonus > 0 ? ` (${timeBonus} time bonus)` : ''}`);
    } else {
      setMessage('Incorrect - Showing correct order');
      // Rearrange to correct order with animation
      setTimeout(() => {
        setDisplayEvents(correctOrder);
        setFeedback(correctOrder.map(() => true));
      }, 1000);
    }

    setSubmitted(true);
    setTimeout(() => {
      setFeedback([]);
      if (round < 5) {
        setRound(prev => prev + 1);
      } else {
        setPhase('gameOver');
      }
    }, 3000); // Increased timeout to allow time to see the correct order
  };

  useEffect(() => {
    if (timeLeft === 0 && !submitted && displayEvents.length > 0) {
      checkArrangement(false);
    }
  }, [timeLeft, submitted, displayEvents]);

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setDisplayEvents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!showContent) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', 
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <TopBar />
        <Box
          sx={{
            width: 120,
            height: 120,
            background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
            borderRadius: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 4,
            animation: `${neonGlow} 2s infinite`,
            boxShadow: '0 0 32px rgba(9, 194, 247, 0.2)',
          }}
        >
          <img
            src="/lookzapp trans 2.png"
            alt="LookzApp"
            style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
          />
        </Box>
        <CircularProgress 
          sx={{ 
            color: '#09c2f7',
            animation: `${pulse} 1s infinite`,
          }} 
        />
      </Box>
    );
  }

  if (phase === 'selectDifficulty') {
    const isMobile = window.innerWidth < 900;
    if (isMobile) return null; // Skip difficulty selection on mobile

    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)',
          color: '#fff',
          py: 8,
          position: 'relative',
        }}
      >
        <TopBar />
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 'xl', mx: 'auto' }}>
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Box
              onClick={() => navigate('/')}
              sx={{
                width: 120,
                height: 120,
                background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                borderRadius: '24px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 4,
                animation: `${neonGlow} 2s infinite`,
                boxShadow: '0 0 32px rgba(9, 194, 247, 0.2)',
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <img
                src="/lookzapp trans 2.png"
                alt="LookzApp"
                style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
              />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4,
                animation: `${neonGlow} 2s infinite`,
              }}
            >
              Timeline Match
            </Typography>

            <Box
              sx={{
                maxWidth: '800px',
                mx: 'auto',
                p: 4,
                background: 'rgba(13, 17, 44, 0.5)',
                borderRadius: '24px',
                border: '1px solid rgba(9, 194, 247, 0.2)',
                backdropFilter: 'blur(16px)',
                animation: `${fadeIn} 0.5s ease-out`,
              }}
            >
              <Typography variant="h6" sx={{ color: '#09c2f7', mb: 3 }}>
                Select Difficulty
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                  variant="contained"
                  onClick={() => { setDifficulty('easy'); setPhase('playing'); }}
                  sx={{
                    background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                      opacity: 0.9
                    }
                  }}
                >
                  Easy
                </Button>
                <Button
                  variant="contained"
                  onClick={() => { setDifficulty('medium'); setPhase('playing'); }}
                  sx={{
                    background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                      opacity: 0.9
                    }
                  }}
                >
                  Medium
                </Button>
                <Button
                  variant="contained"
                  onClick={() => { setDifficulty('hard'); setPhase('playing'); }}
                  sx={{
                    background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                      opacity: 0.9
                    }
                  }}
                >
                  Hard
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
        {/* Footer Section */}
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
          <Typography variant="body2" onClick={() => navigate('/octavian')}>
            © 2025 Octavian Ideas. All rights reserved.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (phase === 'gameOver') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)',
          color: '#fff',
          py: 8,
          position: 'relative',
        }}
      >
        <TopBar />
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 'xl', mx: 'auto' }}>
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Box
              onClick={() => navigate('/')}
              sx={{
                width: 120,
                height: 120,
                background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                borderRadius: '24px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 4,
                animation: `${neonGlow} 2s infinite`,
                boxShadow: '0 0 32px rgba(9, 194, 247, 0.2)',
                transition: 'transform 0.3s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            >
              <img
                src="/lookzapp trans 2.png"
                alt="LookzApp"
                style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
              />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 4,
                animation: `${neonGlow} 2s infinite`,
              }}
            >
              Game Over
            </Typography>

            <Typography variant="h6" sx={{ mb: 4, color: '#fff' }}>
              Final Score: {score}
            </Typography>
            <Button
              variant="contained"
              onClick={() => {
                setPhase('selectDifficulty');
                setRound(1);
                setScore(0);
                setDisplayEvents([]);
                setTimeLeft(0);
                setMessage('');
                setSubmitted(false);
                setFeedback([]);
              }}
              sx={{
                background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                px: 4,
                py: 1.5,
                '&:hover': {
                  background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                  opacity: 0.9
                }
              }}
            >
              Play Again
            </Button>
          </Box>
        </Box>
        {/* Footer Section */}
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
          <Typography variant="body2" onClick={() => navigate('/octavian')}>
            © 2025 Octavian Ideas. All rights reserved.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)',
          color: '#fff',
          py: 8,
          position: 'relative',
        }}
      >
        <TopBar />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress sx={{ color: '#09c2f7' }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)',
        color: '#fff',
        py: 8,
        position: 'relative',
      }}
    >
      <TopBar />
      <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 'xl', mx: 'auto' }}>
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <Box
            onClick={() => navigate('/')}
            sx={{
              width: 120,
              height: 120,
              background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
              borderRadius: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 4,
              animation: `${neonGlow} 2s infinite`,
              boxShadow: '0 0 32px rgba(9, 194, 247, 0.2)',
              transition: 'transform 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.05)',
              },
            }}
          >
            <img
              src="/lookzapp trans 2.png"
              alt="LookzApp"
              style={{ width: '80%', filter: 'brightness(0) invert(1)' }}
            />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 4,
              animation: `${neonGlow} 2s infinite`,
            }}
          >
            Timeline Match
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: '#09c2f7' }}>
            Round {round}/5 | Score: {score}
          </Typography>
          <Typography sx={{ mb: 2, color: '#fff' }}>
            Arrange the events in chronological order by dragging them. Submit when you think it's correct for a time bonus!
          </Typography>

          <Box sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 2, 
            mb: 3,
            color: '#09c2f7',
            flexDirection: { xs: 'column', md: 'row' }
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              flexDirection: { xs: 'column', md: 'row' }
            }}>
              <Typography variant="body2">Oldest</Typography>
              <Box sx={{ 
                width: '24px', 
                height: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                animation: `${pulse} 2s infinite`,
                transform: { xs: 'rotate(90deg)', md: 'none' }
              }}>
                ←
              </Box>
            </Box>
            <Box sx={{ 
              width: { xs: '2px', md: '100px' },
              height: { xs: '100px', md: '2px' },
              background: 'linear-gradient(90deg, #09c2f7, #fa0ea4)',
              borderRadius: '1px',
              transform: { xs: 'rotate(90deg)', md: 'none' }
            }} />
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              flexDirection: { xs: 'column', md: 'row' }
            }}>
              <Box sx={{ 
                width: '24px', 
                height: '24px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                animation: `${pulse} 2s infinite`,
                transform: { xs: 'rotate(90deg)', md: 'none' }
              }}>
                →
              </Box>
              <Typography variant="body2">Most Recent</Typography>
            </Box>
          </Box>

          {message && (
            <Typography
              variant="h5"
              sx={{
                color: message.includes('Correct') ? '#4caf50' : '#f44336',
                mb: 4,
                animation: `${fadeIn} 0.5s ease-out`,
                px: 2,
                textAlign: 'center'
              }}
            >
              {message}
            </Typography>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={displayEvents.map((event) => event.id)}
              strategy={horizontalListSortingStrategy}
            >
              <Box
                sx={{
                  width: '100%',
                  mx: 'auto',
                  px: 2,
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  justifyContent: 'center',
                  alignItems: 'center',
                  flexWrap: { xs: 'wrap', md: 'nowrap' },
                  gap: 4,
                  minHeight: '300px',
                  overflowX: { md: 'auto' },
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: { xs: '50%', md: 0 },
                    top: { xs: 0, md: '50%' },
                    width: { xs: '2px', md: '100%' },
                    height: { xs: '100%', md: '2px' },
                    background: 'linear-gradient(90deg, rgba(9, 194, 247, 0.2), rgba(250, 14, 164, 0.2))',
                    transform: { xs: 'translateX(-50%)', md: 'translateY(-50%)' },
                    zIndex: -1,
                    display: { xs: 'block', md: 'block' }
                  },
                  '&::-webkit-scrollbar': { height: '8px' },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(9, 194, 247, 0.5)',
                    borderRadius: '4px',
                    '&:hover': { background: 'rgba(9, 194, 247, 0.7)' },
                  },
                }}
              >
                {displayEvents.map((event, index) => (
                  <SortableItem
                    key={event.id}
                    id={event.id}
                    disabled={submitted || timeLeft === 0}
                  >
                    <StyledPaper
                      sx={{
                        borderColor: feedback[index] === true ? 'green' : feedback[index] === false ? 'red' : 'transparent',
                        animation: feedback[index] === true ? `${pulse} 0.5s` : feedback[index] === false ? `${shake} 0.5s` : 'none',
                      }}
                    >
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography 
                          sx={{ 
                            color: '#fff', 
                            textAlign: 'center',
                            fontSize: { xs: '0.9rem', md: '1rem' },
                            lineHeight: 1.4,
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            px: 1,
                            mb: submitted ? 1 : 0
                          }}
                        >
                          {event.action}
                        </Typography>
                        {submitted && (
                          <Typography
                            sx={{
                              color: feedback[index] === true ? '#4caf50' : feedback[index] === false ? '#f44336' : '#09c2f7',
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              animation: `${fadeIn} 0.5s ease-out`
                            }}
                          >
                            {event.year}
                          </Typography>
                        )}
                      </Box>
                    </StyledPaper>
                  </SortableItem>
                ))}
              </Box>
            </SortableContext>
          </DndContext>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              disabled={submitted || timeLeft === 0}
              onClick={() => checkArrangement(true)}
              sx={{ 
                background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
                  opacity: 0.9
                }
              }}
            >
              Submit
            </Button>
          </Box>

          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              p: 2,
              background: 'rgba(13, 17, 44, 0.8)',
              backdropFilter: 'blur(8px)',
              borderTop: '1px solid rgba(250, 14, 164, 0.2)',
              zIndex: 1000,
            }}
          >
            <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Typography variant="body2" sx={{ color: '#09c2f7', minWidth: '100px' }}>
                  Time Left: {timeLeft}s
                </Typography>
                <Box sx={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                  <ProgressBar sx={{ width: `${(timeLeft / difficultySettings[difficulty].timeLimit) * 100}%` }} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
      {/* Footer Section */}
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
        <Typography variant="body2" onClick={() => navigate('/octavian')}>
          © 2025 Octavian Ideas. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default TimelineMatch;