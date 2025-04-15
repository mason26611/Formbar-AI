import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  InputAdornment,
  Link
} from '@mui/material';
import {
  School as SchoolIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { api } from '../context/AuthContext';

const JoinClass = () => {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Make sure only students can access this page
    if (user && user.role !== 'student') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleJoinClass = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!joinCode.trim()) {
      setError('Please enter a class code');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.post('/classes/join', { classCode: joinCode.trim() });
      setSuccess(response.data.message);
      setJoinCode('');
      
      // Redirect to dashboard after successful join
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 8 }}>
      <Container maxWidth="sm">
        <Box sx={{ mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ mb: 2 }}
          >
            Back to Dashboard
          </Button>
        </Box>
        
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <SchoolIcon sx={{ fontSize: 48, color: '#1a237e', mb: 1 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
              Join a Class
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Enter the class code provided by your teacher
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}
          
          <form onSubmit={handleJoinClass}>
            <TextField
              autoFocus
              fullWidth
              label="Class Code"
              variant="outlined"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SchoolIcon />
                  </InputAdornment>
                ),
              }}
              disabled={loading || !!success}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !!success}
              sx={{
                py: 1.5,
                background: 'linear-gradient(45deg, #8E2DE2, #4A00E0)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #7B1FA2, #3F51B5)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Join Class'}
            </Button>
          </form>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Don't have a class code? Ask your teacher for an invitation code.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default JoinClass; 