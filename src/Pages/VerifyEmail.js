import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../firebase';
import { applyActionCode } from 'firebase/auth';
import { Typography, Box, keyframes } from '@mui/material';

const neonGlow = keyframes`
  0% { box-shadow: 0 0 5px #09c2f7, 0 0 10px #09c2f7, 0 0 15px #09c2f7; }
  50% { box-shadow: 0 0 10px #09c2f7, 0 0 20px #09c2f7, 0 0 30px #09c2f7; }
  100% { box-shadow: 0 0 5px #09c2f7, 0 0 10px #09c2f7, 0 0 15px #09c2f7; }
`;

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const oobCode = searchParams.get('oobCode');
        if (!oobCode) {
          navigate('/signin');
          return;
        }

        await applyActionCode(auth, oobCode);
        // Wait 5 seconds before redirecting
        setTimeout(() => {
          navigate('/signin');
        }, 5000);
      } catch (error) {
        // If there's an error, still redirect after 5 seconds
        setTimeout(() => {
          navigate('/signin');
        }, 5000);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at center, #0d112c 0%, #66043e 100%),
          linear-gradient(45deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))
        `,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4
      }}
    >
      <Box
        sx={{
          width: 120,
          height: 120,
          background: 'linear-gradient(45deg, #09c2f7, #fa0ea4)',
          borderRadius: '24px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
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

      <Typography 
        sx={{ 
          color: '#6ce9ff',
          textShadow: '0 0 10px rgba(9, 194, 247, 0.3)',
          fontSize: '1.2rem',
          fontWeight: 500
        }}
      >
        Please wait
      </Typography>
    </Box>
  );
}

export default VerifyEmail; 