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
} from '@mui/material';

function PhysicalInfoForm({ formData, onChange, onPrev, onNext }) {
  return (
    <Stack spacing={2}>
      <FormControl component="fieldset" required>
        <FormLabel component="legend">Gender</FormLabel>
        <RadioGroup
          row
          name="gender"
          value={formData.gender}
          onChange={onChange}
        >
          <FormControlLabel value="male" control={<Radio />} label="Male" />
          <FormControlLabel value="female" control={<Radio />} label="Female" />
        </RadioGroup>
      </FormControl>
      <FormControl fullWidth required>
        <InputLabel>Ethnicity</InputLabel>
        <Select
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
        </Select>
      </FormControl>
      <FormControl fullWidth required>
        <InputLabel>Eye Color</InputLabel>
        <Select
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
        </Select>
      </FormControl>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Height (feet)"
          type="number"
          name="heightFeet"
          value={formData.heightFeet}
          onChange={onChange}
          required
          fullWidth
          inputProps={{ min: 0, max: 8 }}
        />
        <TextField
          label="Height (inches)"
          type="number"
          name="heightInches"
          value={formData.heightInches}
          onChange={onChange}
          required
          fullWidth
          inputProps={{ min: 0, max: 11 }}
        />
      </Stack>
      <TextField
        label="Weight (pounds)"
        type="number"
        name="weight"
        value={formData.weight}
        onChange={onChange}
        required
        fullWidth
      />
      <Stack direction="row" spacing={2}>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          fullWidth
          onClick={onPrev}
        >
          Previous
        </Button>
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          onClick={onNext}
        >
          Next
        </Button>
      </Stack>
    </Stack>
  );
}

export default PhysicalInfoForm;