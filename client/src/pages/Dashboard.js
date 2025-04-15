import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  Poll as PollIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { api } from '../context/AuthContext';

const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledCardContent = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
}));

const Dashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newClass, setNewClass] = useState({ 
    name: '', 
    subject: ''
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchClasses();
  }, [user, navigate]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to fetch classes');
      }
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    try {
      if (!newClass.name || !newClass.subject) {
        setError('Please fill in all fields');
        return;
      }
      await api.post('/classes', newClass);
      setOpenDialog(false);
      setNewClass({ name: '', subject: '' });
      fetchClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create class');
    }
  };

  const handleJoinClass = async (classId) => {
    try {
      await api.post(`/classes/${classId}/join`);
      fetchClasses();
    } catch (err) {
      setError('Failed to join class');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1a237e' }}>
            My Classes
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              background: 'linear-gradient(45deg, #8E2DE2, #4A00E0)',
              '&:hover': {
                background: 'linear-gradient(45deg, #7B1FA2, #3F51B5)',
              },
            }}
          >
            Create Class
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {classes.map((classItem) => (
            <Grid item xs={12} sm={6} md={4} key={classItem.id}>
              <StyledCard>
                <StyledCardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SchoolIcon sx={{ mr: 1, color: '#1a237e' }} />
                    <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                      {classItem.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {classItem.subject}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      icon={<PollIcon />}
                      label={`${classItem.pollCount || 0} Polls`}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(26, 35, 126, 0.1)',
                        color: '#1a237e',
                      }}
                    />
                    <Chip
                      icon={<SchoolIcon />}
                      label={`${classItem.studentCount || 0} Students`}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(26, 35, 126, 0.1)',
                        color: '#1a237e',
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={classItem.teacher?.avatar}
                      alt={classItem.teacher?.name}
                      sx={{ 
                        width: 24, 
                        height: 24, 
                        mr: 1,
                        backgroundColor: '#1a237e',
                      }}
                    >
                      {classItem.teacher?.name?.[0]}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary">
                      {classItem.teacher?.name}
                    </Typography>
                  </Box>
                </StyledCardContent>
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    size="small"
                    onClick={() => navigate(`/class/${classItem.id}`)}
                    sx={{ 
                      mr: 1,
                      color: '#1a237e',
                      '&:hover': {
                        backgroundColor: 'rgba(26, 35, 126, 0.1)',
                      }
                    }}
                  >
                    View Details
                  </Button>
                  {!classItem.isEnrolled && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleJoinClass(classItem.id)}
                      sx={{
                        backgroundColor: '#1a237e',
                        '&:hover': {
                          backgroundColor: '#0d47a1',
                        }
                      }}
                    >
                      Join Class
                    </Button>
                  )}
                </CardActions>
              </StyledCard>
            </Grid>
          ))}
        </Grid>

        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Class Name"
              type="text"
              fullWidth
              value={newClass.name}
              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Subject"
              type="text"
              fullWidth
              value={newClass.subject}
              onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateClass} variant="contained" color="primary">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Dashboard; 