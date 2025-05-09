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
  BarChart as BarChartIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(ArcElement, ChartTooltip, Legend);

// Create a simple chart component to replace recharts
const SimpleBarChart = ({ data }) => {
  if (!data || data.length === 0) return <Typography>No data to display</Typography>;
  
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <Box sx={{ height: '300px', width: '100%', mt: 2 }}>
      {data.map((item, index) => {
        const percentage = total > 0 ? (item.value / total * 100).toFixed(1) : 0;
        const color = [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
          '#9966FF', '#FF9F40', '#8AC249', '#EA4335'
        ][index % 8];
        
        return (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography>{item.name}</Typography>
              <Typography>{item.value} ({percentage}%)</Typography>
            </Box>
            <Box sx={{ 
              width: '100%', 
              height: '24px', 
              bgcolor: '#f5f5f5',
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative'
            }}>
              <Box 
                sx={{ 
                  height: '100%', 
                  width: `${percentage}%`, 
                  bgcolor: color,
                  transition: 'width 0.5s ease-in-out'
                }} 
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

const SimplePieVisualization = ({ data, title }) => {
  if (!data || data.length === 0) return <Typography>No data available</Typography>;
  
  return (
    <Box sx={{ p: 2 }}>
      {title && <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>}
      <Grid container spacing={2}>
        {data.map((item, index) => {
          const color = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#8AC249', '#EA4335'
          ][index % 8];
          
          return (
            <Grid item xs={6} key={index}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                mb: 2 
              }}>
                <Box sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  bgcolor: color,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  mb: 1
                }}>
                  <Typography sx={{ color: 'white', fontWeight: 'bold' }}>
                    {item.value}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ textAlign: 'center' }}>
                  {item.name}
                </Typography>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

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

// Colors for the pie chart - using more vibrant, distinct colors
const COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8AC249', '#EA4335'];

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
  const { joinClassRoom, leaveClassRoom, subscribe } = useSocket();
  const [socketUpdate, setSocketUpdate] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [regeneratingCode, setRegeneratingCode] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Class ID is missing');
      setLoading(false);
      return;
    }
    
    fetchClassDetails();

    // Join class room for real-time updates
    joinClassRoom(id);

    // Set up event listeners for poll-related events
    const unsubscribeNewPoll = subscribe('newPoll', (data) => {
      console.log('New poll created:', data);
      if (data.classId === parseInt(id)) {
        fetchClassDetails();
      }
    });

    const unsubscribePollResponse = subscribe('pollResponse', (data) => {
      console.log('Poll response received:', data);
      // Store the update data to be processed in a separate effect
      setSocketUpdate(data);
    });

    const unsubscribePollToggle = subscribe('pollToggle', (data) => {
      console.log('Poll status toggled:', data);
      if (data.classId === parseInt(id)) {
        fetchClassDetails();
      }
    });

    // Listen for student removal
    const unsubscribeStudentRemoved = subscribe('studentRemoved', (data) => {
      console.log('Student removed event received:', data);
      
      // Check if current user is the one being removed
      if (user && data.studentId === user.id && data.classId === parseInt(id)) {
        // Display notification
        setError('You have been removed from this class.');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        // If another student was removed, just refresh the class data
        fetchClassDetails();
      }
    });

    return () => {
      // Clean up event listeners on component unmount
      unsubscribeNewPoll();
      unsubscribePollResponse();
      unsubscribePollToggle();
      unsubscribeStudentRemoved();
      
      // Leave class room
      leaveClassRoom(id);
    };
  }, [id, joinClassRoom, leaveClassRoom, subscribe, user, navigate]);

  // Handle socket updates in a separate effect to avoid dependency cycle
  useEffect(() => {
    if (!socketUpdate || !classData || !classData.polls) return;

    try {
      // Find the poll that was updated
      const { poll: updatedPoll } = socketUpdate;
      if (!updatedPoll || !updatedPoll.id) return;
      
      // Create a deep copy of classData to avoid reference issues
      const updatedClassData = JSON.parse(JSON.stringify(classData));
      
      // Find and update the poll in the classData
      const pollIndex = updatedClassData.polls.findIndex(p => p.id === updatedPoll.id);
      if (pollIndex !== -1) {
        // Update the specific poll with new data
        updatedClassData.polls[pollIndex] = {
          ...updatedClassData.polls[pollIndex],
          options: updatedPoll.options,
          responses: updatedPoll.responses || updatedClassData.polls[pollIndex].responses,
          respondents: updatedPoll.respondents || updatedClassData.polls[pollIndex].respondents
        };
        
        // Update state with the new data
        setClassData(updatedClassData);
        
        // Update active poll if needed
        if (activePoll && activePoll.id === updatedPoll.id) {
          setActivePoll({
            ...activePoll,
            options: updatedPoll.options,
            responses: updatedPoll.responses || activePoll.responses,
            respondents: updatedPoll.respondents || activePoll.respondents
          });
        }
        
        console.log('Updated poll data in UI without refresh');
      }

      // Reset the socketUpdate after processing
      setSocketUpdate(null);
    } catch (error) {
      console.error('Error processing socket update:', error);
    }
  }, [socketUpdate, classData, activePoll]);

  // Update effect to refresh data when classData changes for real-time poll updates
  useEffect(() => {
    if (!classData || !classData.polls || !user) return;
    
    // Find the active poll if any
    const activePolls = classData.polls.filter(poll => poll.isActive);
    if (activePolls.length > 0) {
      // Process active poll to check if the current user has responded
      const activePoll = activePolls[0];
      
      // Check if current user is in respondents list
      const hasResponded = activePoll.respondents?.some(respondent => respondent && respondent.id === user.id);
      
      // Set userResponse property based on user's response
      const userResponseData = hasResponded ? 
        activePoll.responses?.find(r => r && r.studentId === user.id)?.optionIndex : null;
      
      setActivePoll({
        ...activePoll,
        userResponse: userResponseData
      });
    } else {
      setActivePoll(null);
    }
  }, [classData, user]);

  const fetchClassDetails = async () => {
    if (!id) {
      setError('Class ID is missing');
      setLoading(false);
      return;
    }
    
    try {
      const response = await api.get(`/classes/${id}`);
      setClassData(response.data);
      
      // For students, verify they're still enrolled in the class
      if (user && user.role === 'student') {
        const isEnrolled = response.data.students.some(student => student && student.id === user.id);
        if (!isEnrolled) {
          setError('You are no longer enrolled in this class.');
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
          return;
        }
      }
      
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 403) {
        // No access or removed from class
        setError('You do not have access to this class.');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
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
    if (!pollId || option === undefined || option === null) {
      setError("Invalid poll or option");
      return;
    }
    
    try {
      const isChangingResponse = activePoll?.userResponse !== null && activePoll?.userResponse !== undefined;
      
      // Update local state right away for immediate feedback
      if (activePoll && activePoll.id === pollId) {
        setActivePoll({
          ...activePoll,
          userResponse: option
        });
      }
      
      // Submit response to server
      await api.post(`/polls/${pollId}/respond`, {
        optionIndex: option
      });
      
      console.log(isChangingResponse ? 'Response updated successfully' : 'Response submitted successfully');
      
      // Fetch updated poll data directly
      try {
        const updatedPollResponse = await api.get(`/polls/${pollId}`);
        console.log('Updated poll data:', updatedPollResponse.data);
        
        // Update the class data with the new poll information
        if (classData && classData.polls) {
          const updatedPolls = classData.polls.map(p => 
            p && p.id === pollId ? updatedPollResponse.data : p
          );
          
          setClassData({
            ...classData,
            polls: updatedPolls
          });
          
          // Also update active poll if needed
          if (activePoll && activePoll.id === pollId) {
            setActivePoll({
              ...updatedPollResponse.data,
              userResponse: option
            });
          }
        }
      } catch (pollError) {
        console.error('Failed to fetch updated poll data:', pollError);
      }
      
      // Refresh full class data
      fetchClassDetails();
    } catch (err) {
      console.error('Submit response error:', err);
      setError(err.response?.data?.message || 'Failed to submit response');
      
      // Revert the local state change if there was an error
      if (activePoll && activePoll.id === pollId) {
        setActivePoll({
          ...activePoll,
          userResponse: activePoll.userResponse // restore original value
        });
      }
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

  // Convert poll data to format for chart (Doughnut chart)
  const getPollChartData = (poll) => {
    if (!poll || !poll.options) return { labels: [], datasets: [] };
    
    // Extract option names and response counts
    const labels = poll.options.map((option, index) => 
      typeof option === 'string' ? option : option?.text || `Option ${index + 1}`
    );
    
    const data = poll.options.map((option, index) => 
      poll.responses?.filter(r => r && r.optionIndex === index).length || 0
    );
    
    // Return in Chart.js format
    return {
      labels,
      datasets: [{
        data,
        backgroundColor: COLORS,
        borderWidth: 1,
        hoverOffset: 4
      }]
    };
  };

  // Convert poll data for SimpleBarChart format
  const getBarChartData = (poll) => {
    if (!poll || !poll.options) return [];
    
    // Count responses for each option
    const responseCounts = poll.options.map((option, index) => {
      const count = poll.responses?.filter(r => r && r.optionIndex === index).length || 0;
      // Handle different option structures
      const optionText = typeof option === 'string' ? option : option?.text || `Option ${index + 1}`;
      
      return {
        name: optionText,
        value: count,
        optionIndex: index
      };
    });
    
    // Filter out options with zero responses for a cleaner chart
    return responseCounts.filter(item => item.value > 0);
  };

  const handleRemoveStudent = async (studentId, studentName) => {
    setStudentToRemove({ id: studentId, name: studentName });
    setConfirmDialogOpen(true);
  };

  const confirmRemoveStudent = async () => {
    try {
      await api.delete(`/classes/${id}/students/${studentToRemove.id}`);
      setConfirmDialogOpen(false);
      setStudentToRemove(null);
      fetchClassDetails();
      setError('');
    } catch (err) {
      console.error('Failed to remove student:', err);
      setError('Failed to remove student');
    }
  };

  const regenerateClassCode = async () => {
    try {
      setRegeneratingCode(true);
      await api.post(`/classes/${id}/regenerate-code`);
      fetchClassDetails();
      setRegeneratingCode(false);
      setError('');
    } catch (err) {
      console.error('Failed to regenerate class code:', err);
      setError('Failed to regenerate class code');
      setRegeneratingCode(false);
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
          
          {/* Display join code for teachers with regenerate button */}
          {isTeacher && classData.code && (
            <Paper sx={{ mt: 2, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 400 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Class Join Code
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                  {classData.code}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <Tooltip title={codeCopied ? "Copied!" : "Copy code"}>
                  <IconButton onClick={() => copyClassCode(classData.code)}>
                    <ContentCopyIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Regenerate code">
                  <IconButton 
                    onClick={regenerateClassCode} 
                    disabled={regeneratingCode}
                    color="primary"
                  >
                    {regeneratingCode ? <CircularProgress size={24} /> : <RefreshIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
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
                  {classData.polls?.map((poll) => poll && (
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
                            {poll.options?.map((option, index) => {
                              // Calculate response count for this option
                              const responseCount = poll.responses?.filter(r => r && r.optionIndex === index).length || 0;
                              // Get total responses
                              const totalResponses = poll.responses?.length || 0;
                              // Calculate percentage (avoid division by zero)
                              const percentage = totalResponses > 0 
                                ? (responseCount / totalResponses * 100).toFixed(0) 
                                : 0;
                              
                              return (
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
                                        {typeof option === 'string' ? option : option?.text || `Option ${index + 1}`}
                                      </Typography>
                                      <Typography>
                                        {responseCount} ({percentage}%)
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
                                        width: `${percentage}%`
                                      }}
                                    />
                                  </Button>
                                </Grid>
                              );
                            })}
                          </Grid>

                          {poll.responses?.length > 0 && (
                            <Box sx={{ mt: 3, height: 300 }}>
                              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Response Distribution
                              </Typography>
                              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <Doughnut 
                                  data={getPollChartData(poll)}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        position: 'right',
                                        labels: {
                                          padding: 20,
                                          boxWidth: 12,
                                          font: {
                                            size: 12
                                          }
                                        }
                                      },
                                      tooltip: {
                                        callbacks: {
                                          label: (context) => {
                                            const label = context.label || '';
                                            const value = context.raw || 0;
                                            const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                            const percentage = Math.round((value / total) * 100);
                                            return `${label}: ${value} (${percentage}%)`;
                                          }
                                        }
                                      }
                                    },
                                    cutout: '60%'
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                                Total Responses: {poll.responses?.length || 0}
                              </Typography>
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
                  {classData.students?.map((student) => student && (
                    <React.Fragment key={student.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton 
                            edge="end" 
                            aria-label="delete" 
                            onClick={() => handleRemoveStudent(student.id, student.name)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
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
                    <Chip 
                      size="small" 
                      color="success" 
                      label="Active" 
                      sx={{ ml: 2 }}
                    />
                  </Box>
                  
                  <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>
                    {activePoll.question}
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {activePoll.options?.map((option, index) => {
                      const hasVoted = activePoll.userResponse !== null && activePoll.userResponse !== undefined;
                      const isSelected = activePoll.userResponse === index;
                      // Handle different option structures
                      const optionText = typeof option === 'string' ? option : option?.text || `Option ${index + 1}`;
                      
                      return (
                        <Grid item xs={12} sm={6} key={index}>
                          <Button
                            fullWidth
                            variant={isSelected ? "contained" : "outlined"}
                            color={isSelected ? "primary" : "inherit"}
                            onClick={() => handleSubmitResponse(activePoll.id, index)}
                            sx={{ 
                              py: 2,
                              mb: 1,
                              fontSize: '1rem',
                              position: 'relative',
                              backgroundColor: isSelected ? '#1a237e' : 'transparent',
                              '&:hover': {
                                backgroundColor: isSelected ? '#0d47a1' : 'rgba(26, 35, 126, 0.1)',
                              }
                            }}
                          >
                            {optionText}
                            {isSelected && (
                              <CheckCircleIcon 
                                sx={{ 
                                  position: 'absolute', 
                                  right: 10, 
                                  top: '50%', 
                                  transform: 'translateY(-50%)',
                                  color: '#fff'
                                }} 
                              />
                            )}
                          </Button>
                        </Grid>
                      );
                    })}
                  </Grid>
                  
                  {activePoll.userResponse !== null && activePoll.userResponse !== undefined ? (
                    <Alert severity="success" sx={{ mt: 3 }}>
                      Your response has been recorded! You can change your answer by selecting a different option.
                    </Alert>
                  ) : (
                    <Alert severity="info" sx={{ mt: 3 }}>
                      Please select an answer to respond to this poll.
                    </Alert>
                  )}
                </CardContent>
              </StyledCard>
            ) : (
              <Alert severity="info" sx={{ mb: 4 }}>
                There are no active polls at the moment.
              </Alert>
            )}
            
            {/* Poll Results - The Virtual Bar */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <BarChartIcon sx={{ mr: 1 }} />
                Virtual Bar
              </Typography>
              
              {classData.polls && classData.polls.length > 0 ? (
                <Grid container spacing={3}>
                  {classData.polls.filter(poll => poll && poll.responses && poll.responses.length > 0).map(poll => (
                    <Grid item xs={12} md={6} key={poll.id}>
                      <StyledCard>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            {poll.question}
                          </Typography>
                          
                          <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Doughnut 
                              data={getPollChartData(poll)}
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'right',
                                    labels: {
                                      padding: 20,
                                      boxWidth: 12,
                                      font: {
                                        size: 12
                                      }
                                    }
                                  },
                                  tooltip: {
                                    callbacks: {
                                      label: (context) => {
                                        const label = context.label || '';
                                        const value = context.raw || 0;
                                        const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                        const percentage = Math.round((value / total) * 100);
                                        return `${label}: ${value} (${percentage}%)`;
                                      }
                                    }
                                  }
                                },
                                cutout: '60%'
                              }}
                            />
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

        {/* Confirmation dialog for student removal */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
        >
          <DialogTitle>Remove Student</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to remove {studentToRemove?.name} from this class?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmRemoveStudent} color="error" variant="contained">
              Remove
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ClassDetail; 