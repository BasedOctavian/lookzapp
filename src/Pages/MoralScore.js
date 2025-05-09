import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, keyframes, styled } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import TopBar from '../Components/TopBar';
import { Scatter } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

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

// Styled components
const StyledButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '24px',
  transition: 'all 0.3s ease',
  minWidth: '200px',
  height: 'auto',
  whiteSpace: 'normal',
  textAlign: 'center',
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: '0 8px 32px rgba(250, 14, 164, 0.3)',
    background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
  },
}));

const StyledBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  backdropFilter: 'blur(16px)',
  backgroundColor: 'rgba(13, 17, 44, 0.7)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  borderRadius: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: 'rgba(13, 17, 44, 0.85)',
    boxShadow: '0 8px 32px rgba(250, 14, 164, 0.3)',
  },
}));

const StyledCircularProgress = styled(CircularProgress)(({ theme }) => ({
  color: '#09c2f7',
  '& .MuiCircularProgress-circle': {
    strokeLinecap: 'round',
  },
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

// CSV data included directly in the file
const csvData = `
id,question,answer1,answer2,utilitarian_a1,deontological_a1,collectivist_a1,individualist_a1,utilitarian_a2,deontological_a2,collectivist_a2,individualist_a2
001,"A hacker leaks classified war crimes footage.","The public deserved to know.","National security should come first.",5,-3,2,1,-2,4,3,-1
002,"A hacker exposes government surveillance programs.","Transparency is essential for democracy.","National security protocols must be maintained.",5,-3,2,1,-2,4,3,-1
003,"A hacker reveals corporate environmental violations.","The public has a right to know about harm.","Corporate secrets should be protected.",5,-3,2,1,-2,4,3,-1
004,"A doctor administers a lethal dose to a terminal patient.","Euthanasia relieves unbearable suffering.","Life is sacred; killing is always wrong.",5,-4,1,2,-2,5,-1,-2
005,"A doctor performs an abortion to save the mother's life.","Saving the mother's life is the priority.","All life is equally sacred and must be protected.",5,-4,1,2,-2,5,-1,-2
006,"A doctor uses experimental treatment on a dying patient.","The chance of saving a life justifies the risk.","Medical ethics must be strictly followed.",5,-4,1,2,-2,5,-1,-2
007,"A self-driving car must choose between hitting pedestrians or killing its own passenger.","Minimize total harm, even if the driver dies.","Protect the passenger at all costs.",5,-3,3,-2,-3,4,-2,3
008,"A self-driving car must choose between hitting a child or an elderly person.","Save the child who has more years ahead.","All lives have equal value regardless of age.",5,-3,3,-2,-3,4,-2,3
009,"A self-driving car must choose between hitting a group or swerving into a wall.","Save the maximum number of lives.","The car should not make such moral decisions.",5,-3,3,-2,-3,4,-2,3
010,"A charity worker steals medicine to save children dying of a rare disease.","Steal to save lives at risk.","Stealing is inherently wrong, regardless of intent.",5,-4,4,0,-2,5,-1,1
011,"A doctor steals organs to save multiple patients.","Saving multiple lives justifies the theft.","Organ theft violates medical ethics.",5,-4,4,0,-2,5,-1,1
012,"A parent steals food to feed their starving children.","Saving children's lives is the priority.","Theft is wrong regardless of circumstances.",5,-4,4,0,-2,5,-1,1
013,"The government imposes a vaccine mandate.","Mandates protect public health effectively.","Individual choice should be respected.",4,-1,5,-4,-2,3,-3,5
014,"The government enforces strict environmental regulations.","Regulations protect the planet for everyone.","Business freedom should not be restricted.",4,-1,5,-4,-2,3,-3,5
015,"The government implements universal healthcare.","Healthcare is a right for all citizens.","People should choose their own healthcare.",4,-1,5,-4,-2,3,-3,5
016,"A CEO hides product defects to avoid mass panic.","Consumers deserve full transparency.","Protecting the economy justifies withholding info.",3,4,2,-1,2,-3,1,2
017,"A CEO conceals environmental impact data.","The public has a right to know the truth.","Business interests must be protected.",3,4,2,-1,2,-3,1,2
018,"A CEO withholds information about layoffs.","Employees deserve honesty about their future.","Market stability requires careful timing.",3,4,2,-1,2,-3,1,2
019,"A soldier disobeys orders to rescue civilians.","Disobey immoral commands to save lives.","Follow orders to maintain discipline.",4,-2,3,1,-1,5,-2,2
020,"A soldier refuses to participate in a questionable mission.","Moral conscience overrides military orders.","Chain of command must be respected.",4,-2,3,1,-1,5,-2,2
021,"A soldier shares classified information about war crimes.","Exposing truth serves greater justice.","Military secrets must be protected.",4,-2,3,1,-1,5,-2,2
022,"A journalist fabricates sources to expose deep corruption.","Fabrication is a betrayal of truth.","Ends justify means when exposing evil.",-3,5,-2,1,3,-4,2,2
023,"A journalist uses hidden cameras to expose corporate crime.","Deception is necessary to reveal truth.","Journalistic ethics must be maintained.",-3,5,-2,1,3,-4,2,2
024,"A journalist publishes leaked classified documents.","Public interest overrides secrecy.","National security must be protected.",-3,5,-2,1,3,-4,2,2
025,"A scientist tests a revolutionary drug on animals without consent.","Animal testing is necessary for cures.","Animal rights must be respected.",4,-4,3,1,-2,5,-1,-1
026,"A scientist conducts experiments on human embryos.","Medical progress justifies the research.","Human life begins at conception.",4,-4,3,1,-2,5,-1,-1
027,"A scientist uses AI to predict criminal behavior.","Preventing crime saves lives.","Predictive policing violates rights.",4,-4,3,1,-2,5,-1,-1
028,"A parent lies to protect their child's feelings.","Protect innocence with a compassionate lie.","Honesty is always the best policy.",2,-3,1,0,-1,4,-1,1
029,"A teacher lies about a student's performance.","Protect the student's self-esteem.","Truth builds character and resilience.",2,-3,1,0,-1,4,-1,1
030,"A friend lies to protect another's reputation.","Preserve the friendship with a white lie.","Honesty strengthens true friendships.",2,-3,1,0,-1,4,-1,1
031,"Police plant evidence to convict a known murderer.","Planting evidence undermines justice.","Justice must be served by any means.",-2,5,-2,1,2,-4,3,-1
032,"Police use illegal surveillance to catch a criminal.","Due process must be followed.","Catching criminals justifies the means.",-2,5,-2,1,2,-4,3,-1
033,"Police use excessive force to stop a violent suspect.","Police brutality is never justified.","Force is necessary to maintain order.",-2,5,-2,1,2,-4,3,-1
034,"A whistleblower leaks company fraud, risking job and freedom.","Transparency is worth the risk.","Obey laws; internal channels should suffice.",4,-1,2,1,-1,5,-1,2
035,"A whistleblower exposes government corruption.","Truth and justice are worth the sacrifice.","Follow proper channels and procedures.",4,-1,2,1,-1,5,-1,2
036,"A whistleblower reveals safety violations.","Public safety justifies the risk.","Company loyalty should come first.",4,-1,2,1,-1,5,-1,2
037,"A citizen refuses to pay taxes they morally oppose.","Civil disobedience can drive change.","Tax evasion is always wrong.",-2,3,-3,5,3,-1,4,-2
038,"A citizen protests against unjust laws.","Stand up for what's right.","Respect the law and work within it.",-2,3,-3,5,3,-1,4,-2
039,"A citizen boycotts unethical companies.","Consumer power can force change.","Business should be free from interference.",-2,3,-3,5,3,-1,4,-2
040,"An AI judges prison sentences based solely on data.","Algorithms ensure fair, unbiased rulings.","Human judgment is essential for justice.",3,-2,2,-2,-1,4,-1,2
041,"An AI makes medical treatment decisions.","Data-driven decisions save lives.","Human doctors must make final calls.",3,-2,2,-2,-1,4,-1,2
042,"An AI determines creditworthiness.","Objective algorithms prevent bias.","Human context matters in decisions.",3,-2,2,-2,-1,4,-1,2
043,"A teacher punishes one student harshly to discipline the entire class.","Harsh discipline maintains order.","Individual rights should be protected.",2,-3,3,-1,-1,4,-2,1
044,"A teacher singles out a student to set an example.","Classroom order requires authority.","Each student deserves fair treatment.",2,-3,3,-1,-1,4,-2,1
045,"A teacher publicly shames a disruptive student.","Maintain classroom control at any cost.","Respect student dignity always.",2,-3,3,-1,-1,4,-2,1
046,"A bank's algorithm denies loans to low-income applicants.","Algorithmic fairness over human bias.","Human judgment is more compassionate.",2,-2,3,-1,-1,5,2,1
047,"A bank uses AI to screen job applicants.","Data prevents hiring discrimination.","Human connection matters in hiring.",2,-2,3,-1,-1,5,2,1
048,"A bank automates customer service completely.","Efficiency benefits all customers.","Human interaction is essential.",2,-2,3,-1,-1,5,2,1
049,"Protesters vandalize property to force social reform.","Destruction undermines the rule of law.","Direct action drives necessary change.",-2,4,-1,0,3,-3,2,1
050,"Protesters block access to businesses.","Peaceful protest is the only way.","Disruption is necessary for change.",-2,4,-1,0,3,-3,2,1
051,"Protesters occupy public spaces.","Respect public property rights.","Occupation forces attention to issues.",-2,4,-1,0,3,-3,2,1
052,"A bystander films a hit-and-run instead of helping the victim.","Documenting raises awareness and leads to justice.","Helping the victim is the priority.",2,-2,1,1,5,3,2,-1
053,"A bystander films police brutality instead of intervening.","Documentation serves greater justice.","Direct intervention saves lives.",2,-2,1,1,5,3,2,-1
054,"A bystander films a fight instead of breaking it up.","Evidence helps prevent future violence.","Stop the violence immediately.",2,-2,1,1,5,3,2,-1
055,"A company uses sweatshop labor to keep prices low.","Stop exploitation regardless of cost.","Competitive pricing benefits consumers.",-1,5,-1,0,2,-3,3,-2
056,"A company outsources to countries with weak labor laws.","Global labor standards must be enforced.","Business efficiency is paramount.",-1,5,-1,0,2,-3,3,-2
057,"A company uses child labor in developing countries.","Child labor is always wrong.","Local economic conditions matter.",-1,5,-1,0,2,-3,3,-2
058,"The government censors hate speech online.","Censor to shield vulnerable groups.","Free speech must be protected.",3,-2,4,-2,-1,5,-2,3
059,"The government regulates social media content.","Protect society from harmful content.","Free expression is fundamental.",3,-2,4,-2,-1,5,-2,3
060,"The government monitors online communications.","Public safety requires surveillance.","Privacy rights are inviolable.",3,-2,4,-2,-1,5,-2,3
`;

// Function to parse CSV data into an array of objects
const parseCSV = (csvString) => {
  const rows = csvString.trim().split('\n');
  const headers = rows[0].split(',').map(header => header.trim());
  const data = rows.slice(1).map(row => {
    const values = row.split(',').map(value => value.trim());
    return headers.reduce((obj, header, index) => {
      const value = values[index];
      if (header === 'id' || header === 'question' || header === 'answer1' || header === 'answer2') {
        obj[header] = value.replace(/^"|"$/g, '').replace(/^\(|\)$/g, '');
      } else {
        obj[header] = parseInt(value, 10);
      }
      return obj;
    }, {});
  });
  return data;
};

// Function to shuffle an array
const shuffle = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const MoralScore = () => {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerScores, setPlayerScores] = useState({
    utilitarian: 0,
    deontological: 0,
    collectivist: 0,
    individualist: 0,
  });
  const [gameOver, setGameOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // Add loading screen effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Parse and set scenarios on component mount
  useEffect(() => {
    const scenariosData = parseCSV(csvData);
    setScenarios(shuffle(scenariosData).slice(0, 10));
    setIsLoading(false);
  }, []);

  // Handle player's choice and update scores
  const handleChoice = (choice) => {
    const suffix = choice === 1 ? '_a1' : '_a2';
    const currentScenario = scenarios[currentIndex];
    setPlayerScores(prev => ({
      utilitarian: prev.utilitarian + currentScenario[`utilitarian${suffix}`],
      deontological: prev.deontological + currentScenario[`deontological${suffix}`],
      collectivist: prev.collectivist + currentScenario[`collectivist${suffix}`],
      individualist: prev.individualist + currentScenario[`individualist${suffix}`],
    }));
    if (currentIndex < 9) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setGameOver(true);
    }
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

  // Loading state
  if (isLoading) {
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

  // Game over state with moral compass results
  if (gameOver) {
    const yAxis = playerScores.utilitarian - playerScores.deontological;
    const xAxis = playerScores.collectivist - playerScores.individualist;

    // Calculate percentages (normalize to 0-100 range)
    const totalY = Math.abs(playerScores.utilitarian) + Math.abs(playerScores.deontological);
    const totalX = Math.abs(playerScores.collectivist) + Math.abs(playerScores.individualist);
    
    const utilitarianPercent = Math.round((playerScores.utilitarian / totalY) * 100);
    const deontologicalPercent = Math.round((Math.abs(playerScores.deontological) / totalY) * 100);
    const collectivistPercent = Math.round((playerScores.collectivist / totalX) * 100);
    const individualistPercent = Math.round((Math.abs(playerScores.individualist) / totalX) * 100);

    const yTrait = yAxis > 0 ? 'Utilitarian' : yAxis < 0 ? 'Deontological' : 'Balanced';
    const xTrait = xAxis > 0 ? 'Collectivist' : xAxis < 0 ? 'Individualist' : 'Balanced';

    // Determine political alignment
    let politicalAlignment = '';
    let alignmentExplanation = '';
    
    if (yAxis > 0 && xAxis > 0) {
      politicalAlignment = 'Democratic Party';
      alignmentExplanation = 'Your utilitarian and collectivist leanings align most closely with the Democratic Party, which tends to prioritize collective welfare and practical outcomes.';
    } else if (yAxis < 0 && xAxis < 0) {
      politicalAlignment = 'Republican Party';
      alignmentExplanation = 'Your deontological and individualist leanings align most closely with the Republican Party, which tends to emphasize individual rights and traditional principles.';
    } else if (yAxis > 0 && xAxis < 0) {
      politicalAlignment = 'Libertarian Party';
      alignmentExplanation = 'Your utilitarian and individualist leanings align most closely with the Libertarian Party, which combines practical outcomes with individual freedom.';
    } else if (yAxis < 0 && xAxis > 0) {
      politicalAlignment = 'Green Party';
      alignmentExplanation = 'Your deontological and collectivist leanings align most closely with the Green Party, which emphasizes both principles and collective action.';
    } else {
      politicalAlignment = 'Independent';
      alignmentExplanation = 'Your balanced moral compass suggests you may not strongly align with any particular party, preferring to evaluate issues on a case-by-case basis.';
    }

    const explanationY = yTrait === 'Utilitarian'
      ? 'You tend to prioritize outcomes and the greater good over strict adherence to rules.'
      : yTrait === 'Deontological'
      ? 'You value principles and rules over the consequences of actions.'
      : 'You have a balanced view on outcome vs. intention.';

    const explanationX = xTrait === 'Collectivist'
      ? 'You prioritize the needs of the group or society over individual rights.'
      : xTrait === 'Individualist'
      ? 'You emphasize individual rights and freedoms over collective needs.'
      : 'You have a balanced view on collectivist vs. individualist values.';

    const chartData = {
      datasets: [
        {
          label: 'Your Moral Compass',
          data: [{ x: xAxis, y: yAxis }],
          backgroundColor: '#09c2f7',
          pointRadius: 10,
        },
      ],
    };

    const chartOptions = {
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'Individualist ← → Collectivist',
            color: '#fff',
          },
          ticks: {
            color: '#fff',
          },
          grid: {
            color: (context) => context.tick.value === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)',
          },
          min: -100,
          max: 100,
        },
        y: {
          type: 'linear',
          title: {
            display: true,
            text: 'Deontological ← → Utilitarian',
            color: '#fff',
          },
          ticks: {
            color: '#fff',
          },
          grid: {
            color: (context) => context.tick.value === 0 ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)',
          },
          min: -100,
          max: 100,
        },
      },
      plugins: {
        legend: {
          labels: {
            color: '#fff',
          },
        },
      },
    };

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
              cursor: 'pointer',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            <img src="/lookzapp trans 2.png" alt="LookzApp" style={{ width: '80%', filter: 'brightness(0) invert(1)' }} />
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
            Your Moral Compass Results
          </Typography>

          <Box sx={{ maxWidth: '600px', mx: 'auto', mt: 4, animation: `${fadeIn} 0.5s ease-out` }}>
            <Box sx={{ 
              width: { xs: '100%', sm: '400px', md: '500px' }, 
              height: { xs: '300px', sm: '400px', md: '500px' }, 
              mx: 'auto',
              mb: 4
            }}>
              <Scatter data={chartData} options={chartOptions} />
            </Box>

            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center', 
              gap: 4,
              mb: 4, 
              mt: -25
            }}>
              <ProgressContainer>
                <StyledCircularProgress
                  variant="determinate"
                  value={utilitarianPercent}
                  size={80}
                  thickness={4}
                />
                <Typography variant="body2" sx={{ color: '#09c2f7' }}>
                  Utilitarian: {utilitarianPercent}%
                </Typography>
              </ProgressContainer>

              <ProgressContainer>
                <StyledCircularProgress
                  variant="determinate"
                  value={deontologicalPercent}
                  size={80}
                  thickness={4}
                />
                <Typography variant="body2" sx={{ color: '#09c2f7' }}>
                  Deontological: {deontologicalPercent}%
                </Typography>
              </ProgressContainer>

              <ProgressContainer>
                <StyledCircularProgress
                  variant="determinate"
                  value={collectivistPercent}
                  size={80}
                  thickness={4}
                />
                <Typography variant="body2" sx={{ color: '#09c2f7' }}>
                  Collectivist: {collectivistPercent}%
                </Typography>
              </ProgressContainer>

              <ProgressContainer>
                <StyledCircularProgress
                  variant="determinate"
                  value={individualistPercent}
                  size={80}
                  thickness={4}
                />
                <Typography variant="body2" sx={{ color: '#09c2f7' }}>
                  Individualist: {individualistPercent}%
                </Typography>
              </ProgressContainer>
            </Box>

            <Typography sx={{ color: '#fff', textAlign: 'center', mb: 2 }}>
              Your moral compass leans towards {yTrait} and {xTrait}.
            </Typography>
            <Typography sx={{ color: '#fff', textAlign: 'center', mb: 2 }}>
              {explanationY}
            </Typography>
            <Typography sx={{ color: '#fff', textAlign: 'center', mb: 2 }}>
              {explanationX}
            </Typography>

            <StyledBox sx={{ mt: 4, mb: 4 }}>
              <Typography variant="h6" sx={{ color: '#09c2f7', mb: 2 }}>
                Political Alignment: {politicalAlignment}
              </Typography>
              <Typography sx={{ color: '#fff' }}>
                {alignmentExplanation}
              </Typography>
            </StyledBox>
          </Box>

          <StyledButton
            onClick={() => {
              setCurrentIndex(0);
              setPlayerScores({ utilitarian: 0, deontological: 0, collectivist: 0, individualist: 0 });
              setGameOver(false);
              setScenarios(shuffle(parseCSV(csvData)).slice(0, 10));
            }}
            sx={{ mt: 4 }}
          >
            Play Again
          </StyledButton>
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
         
        </Box>
      </Box>
    );
  }

  // Check if scenarios are loaded
  if (scenarios.length === 0) {
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
          <Typography variant="h6" sx={{ color: '#09c2f7' }}>No scenarios available.</Typography>
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
          
        </Box>
      </Box>
    );
  }

  const currentScenario = scenarios[currentIndex];

  // Main game interface
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
              cursor: 'pointer',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            <img src="/lookzapp trans 2.png" alt="LookzApp" style={{ width: '80%', filter: 'brightness(0) invert(1)' }} />
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
            Moral Score
          </Typography>

          <Typography variant="h6" sx={{ mb: 2, color: '#09c2f7' }}>
            Scenario {currentIndex + 1}/10
          </Typography>

          <StyledBox sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
            <Typography variant="h5" sx={{ color: '#fff', mb: 2 }}>
              {currentScenario.question}
            </Typography>
          </StyledBox>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            <StyledButton 
              onClick={() => handleChoice(1)}
              sx={{ 
                minWidth: '300px',
                maxWidth: '400px',
                height: 'auto',
                py: 2,
                px: 3
              }}
            >
              <Typography sx={{ color: 'white', fontSize: '1.1rem' }}>
                {currentScenario.answer1}
              </Typography>
            </StyledButton>
            <StyledButton 
              onClick={() => handleChoice(2)}
              sx={{ 
                minWidth: '300px',
                maxWidth: '400px',
                height: 'auto',
                py: 2,
                px: 3
              }}
            >
              <Typography sx={{ color: 'white', fontSize: '1.1rem' }}>
                {currentScenario.answer2}
              </Typography>
            </StyledButton>
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
          
        </Box>
      </Box>
    </Box>
  );
};

export default MoralScore;