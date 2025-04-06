import React from 'react';
import { Stack, TextField, Button } from '@mui/material';

function BasicInfoForm({ formData, onChange, onNext }) {
  return (
    <Stack spacing={2}>
      <TextField
        label="Email Address"
        name="email"
        value={formData.email}
        onChange={onChange}
        required
        fullWidth
      />
      <TextField
        label="Password"
        type="password"
        name="password"
        value={formData.password}
        onChange={onChange}
        required
        fullWidth
      />
      <TextField
        label="Display Name"
        name="displayName"
        value={formData.displayName}
        onChange={onChange}
        required
        fullWidth
      />
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
  );
}

export default BasicInfoForm;