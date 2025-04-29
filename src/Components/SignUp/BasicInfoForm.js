import React from 'react';
import { 
  Stack, 
  TextField, 
  Button, 
  styled, 
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Box,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
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
const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    borderRadius: '12px',
    border: '1px solid rgba(250, 14, 164, 0.3)',
    backgroundColor: 'rgba(13, 17, 44, 0.3)',
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: 'rgba(9, 194, 247, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(9, 194, 247, 0.5)',
      boxShadow: '0 0 10px rgba(9, 194, 247, 0.2)'
    },
    '&.Mui-focused fieldset': {
      borderColor: '#fa0ea4',
      boxShadow: '0 0 0 2px rgba(250, 14, 164, 0.2)'
    },
    '& input': {
      color: '#fff',
      '&::placeholder': {
        color: 'rgba(255,255,255,0.5)',
        opacity: 1
      }
    },
    '& .MuiInputBase-input': {
      color: '#fff',
      '&::placeholder': {
        color: 'rgba(255,255,255,0.5)',
        opacity: 1
      }
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.875rem',
    fontWeight: 500,
    '&.Mui-focused': {
      color: '#09c2f7',
    },
  },
  '& .MuiFormHelperText-root': {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.75rem',
  }
}));

const PasswordField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    borderRadius: '12px',
    border: '1px solid rgba(250, 14, 164, 0.3)',
    backgroundColor: 'rgba(13, 17, 44, 0.3)',
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: 'rgba(9, 194, 247, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(9, 194, 247, 0.5)',
      boxShadow: '0 0 10px rgba(9, 194, 247, 0.2)'
    },
    '&.Mui-focused fieldset': {
      borderColor: '#fa0ea4',
      boxShadow: '0 0 0 2px rgba(250, 14, 164, 0.2)'
    },
    '& input': {
      color: '#fff',
      '&::placeholder': {
        color: 'rgba(255,255,255,0.5)',
        opacity: 1
      }
    },
    '& .MuiInputBase-input': {
      color: '#fff',
      '&::placeholder': {
        color: 'rgba(255,255,255,0.5)',
        opacity: 1
      }
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255,255,255,0.7)',
    '&.Mui-focused': {
      color: '#09c2f7',
    },
  },
}));

const AuthButton = styled(Button)({
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
  },
  '&.Mui-disabled': {
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.5)'
  }
});

function BasicInfoForm({ formData, onChange, onNext }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Stack spacing={3} sx={{ width: '100%' }}>
      <StyledTextField
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={onChange}
        required
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ 
                width: 24, 
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="#09c2f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 6L12 13L2 6" stroke="#09c2f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
            </InputAdornment>
          )
        }}
      />
      
      <PasswordField
        label="Password"
        type={showPassword ? 'text' : 'password'}
        name="password"
        value={formData.password}
        onChange={onChange}
        required
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                sx={{ color: 'rgba(255,255,255,0.7)' }}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      
      <StyledTextField
        label="Display Name"
        name="displayName"
        value={formData.displayName}
        onChange={onChange}
        required
        fullWidth
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ 
                width: 24, 
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12Z" stroke="#09c2f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 20V18C6 16.9391 6.42143 15.9217 7.17157 15.1716C7.92172 14.4214 8.93913 14 10 14H14C15.0609 14 16.0783 14.4214 16.8284 15.1716C17.5786 15.9217 18 16.9391 18 18V20" stroke="#09c2f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Box>
            </InputAdornment>
          )
        }}
      />
      
      <AuthButton
        variant="contained"
        size="large"
        fullWidth
        onClick={onNext}
        sx={{ 
          mt: 2,
          height: isMobile ? '48px' : '56px',
          fontSize: isMobile ? '0.95rem' : '1rem'
        }}
      >
        Next
      </AuthButton>
    </Stack>
  );
}

export default BasicInfoForm; 