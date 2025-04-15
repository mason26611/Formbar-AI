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
  Tab,
  Paper,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  School as SchoolIcon,
  Poll as PollIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  ContentCopy as ContentCopyIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';

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

// Colors for the pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B', '#6B8E23', '#9370DB'];

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openPollDialog, setOpenPollDialog] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });
  const [activeTab, setActiveTab] = useState(0);
  const [codeCopied, setCodeCopied] = useState(false);
  const { user } = useAuth();
  const [activePoll, setActivePoll] = useState(null);

  useEffect(() => {
    fetchClassDetails();
  }, [id]);

  const fetchClassDetails = async () => {
    try {
      const response = await api.get(`/classes/${id}`);
      setClassData(response.data);
      
      // Find the active poll if any
      if (response.data.polls && response.data.polls.length > 0) {
        const activePolls = response.data.polls.filter(poll => poll.isActive);
        if (activePolls.length > 0) {
          setActivePoll(activePolls[0]);
        }
      }
      
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

  const copyClassCode = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  // Convert poll data to format for pie chart
  const getPollChartData = (poll) => {
    if (!poll || !poll.options) return [];
    
    // Count responses for each option
    const responseCounts = poll.options.map((option, index) => {
      const count = poll.responses?.filter(r => r.optionIndex === index).length || 0;
      // Handle different option structures
      const optionText = typeof option === 'string' ? option : option.text || `Option ${index + 1}`;
      
      return {
        name: optionText,
        value: count,
        optionIndex: index
      };
    });
    
    return responseCounts;
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

  // Check if user is a teacher for this class
  const isTeacher = user && (user.role === 'teacher' || user.role === 'manager') && classData.teacherId === user.id;

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
          
          {/* Display join code for teachers */}
          {isTeacher && (
            <Paper sx={{ mt: 2, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 400 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Class Join Code
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                  {classData.code}
                </Typography>
              </Box>
              <Tooltip title={codeCopied ? "Copied!" : "Copy code"}>
                <IconButton onClick={() => copyClassCode(classData.code)}>
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>
            </Paper>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Different views for teachers and students */}
        {isTeacher ? (
          // Teacher view
          <>
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
                                  variant="outlined"
                                  sx={{ 
                                    mb: 1,
                                    justifyContent: 'space-between',
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }}
                                >
                                  <Box sx={{ zIndex: 1, width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography>
                                      {typeof option === 'string' ? option : option.text || `Option ${index + 1}`}
                                    </Typography>
                                    <Typography>
                                      {poll.responses?.filter(r => r.optionIndex === index).length || 0}
                                    </Typography>
                                  </Box>
                                  <Box 
                                    sx={{ 
                                      position: 'absolute', 
                                      left: 0, 
                                      top: 0, 
                                      bottom: 0, 
                                      bgcolor: 'rgba(25, 118, 210, 0.1)', 
                                      zIndex: 0,
                                      width: `${(poll.responses?.filter(r => r.optionIndex === index).length || 0) / 
                                        (poll.responses?.length || 1) * 100}%`
                                    }}
                                  />
                                </Button>
                              </Grid>
                            ))}
                          </Grid>

                          {poll.responses?.length > 0 && (
                            <Box sx={{ mt: 3, height: 300 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Response Distribution
                              </Typography>
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={getPollChartData(poll)}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {getPollChartData(poll).map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Legend />
                                  <RechartsTooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </Box>
                          )}
                        </CardContent>
                        <CardActions>
                          <Button
                            size="small"
                            onClick={() => handleTogglePoll(poll.id)}
                            startIcon={poll.isActive ? <CancelIcon /> : <CheckCircleIcon />}
                          >
                            {poll.isActive ? 'Close Poll' : 'Open Poll'}
                          </Button>
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
          </>
        ) : (
          // Student view
          <Box>
            {/* Active Poll Section */}
            {activePoll ? (
              <StyledCard sx={{ mb: 4 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <PollIcon sx={{ color: '#1a237e', mr: 1 }} />
                    <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
                      Active Poll
                    </Typography>
                  </Box>
                  
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                    {activePoll.question}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {activePoll.options.map((option, index) => {
                      const hasVoted = activePoll.userResponse !== null;
                      const isSelected = activePoll.userResponse === index;
                      // Handle different option structures
                      const optionText = typeof option === 'string' ? option : option.text || `Option ${index + 1}`;
                      
                      return (
                        <Grid item xs={12} sm={6} key={index}>
                          <Button
                            fullWidth
                            variant={isSelected ? "contained" : "outlined"}
                            color={isSelected ? "primary" : "inherit"}
                            onClick={() => handleSubmitResponse(activePoll.id, index)}
                            disabled={hasVoted}
                            sx={{ 
                              py: 2,
                              mb: 1,
                              fontSize: '1rem',
                              backgroundColor: isSelected ? '#1a237e' : 'transparent',
                              '&:hover': {
                                backgroundColor: isSelected ? '#0d47a1' : 'rgba(26, 35, 126, 0.1)',
                              }
                            }}
                          >
                            {optionText}
                          </Button>
                        </Grid>
                      );
                    })}
                  </Grid>
                  
                  {activePoll.userResponse !== null && (
                    <Alert severity="success" sx={{ mt: 3 }}>
                      Your response has been recorded!
                    </Alert>
                  )}
                </CardContent>
              </StyledCard>
            ) : (
              <Alert severity="info" sx={{ mb: 4 }}>
                There are no active polls at the moment.
              </Alert>
            )}
            
            {/* Poll Results - The Virtual Bar (Pie Chart) */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <BarChartIcon sx={{ mr: 1 }} />
                Virtual Bar
              </Typography>
              
              {classData.polls && classData.polls.length > 0 ? (
                <Grid container spacing={3}>
                  {classData.polls.filter(poll => poll.responses && poll.responses.length > 0).map(poll => (
                    <Grid item xs={12} md={6} key={poll.id}>
                      <StyledCard>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            {poll.question}
                          </Typography>
                          
                          <Box sx={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={getPollChartData(poll)}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  outerRadius={80}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {getPollChartData(poll).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Legend />
                                <RechartsTooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </Box>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                            Total Responses: {poll.responses?.length || 0}
                          </Typography>
                        </CardContent>
                      </StyledCard>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  No poll results available yet.
                </Alert>
              )}
            </Box>
          </Box>
        )}

        {/* Poll creation dialog - only for teachers */}
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