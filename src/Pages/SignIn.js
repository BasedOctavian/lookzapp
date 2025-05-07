import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import useSnackbar from '../hooks/SignIn/useSnackbar';
import { 
  Box, 
  Typography, 
  Button, 
  Link, 
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  OutlinedInput,
  FormHelperText,
  useTheme, 
  useMediaQuery,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { keyframes } from '@emotion/react';
import { styled } from '@mui/material/styles';

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
const AuthContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: `
    radial-gradient(circle at center, #0d112c 0%, #66043e 100%),
    linear-gradient(45deg, rgba(9, 194, 247, 0.1), rgba(250, 14, 164, 0.1))
  `,
  position: 'relative',
  overflow: 'hidden',
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
  }
}));

const AuthCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(5),
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

const AuthLink = styled(Link)({
  color: '#09c2f7',
  textDecoration: 'none',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  '&:hover': {
    color: '#fa0ea4',
    textShadow: '0 0 8px rgba(250, 14, 164, 0.6)'
  }
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: 'rgba(255,255,255,0.7)',
    borderRadius: '12px',
    border: '1px solid rgba(250, 14, 164, 0.3)',
    backgroundColor: 'transparent',
    '& fieldset': {
      borderColor: 'rgba(9, 194, 247, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(9, 194, 247, 0.5)',
    },
    '& input': {
      color: 'rgba(255,255,255,0.7)',
      backgroundColor: 'transparent',
      '&::placeholder': {
        color: 'rgba(255,255,255,0.5)',
      }
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255,255,255,0.7)',
  },
  '& .MuiFormHelperText-root': {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.75rem',
  }
}));

const PasswordField = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: 'rgba(255,255,255,0.7)',
    borderRadius: '12px',
    border: '1px solid rgba(250, 14, 164, 0.3)',
    backgroundColor: 'transparent',
    '& fieldset': {
      borderColor: 'rgba(9, 194, 247, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(9, 194, 247, 0.5)',
    },
    '& input': {
      color: 'rgba(255,255,255,0.7)',
      backgroundColor: 'transparent',
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255,255,255,0.7)',
  },
}));

function SignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  const [verificationSent, setVerificationSent] = useState(false);
  
  const { signIn, resendVerificationEmail } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { showSnackbar, SnackbarComponent } = useSnackbar();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleResendVerification = async () => {
    try {
      const success = await resendVerificationEmail();
      if (success) {
        setVerificationSent(true);
        showSnackbar('Verification email sent! Please check your inbox.', 'success');
      }
    } catch (error) {
      showSnackbar(error.message, 'error');
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      password: ''
    };

    if (!formData.email) {
      newErrors.email = 'Email is required';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      valid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await signIn(formData.email, formData.password);
      navigate('/');
    } catch (error) {
      if (error.message.includes('verify your email')) {
        setErrors({
          email: ' ',
          password: 'Please verify your email before signing in'
        });
        setVerificationSent(false);
      } else {
        setErrors({
          email: ' ',
          password: 'Invalid email or password'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContainer>
      <AuthCard>
        <Typography 
          variant="h3" 
          sx={{
            mb: 4,
            textAlign: 'center',
            background: 'linear-gradient(45deg, #fff 30%, #09c2f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 800,
            fontSize: isMobile ? '2rem' : '2.5rem'
          }}
        >
          Sign In
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <StyledTextField
            fullWidth
            margin="normal"
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
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
          
          <StyledTextField
            fullWidth
            margin="normal"
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
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
          
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <AuthLink href="/forgot-password" variant="body2">
              Forgot password?
            </AuthLink>
          </Box>
          
          {errors.password === 'Please verify your email before signing in' && !verificationSent && (
            <Button
              onClick={handleResendVerification}
              sx={{
                mt: 2,
                color: '#09c2f7',
                '&:hover': {
                  backgroundColor: 'rgba(9, 194, 247, 0.1)',
                },
              }}
            >
              Resend Verification Email
            </Button>
          )}
          
          <AuthButton
            fullWidth
            type="submit"
            disabled={isLoading}
            sx={{ mt: 3 }}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </AuthButton>
        </Box>
        
        <Typography 
          variant="body1" 
          sx={{
            mt: 3,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.7)'
          }}
        >
          Don't have an account?{' '}
          <AuthLink href="/signup">Sign Up</AuthLink>
        </Typography>
      </AuthCard>
      {SnackbarComponent}
    </AuthContainer>
  );
}

export default SignIn;