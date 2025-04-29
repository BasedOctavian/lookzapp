import React from 'react';
import {
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Button,
  styled
} from '@mui/material';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    borderRadius: '12px',
    border: '1px solid rgba(250, 14, 164, 0.2)',
    backgroundColor: 'transparent',
    '& fieldset': {
      borderColor: 'rgba(9, 194, 247, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(9, 194, 247, 0.4)',
    },
    '& input': {
      color: '#fff',
      backgroundColor: 'transparent',
      '&::placeholder': {
        color: 'rgba(255,255,255,0.5)',
      }
    }
  },
  '& .MuiInputLabel-root': {
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  '& .MuiFormHelperText-root': {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '0.75rem',
  }
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    color: '#fff',
    borderRadius: '12px',
    border: '1px solid rgba(250, 14, 164, 0.2)',
    backgroundColor: 'transparent',
    '& fieldset': {
      borderColor: 'rgba(9, 194, 247, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(9, 194, 247, 0.4)',
    }
  },
  '& .MuiInputLabel-root': {
    color: '#fff',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  '& .MuiSelect-icon': {
    color: '#fff',
  }
}));

const StyledRadio = styled(Radio)({
  color: '#fff',
  '&.Mui-checked': {
    color: '#09c2f7',
  }
});

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
  animation: 'gradientFlow 6s ease infinite',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 0 24px rgba(9, 194, 247, 0.4)',
  },
  '&.Mui-disabled': {
    background: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.5)'
  }
});

const OutlinedButton = styled(Button)({
  color: '#09c2f7',
  borderColor: 'rgba(9, 194, 247, 0.3)',
  '&:hover': {
    borderColor: '#09c2f7',
    backgroundColor: 'rgba(9, 194, 247, 0.1)',
  }
});

function PhysicalInfoForm({ formData, onChange, onPrev, onNext }) {
  return (
    <Stack spacing={2}>
      <FormControl component="fieldset" required>
        <FormLabel component="legend" sx={{ 
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.875rem',
          fontWeight: 500,
          mb: 1
        }}>
          Gender
        </FormLabel>
        <RadioGroup
          row
          name="gender"
          value={formData.gender}
          onChange={onChange}
        >
          <FormControlLabel 
            value="male" 
            control={<StyledRadio />} 
            label="Male" 
            sx={{ color: 'rgba(255,255,255,0.7)' }} 
          />
          <FormControlLabel 
            value="female" 
            control={<StyledRadio />} 
            label="Female" 
            sx={{ color: 'rgba(255,255,255,0.7)' }} 
          />
        </RadioGroup>
      </FormControl>
      <FormControl fullWidth required>
        <InputLabel sx={{ 
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.875rem',
          fontWeight: 500
        }}>
          Ethnicity
        </InputLabel>
        <StyledSelect
          sx={{
            color: '#fff',
          }}
          label="Ethnicity"
          name="ethnicity"
          value={formData.ethnicity}
          onChange={onChange}
        >
          <MenuItem value="" disabled>
            Select ethnicity
          </MenuItem>
          <MenuItem value="European">European</MenuItem>
          <MenuItem value="African">African</MenuItem>
          <MenuItem value="East Asian">East Asian</MenuItem>
          <MenuItem value="South Asian">South Asian</MenuItem>
          <MenuItem value="Middle Eastern">Middle Eastern</MenuItem>
          <MenuItem value="Hispanic/Latino">Hispanic/Latino</MenuItem>
          <MenuItem value="Native American">Native American</MenuItem>
          <MenuItem value="Pacific Islander">Pacific Islander</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </StyledSelect>
      </FormControl>
      <FormControl fullWidth required>
        <InputLabel sx={{ 
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.875rem',
          fontWeight: 500
        }}>
          Eye Color
        </InputLabel>
        <StyledSelect
          sx={{
            color: '#fff',
          }}
          label="Eye Color"
          name="eyeColor"
          value={formData.eyeColor}
          onChange={onChange}
        >
          <MenuItem value="" disabled>
            Select eye color
          </MenuItem>
          <MenuItem value="blue">Blue</MenuItem>
          <MenuItem value="green">Green</MenuItem>
          <MenuItem value="brown">Brown</MenuItem>
          <MenuItem value="hazel">Hazel</MenuItem>
          <MenuItem value="gray">Gray</MenuItem>
          <MenuItem value="other">Other</MenuItem>
        </StyledSelect>
      </FormControl>
      <Stack direction="row" spacing={2}>
        <StyledTextField
          label="Height (feet)"
          type="number"
          name="heightFeet"
          value={formData.heightFeet}
          onChange={onChange}
          required
          fullWidth
          inputProps={{ min: 0, max: 8 }}
          sx={{ mb: 1 }}
        />
        <StyledTextField
          label="Height (inches)"
          type="number"
          name="heightInches"
          value={formData.heightInches}
          onChange={onChange}
          required
          fullWidth
          inputProps={{ min: 0, max: 11 }}
          sx={{ mb: 1 }}
        />
      </Stack>
      <StyledTextField
        label="Weight (pounds)"
        type="number"
        name="weight"
        value={formData.weight}
        onChange={onChange}
        required
        fullWidth
        sx={{ mb: 1 }}
      />
      <Stack direction="row" spacing={2}>
        <OutlinedButton
          variant="outlined"
          size="large"
          fullWidth
          onClick={onPrev}
        >
          Previous
        </OutlinedButton>
        <AuthButton
          variant="contained"
          size="large"
          fullWidth
          onClick={onNext}
        >
          Next
        </AuthButton>
      </Stack>
    </Stack>
  );
}

export default PhysicalInfoForm;