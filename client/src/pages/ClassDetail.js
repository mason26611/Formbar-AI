import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  Poll as PollIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../utils/api';

const StyledCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  marginBottom: theme.spacing(3),
}));

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openPollDialog, setOpenPollDialog] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetchClassDetails();
  }, [id]);

  const fetchClassDetails = async () => {
    try {
      const response = await api.get(`/classes/${id}`);
      setClassData(response.data);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to fetch class details');
      }
      setLoading(false);
    }
  };

  const handleCreatePoll = async () => {
    try {
      await api.post('/polls', {
        ...newPoll,
        classId: id
      });
      setOpenPollDialog(false);
      setNewPoll({ question: '', options: ['', ''] });
      fetchClassDetails();
    } catch (err) {
      setError('Failed to create poll');
    }
  };

  const handleSubmitResponse = async (pollId, option) => {
    try {
      await api.post(`/polls/${pollId}/respond`, {
        option
      });
      fetchClassDetails();
    } catch (err) {
      setError('Failed to submit response');
    }
  };

  const handleTogglePoll = async (pollId) => {
    try {
      await api.patch(`/polls/${pollId}/toggle`);
      fetchClassDetails();
    } catch (err) {
      setError('Failed to toggle poll');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!classData) {
    return (
      <Container>
        <Alert severity="error">Class not found</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', py: 4 }}>
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1a237e', mb: 1 }}>
            {classData.name}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            {classData.subject}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <StyledTabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Polls" />
          <Tab label="Students" />
        </StyledTabs>

        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenPollDialog(true)}
                sx={{
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                  },
                }}
              >
                Create Poll
              </Button>
            </Box>

            <Grid container spacing={3}>
              {classData.polls?.map((poll) => (
                <Grid item xs={12} key={poll.id}>
                  <StyledCard>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                          {poll.question}
                        </Typography>
                        <Chip
                          label={poll.isActive ? 'Active' : 'Closed'}
                          color={poll.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>

                      <Grid container spacing={2}>
                        {poll.options.map((option, index) => (
                          <Grid item xs={12} sm={6} key={index}>
                            <Button
                              fullWidth
                              variant={poll.userResponse === index ? 'contained' : 'outlined'}
                              onClick={() => handleSubmitResponse(poll.id, index)}
                              disabled={!poll.isActive || poll.userResponse !== null}
                              sx={{ mb: 1 }}
                            >
                              {option.text}
                            </Button>
                          </Grid>
                        ))}
                      </Grid>

                      {poll.responses?.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Responses: {poll.responses.length}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {poll.responses.map((response, index) => (
                              <Chip
                                key={index}
                                label={poll.options[response.optionIndex].text}
                                size="small"
                                sx={{ mb: 1 }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions>
                      {classData.isTeacher && (
                        <Button
                          size="small"
                          onClick={() => handleTogglePoll(poll.id)}
                          startIcon={poll.isActive ? <CancelIcon /> : <CheckCircleIcon />}
                        >
                          {poll.isActive ? 'Close Poll' : 'Open Poll'}
                        </Button>
                      )}
                    </CardActions>
                  </StyledCard>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <List>
              {classData.students?.map((student) => (
                <React.Fragment key={student.id}>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <PersonIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={student.name}
                      secondary={student.email}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        <Dialog open={openPollDialog} onClose={() => setOpenPollDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Create New Poll</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Question"
              fullWidth
              value={newPoll.question}
              onChange={(e) => setNewPoll({ ...newPoll, question: e.target.value })}
              sx={{ mb: 2 }}
            />
            {newPoll.options.map((option, index) => (
              <TextField
                key={index}
                margin="dense"
                label={`Option ${index + 1}`}
                fullWidth
                value={option}
                onChange={(e) => {
                  const newOptions = [...newPoll.options];
                  newOptions[index] = e.target.value;
                  setNewPoll({ ...newPoll, options: newOptions });
                }}
                sx={{ mb: 2 }}
              />
            ))}
            <Button
              onClick={() => setNewPoll({ ...newPoll, options: [...newPoll.options, ''] })}
              startIcon={<AddIcon />}
            >
              Add Option
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenPollDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreatePoll}
              variant="contained"
              disabled={!newPoll.question || newPoll.options.some(opt => !opt)}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ClassDetail; 