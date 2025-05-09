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
  DragOverlay,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Box, Typography, Paper, CircularProgress, keyframes, styled, Button } from '@mui/material';
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
  width: '280px',
  height: '100px',
  margin: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  userSelect: 'none',
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

// Droppable component
const Droppable = ({ id, children }) => {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
};

// Draggable component
const Draggable = ({ id, children }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

const ScandalMatch = () => {
  const navigate = useNavigate();
  const [scandals, setScandals] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]);
  const [allActions, setAllActions] = useState([]);
  const [droppableStates, setDroppableStates] = useState({});
  const [actionsMap, setActionsMap] = useState({});
  const [timeLeft, setTimeLeft] = useState(30);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('');
  const [phase, setPhase] = useState('playing');
  const [submitted, setSubmitted] = useState(false);
  const [correctAssignments, setCorrectAssignments] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [showContent, setShowContent] = useState(false);

  // Add loading screen effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const fakeScandals = [
    "Secret offshore bank accounts in the Cayman Islands",
    "Undisclosed business dealings with foreign governments",
    "Plagiarism in published memoirs",
    "Tax evasion scheme using shell companies",
    "Undisclosed property investments in Dubai",
    "Secret meeting with controversial lobbyists",
    "Misuse of campaign funds for personal expenses",
    "Undisclosed conflict of interest in major policy decisions",
    "Secret recording of private conversations",
    "Undisclosed financial ties to foreign corporations",
    "Misuse of diplomatic immunity privileges",
    "Secret offshore trust fund in Panama",
    "Undisclosed business partnership with sanctioned entities",
    "Misuse of government resources for personal gain",
    "Secret real estate deals in tax havens",
    "Undisclosed speaking fees from controversial organizations",
    "Misuse of security clearance for personal benefit",
    "Secret investment in cryptocurrency schemes",
    "Undisclosed financial support from foreign donors",
    "Misuse of official position for family business",
    "Hidden stake in private intelligence firms",
    "Unauthorized acquisition of biometric data",
    "Covert funding of online disinformation campaigns",
    "Undisclosed ownership of surveillance technology patents",
    "Secret private jet flights to off-grid compounds",
    "Shell corporations linked to real estate laundering",
    "Fake nonprofit used to funnel corporate donations",
    "Manipulation of social media trends using bots",
    "Illegal lobbying through third-party influencers",
    "Ghostwritten academic work passed off as original",
    "Kickbacks from international aid contracts",
    "Undeclared stock options in defense contractors",
    "Use of burner phones for backchannel diplomacy",
    "Personal enrichment from green energy subsidies",
    "Hidden stake in luxury resorts under investigation",
    "Suppression of internal whistleblower reports",
    "Unauthorized surveillance of political opponents",
    "Dubious charitable foundation with zero transparency",
    "Secret payouts to cover up internal scandals",
    "Insider trading around federal announcements",
    "Unreported campaign contributions through crypto wallets",
    "Abuse of NDA agreements to silence former staff",
    "Fake shell universities used to issue honorary degrees",
    "Complicity in artificial scarcity of essential goods",
    "Investments in conflict minerals through intermediaries",
    "Patenting of stolen indigenous knowledge",
    "Behind-the-scenes manipulation of public health data",
    "Secret stake in a data harvesting mobile app",
    "Private military contractors hired under false pretenses",
    "Suppression of scientific studies for commercial gain",
    "Backroom deals with social media censorship boards",
    "Misuse of emergency powers to seize assets",
    "Undisclosed luxury assets hidden in trust networks",
    "Secret board positions in controversial biotech firms",
    "Fabricated cybersecurity breaches to justify funding",
    "Use of AI-generated evidence in lawsuits",
    "Covert partnerships with autocratic regimes",
    "Fake environmental projects used for embezzlement",
    "Astroturfing grassroots support through paid actors",
    "Ownership of adult industry companies through proxies",
    "Under-the-table payments to foreign lobbyists",
    "False flag events to sway public opinion",
    "Steering public contracts to shell bidders",
    "Acquiring foreign citizenship to dodge investigations",
    "Selling sensitive tech IP to overseas buyers",
    "Fabricating awards and honors on public bios",
    "Anonymous funding of radical activist groups",
    "Operating illegal data centers in unregulated zones",
    "Collusion with private banks to hide sovereign debt",
    "Use of AI avatars in board meetings without disclosure",
    "Hidden income from undisclosed speaking engagements",
    "Secret offshore insurance policies against prosecution",
    "Buying silence from former security staff",
    "Manipulating census data to skew demographics",
    "Fabricating survey data for policy validation",
    "Backdoor access to smart home tech for intelligence",
    "Selling early vaccine access to elites",
    "Control over micro-lending platforms in developing nations",
    "Unregistered ownership in arms manufacturing firms",
    "Ghost staff on payroll for laundering salaries",
    "Bribes disguised as consulting fees",
    "Hiding sensitive documents in foreign embassies",
    "Control of fake news farms in Eastern Europe",
    "Running a political deepfake operation",
    "Secret collaboration with banned tech platforms"
  ];
  

  // Fetch scandals from Firestore
  useEffect(() => {
    const fetchScandals = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'scandals'));
        const scandalsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setScandals(scandalsData);
      } catch (error) {
        console.error('Error fetching scandals:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScandals();
  }, []);

  // Shuffle function
  const shuffle = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Start a new round
  const startNewRound = () => {
    if (scandals.length < 5) return; // Need at least 3 selected + 2 distractors
    const allNames = [...new Set(scandals.map(s => s.name))];
    if (allNames.length < 5) return;

    // Select 3 unique names
    const selectedNames = shuffle(allNames).slice(0, 3);
    const correctActions = selectedNames.map(name => {
      const actions = scandals.filter(s => s.name === name);
      return shuffle(actions)[0];
    });

    // Select 1 distractor action from unique other names
    const otherNames = allNames.filter(n => !selectedNames.includes(n));
    const distractorName = shuffle(otherNames)[0];
    const distractorAction = scandals.filter(s => s.name === distractorName)[0];

    // Add one fake scandal
    const fakeScandal = {
      id: `fake-${Date.now()}`,
      name: "FAKE",
      action: shuffle(fakeScandals)[0]
    };

    const allActions = shuffle([...correctActions, distractorAction, fakeScandal]);
    const actionsMap = Object.fromEntries(allActions.map(a => [a.id, a]));
    const droppableStates = {
      pool: allActions.map(a => a.id),
      ...Object.fromEntries(selectedNames.map(name => [name, []])),
    };

    setSelectedNames(selectedNames);
    setAllActions(allActions);
    setActionsMap(actionsMap);
    setDroppableStates(droppableStates);
    setTimeLeft(30);
    setSubmitted(false);
    setCorrectAssignments({});
    setMessage('');
  };

  useEffect(() => {
    if (phase === 'playing' && round <= 5 && scandals.length > 0) {
      startNewRound();
    } else if (round > 5) {
      setPhase('gameOver');
    }
  }, [round, scandals, phase]);

  // Timer
  useEffect(() => {
    if (timeLeft > 0 && phase === 'playing' && !submitted) {
      const timerId = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [timeLeft, phase, submitted]);

  // Find source droppable
  const findDroppable = (actionId) => {
    for (const [droppableId, items] of Object.entries(droppableStates)) {
      if (items.includes(actionId)) return droppableId;
    }
    return null;
  };

  // Handle drag end
  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over || submitted) return;
    const actionId = active.id;
    const sourceDroppable = findDroppable(actionId);
    const destDroppable = over.id;
    if (sourceDroppable === destDroppable) return;

    setDroppableStates(prev => {
      const newStates = { ...prev };
      if (destDroppable === "pool") {
        if (sourceDroppable !== "pool") {
          newStates[sourceDroppable] = [];
          newStates.pool = [...newStates.pool, actionId];
        }
      } else if (sourceDroppable === "pool") {
        const currentActionInDest = newStates[destDroppable][0];
        newStates.pool = newStates.pool.filter(id => id !== actionId);
        newStates[destDroppable] = [actionId];
        if (currentActionInDest) {
          newStates.pool = [...newStates.pool, currentActionInDest];
        }
      } else {
        const currentActionInDest = newStates[destDroppable][0];
        newStates[sourceDroppable] = currentActionInDest ? [currentActionInDest] : [];
        newStates[destDroppable] = [actionId];
      }
      return newStates;
    });
  };

  // Check answers
  const checkArrangement = () => {
    const correctAssignments = {};
    selectedNames.forEach(name => {
      const assignedActionId = droppableStates[name][0];
      correctAssignments[name] = assignedActionId ? actionsMap[assignedActionId].name === name : false;
    });
    setCorrectAssignments(correctAssignments);
    const numCorrect = Object.values(correctAssignments).filter(Boolean).length;
    setScore(prev => prev + numCorrect * 10);
    setMessage(`You got ${numCorrect} out of 3 correct! +${numCorrect * 10} points`);
    setSubmitted(true);
    setTimeout(() => {
      if (round < 5) {
        setRound(prev => prev + 1);
      } else {
        setPhase('gameOver');
      }
    }, 2000);
  };

  useEffect(() => {
    if (timeLeft === 0 && !submitted && selectedNames.length > 0) {
      checkArrangement();
    }
  }, [timeLeft, submitted, selectedNames]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    onDragEnd(event);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

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

  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', color: '#fff', py: 8 }}>
        <TopBar />
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress sx={{ color: '#09c2f7' }} />
        </Box>
      </Box>
    );
  }

  if (!scandals.length || !selectedNames.length || !allActions.length || !Object.keys(droppableStates).length) {
    return (
      <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', color: '#fff', py: 8 }}>
        <TopBar />
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
          <Typography variant="h4" sx={{ mb: 4, color: '#09c2f7' }}>
            Loading Game Data...
          </Typography>
          <CircularProgress sx={{ color: '#09c2f7' }} />
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
      <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', color: '#fff', py: 8 }}>
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
                setPhase('playing');
                setRound(1);
                setScore(0);
                setSelectedNames([]);
                setAllActions([]);
                setDroppableStates({});
                setTimeLeft(0);
                setMessage('');
                setSubmitted(false);
                setCorrectAssignments({});
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

  return (
    <Box sx={{ minHeight: '100vh', background: 'radial-gradient(circle at center, #0d112c 0%, #66043e 100%)', color: '#fff', py: 8 }}>
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
            Scandal Match
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: '#09c2f7' }}>
            Round {round}/5 | Score: {score}
          </Typography>
          <Typography sx={{ mb: 2, color: '#fff' }}>
            Drag the scandals to the correct people. Match all 3 correctly!
          </Typography>

          {message && (
            <Typography
              variant="h5"
              sx={{
                color: message.includes('3 out of 3') ? '#4caf50' : '#f44336',
                mb: 4,
                animation: `${fadeIn} 0.5s ease-out`,
              }}
            >
              {message}
            </Typography>
          )}

          <DndContext 
            sensors={sensors} 
            collisionDetection={closestCenter} 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 4 }}>
                {selectedNames.map(name => (
                  <Droppable key={name} id={name}>
                    <Box sx={{ textAlign: 'center', width: '280px' }}>
                      <Typography sx={{ color: '#fff', mb: 1, fontWeight: 'bold' }}>{name}</Typography>
                      <div
                        style={{
                          border: submitted
                            ? correctAssignments[name]
                              ? '2px solid green'
                              : '2px solid red'
                            : '2px dashed rgba(255, 255, 255, 0.3)',
                          borderRadius: '8px',
                          minHeight: '100px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center/werewolf:2px dashed rgba(255, 255, 255, 0.3)',backgroundColor:'rgba(255, 255, 255, 0.05)'}}>
                        {droppableStates[name].length > 0 ? (
                          <Draggable id={droppableStates[name][0]}>
                            <StyledPaper
                              sx={{
                                animation: submitted
                                  ? correctAssignments[name]
                                    ? `${pulse} 0.5s`
                                    : `${shake} 0.5s`
                                  : 'none',
                              }}
                            >
                              <Typography sx={{ color: '#fff' }}>
                                {actionsMap[droppableStates[name][0]].action}
                              </Typography>
                            </StyledPaper>
                          </Draggable>
                        ) : (
                          <Typography sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>Drop scandal here</Typography>
                        )}
                      </div>
                    </Box>
                  </Droppable>
                ))}
              </Box>

              <Droppable id="pool">
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
                  {droppableStates.pool?.map(actionId => (
                    <Draggable key={actionId} id={actionId}>
                      <StyledPaper>
                        <Typography sx={{ color: '#fff' }}>{actionsMap[actionId].action}</Typography>
                      </StyledPaper>
                    </Draggable>
                  ))}
                </Box>
              </Droppable>
            </Box>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="contained"
                disabled={submitted || timeLeft === 0}
                onClick={checkArrangement}
                sx={{ background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)' }}
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
                    <ProgressBar sx={{ width: `${(timeLeft / 30) * 100}%` }} />
                  </Box>
                </Box>
              </Box>
            </Box>

            <DragOverlay>
              {activeId ? (
                <StyledPaper
                  sx={{
                    transform: 'scale(1.05)',
                    boxShadow: '0 8px 32px rgba(250, 14, 164, 0.4)',
                    cursor: 'grabbing',
                  }}
                >
                  <Typography sx={{ color: '#fff' }}>
                    {actionsMap[activeId]?.action}
                  </Typography>
                </StyledPaper>
              ) : null}
            </DragOverlay>
          </DndContext>
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

export default ScandalMatch;