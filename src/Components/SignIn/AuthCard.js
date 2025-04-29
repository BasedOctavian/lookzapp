import React from 'react';
import { 
  Paper, 
  Stack, 
  Typography, 
  Link, 
  styled,
} from '@mui/material';
import { keyframes } from '@emotion/react';

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
const CyberPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  width: '100%',
  maxWidth: 480,
  backdropFilter: 'blur(16px)',
  backgroundColor: 'rgba(13, 17, 44, 0.7)',
  border: '1px solid rgba(250, 14, 164, 0.2)',
  borderRadius: '24px',
  boxShadow: '0 8px 32px rgba(9, 194, 247, 0.2)',
  animation: `${neonGlow} 3s infinite alternate`,
  transition: 'all 0.3s ease',
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

const CyberLink = styled(Link)({
  color: '#09c2f7',
  textDecoration: 'none',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  '&:hover': {
    color: '#fa0ea4',
    textShadow: '0 0 8px rgba(250, 14, 164, 0.6)'
  }
});

function AuthCard({ title, form, linkText, linkHref, linkLabel }) {
  return (
    <CyberPaper elevation={0}>
      <Stack spacing={3}>
        <Typography 
          variant="h3" 
          align="center"
          sx={{
            background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            fontSize: { xs: '1.8rem', sm: '2.2rem' },
            mb: 1
          }}
        >
          {title}
        </Typography>
        
        {form}
        
        <Typography 
          align="center" 
          sx={{ 
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.95rem'
          }}
        >
          {linkText}{' '}
          <CyberLink href={linkHref}>
            {linkLabel}
          </CyberLink>
        </Typography>
      </Stack>
    </CyberPaper>
  );
}

export default AuthCard;