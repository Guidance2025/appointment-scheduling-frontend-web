import React, { useCallback, useEffect, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import AddIcon from '@mui/icons-material/Add';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import SentimentSatisfiedAltOutlinedIcon from '@mui/icons-material/SentimentSatisfiedAltOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';

import DashboardCard from './Card/DashboardCard';
import CreatePostModal from './modal/CreatePostModal';
import PostCard from './PostCard';
import EventCard from './Card/EventCard';
import ConfirmDialog from '../../helper/ConfirmDialog';
import '../../css/ConfirmDialog.css';
import useFetch from '../../hooks/useFetch';
import { normalizePost, normalizeCategory } from '../../utils/normalize';
import {
  API_BASE_URL,
  MOODS_URL,
  GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF,
} from '../../../constants/api';
import {
  fetchLatestPosts,
  fetchQuoteOfTheDay,
  fetchCategories,
  createPost,
  deletePost,
} from '../../service/post';

const theme = createTheme({
  palette: {
    primary: { main: '#2F8A63', dark: '#256B4B', light: '#5FB48C' },
    secondary: { main: '#7BA85A' },
    success: { main: '#5FB48C' },
    warning: { main: '#D9962B' },
    error: { main: '#C25B66' },
    info: { main: '#3A9A9A' },
    background: { default: '#F3F9F6', paper: '#FFFFFF' },
    text: { primary: '#1A2B23', secondary: '#5A6B62' },
    divider: '#DCEBE2',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Figtree", "Segoe UI", system-ui, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
});


const getCategory = (p) => (p.category_name || p.CATEGORY_NAME || '').toLowerCase();

const authFetch = (url, token) =>
  fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

const countAnswered = (items) =>
  Array.isArray(items)
    ? items.filter((i) => i.responseText && i.responseText.trim() !== '').length
    : 0;

const POSITIVE = ['happy', 'excited', 'hopeful', 'calm'];
const NEGATIVE = ['angry', 'frustrated', 'worried', 'sad'];

const EMPTY_NEW_POST = {
  category_name: '',
  post_content: '',
  section_id: null,
  section_code: '',
};


const PostList = ({
  posts,
  emptyIcon,
  emptyTitle,
  emptyHint,
  onDelete,
  isGuidanceStaff,
  CardComponent = PostCard,
}) => {
  if (!posts.length) {
    return (
      <Stack alignItems="center" spacing={1} sx={{ py: 8, color: 'text.secondary', textAlign: 'center' }}>
        {emptyIcon}
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {emptyTitle}
        </Typography>
        <Typography variant="body2">{emptyHint}</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      {posts.map((post) => (
        <CardComponent
          key={post.post_id}
          post={post}
          onDelete={onDelete}
          isGuidanceStaff={isGuidanceStaff}
        />
      ))}
    </Stack>
  );
};

const MoodRow = ({ label, percent, color }) => (
  <Stack direction="row" alignItems="center" spacing={1.5}>
    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
    <Typography variant="body2" sx={{ flex: 1 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 700 }}>
      {percent}%
    </Typography>
  </Stack>
);

const Dashboard = () => {
  const guidanceStaffId = localStorage.getItem('guidanceStaffId');
  const {
    data: appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
  } = useFetch(GET_ALL_APPOINTMENT_BY_GUIDANCESTAFF(guidanceStaffId));

  const [posts, setPosts] = useState([]);
  const [quoteOfTheDay, setQuoteOfTheDay] = useState(null);
  const [categories, setCategories] = useState([]);
  const [sections, setSections] = useState([]);
  const [newPost, setNewPost] = useState(EMPTY_NEW_POST);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isGuidanceStaff, setIsGuidanceStaff] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const [selfAssessmentCount, setSelfAssessmentCount] = useState(0);
  const [exitInterviewCount, setExitInterviewCount] = useState(0);
  const [moodTrendCount, setMoodTrendCount] = useState(0);
  const [moodDistribution, setMoodDistribution] = useState({ happy: 0, neutral: 0, sad: 0 });

  const loadPosts = useCallback(async () => {
    const data = await fetchLatestPosts();
    setPosts((data || []).map(normalizePost));
  }, []);

  const loadQuote = useCallback(async () => {
    const q = await fetchQuoteOfTheDay();
    setQuoteOfTheDay(
      q && Object.keys(q).length
        ? {
            post_content: q.post_content || q.POST_CONTENT,
            posted_date: q.posted_date || q.POSTED_DATE,
            section_name: q.section_name || q.SECTION_NAME,
            organization: q.organization || q.ORGANIZATION,
          }
        : null
    );
  }, []);

  const loadCategories = useCallback(async () => {
    const data = await fetchCategories();
    const normalized = (data || []).map(normalizeCategory);
    const unique = [];
    const seen = new Set();
    for (const cat of normalized) {
      if (!seen.has(cat.category_name)) {
        seen.add(cat.category_name);
        unique.push(cat);
      }
    }
    setCategories(unique);
  }, []);

  const loadSections = useCallback(async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      const res = await fetch(`${API_BASE_URL}/api/sections`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        console.warn('Failed to load sections, status:', res.status);
        setSections([]);
        return;
      }
      const data = await res.json();
      setSections(
        (data || []).map((s) => ({
          id: s.section_id || s.id,
          code: s.section_code || s.code,
          name: s.section_name || s.name,
        }))
      );
    } catch (e) {
      console.error('Load sections failed:', e);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    try {
      const [selfRes, exitRes, moodRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/self-assessment/student-response`, token),
        authFetch(`${API_BASE_URL}/exit-interview/student-response`, token),
        authFetch(MOODS_URL, token),
      ]);

      if (selfRes.ok) setSelfAssessmentCount(countAnswered(await selfRes.json()));
      if (exitRes.ok) setExitInterviewCount(countAnswered(await exitRes.json()));

      if (moodRes.ok) {
        const moodData = await moodRes.json();
        const entries = Array.isArray(moodData) ? moodData : [];
        setMoodTrendCount(entries.length);

        let happy = 0;
        let neutral = 0;
        let sad = 0;
        entries.forEach((entry) => {
          const emotions = entry.emotions || [];
          const hasPositive = emotions.some((e) => POSITIVE.includes(e));
          const hasNegative = emotions.some((e) => NEGATIVE.includes(e));
          if (hasPositive && !hasNegative) happy++;
          else if (hasNegative && !hasPositive) sad++;
          else neutral++;
        });

        const total = entries.length || 1;
        setMoodDistribution({
          happy: Math.round((happy / total) * 100),
          neutral: Math.round((neutral / total) * 100),
          sad: Math.round((sad / total) * 100),
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }, []);

  const checkUserRole = useCallback(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const role = (user.role || '').toLowerCase();
      setIsGuidanceStaff(role === 'guidance_staff' || role === 'admin');
    } catch (e) {
      console.error('Check user role failed:', e);
      setIsGuidanceStaff(true);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        checkUserRole();
        await Promise.all([
          loadPosts(),
          loadQuote(),
          loadCategories(),
          loadSections(),
          loadAnalytics(),
        ]);
      } catch (e) {
        console.error('Init failed:', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [checkUserRole, loadPosts, loadQuote, loadCategories, loadSections, loadAnalytics]);

  
  const openCreateModal = () => {
    setNewPost(EMPTY_NEW_POST);
    setIsModalOpen(true);
  };

  const handleDeletePost = (postId) => {
    setPostToDelete(postId);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await deletePost(postToDelete);
      setPosts((prev) => prev.filter((p) => p.post_id !== postToDelete));
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setPostToDelete(null);
      setIsConfirmOpen(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (creating) return;

    const postContent = (newPost.post_content || '').trim();
    if (!newPost.category_name || !postContent) {
      console.error('Category and content are required.');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }

      await createPost({
        categoryName: newPost.category_name.trim(),
        sectionName: newPost.section_id,
        postContent,
      });

      await Promise.all([loadPosts(), loadQuote()]);
      setNewPost(EMPTY_NEW_POST);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Create error:', err);
    } finally {
      setCreating(false);
    }
  };

  const announcements = posts.filter((p) => getCategory(p) === 'announcement');
  const events = posts.filter((p) => getCategory(p) === 'events');
  const appointmentCount = Array.isArray(appointments) ? appointments.length : 0;
  const hasMoodData = moodTrendCount > 0;

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'background.default',
          py: { xs: 2, md: 4 },
          px: { xs: 2, md: 4 },
        }}
      >
        <Box
          sx={{
            maxWidth: 1280,
            mx: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={90}
          >
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Welcome
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isGuidanceStaff ? 'Manage guidance posts and student activity' : 'Updates from the guidance office'}
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreateModal}
              disabled={loading || creating}
              sx={{  borderRadius: 12 , px:4 , py: 1.5, fontSize: '0.9rem' }}
            >
              Create post
            </Button>
          </Stack>

          {loading && <LinearProgress sx={{ borderRadius: 1 }} />}

          {appointmentsError && (
            <Alert severity="warning" variant="outlined">
              Couldn&apos;t load appointments. Refresh the page to try again.
            </Alert>
          )}

          {quoteOfTheDay && (
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'primary.secondary',
                color: 'primary.main',
                borderRadius: 4,
                px: { xs: 3, md: 5 },
                py: { xs: 3, md: 4 },
                border: '1px solid',
                shadow: '0 2px 10px rgba(0,0,0,0.04)',
              }}
            >
              <Typography variant="body2" sx={{ color: 'rgba(5, 5, 5, 0.88)', fontWeight: 600, mb: 1 }}>
                Quote of the day
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 500, lineHeight: 1.45, maxWidth: 820, overflowWrap: 'break-word' , }}
              >
                {quoteOfTheDay.post_content}
              </Typography> 
              {quoteOfTheDay.section_name && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.88)', mt: 2 }}>
                  {quoteOfTheDay.section_name}
                </Typography>
              )}
            </Paper>
          )}

          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))',
              },
            }}
          >
            <DashboardCard
              title="Appointments"
              data={appointmentCount}
              subtitle="Assigned to you"
              icon={<EventAvailableOutlinedIcon />}
              color="primary"
              loading={appointmentsLoading}
            />
            <DashboardCard
              title="Self-assessment"
              data={selfAssessmentCount}
              subtitle="Total responses"
              icon={<AssignmentOutlinedIcon />}
              color="info"
              loading={loading}
            />
            <DashboardCard
              title="Exit interviews"
              data={exitInterviewCount}
              subtitle="Completed interviews"
              icon={<MeetingRoomOutlinedIcon />}
              color="warning"
              loading={loading}
            />
            <DashboardCard
              title="Mood entries"
              data={moodTrendCount}
              subtitle="Student submissions"
              icon={<SentimentSatisfiedAltOutlinedIcon />}
              color="secondary"
              loading={loading}
            />
          </Box>

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              alignItems: 'start',
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 340px' },
            }}
          >
            {/* Posts */}
            <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: 'divider', overflow: 'hidden' }}>
              <Tabs
                value={activeTab}
                onChange={(_, value) => setActiveTab(value)}
                sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>Announcements</span>
                      <Chip size="small" label={announcements.length} />
                    </Stack>
                  }
                />
                <Tab
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <span>Events</span>
                      <Chip size="small" label={events.length} />
                    </Stack>
                  }
                />
              </Tabs>

              <Box sx={{ p: { xs: 2, md: 3 } }}>
                {activeTab === 0 && (
                  <PostList
                    posts={announcements}
                    emptyIcon={<CampaignOutlinedIcon sx={{ fontSize: 44 }} />}
                    emptyTitle="No announcements yet"
                    emptyHint='Use "Create post" to share one with students.'
                    onDelete={handleDeletePost}
                    isGuidanceStaff={isGuidanceStaff}
                  />
                )}
                {activeTab === 1 && (
                  <PostList
                    posts={events}
                    emptyIcon={<EventOutlinedIcon sx={{ fontSize: 44 }} />}
                    emptyTitle="No events yet"
                    emptyHint='Use "Create post" to add an upcoming event.'
                    onDelete={handleDeletePost}
                    isGuidanceStaff={isGuidanceStaff}
                    CardComponent={EventCard}
                  />
                )}
              </Box>
            </Paper>

            <Paper
              variant="outlined"
              sx={{ borderRadius: 3, borderColor: 'divider', p: 3, position: { lg: 'sticky' }, top: { lg: 24 } }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Mood distribution
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                {hasMoodData
                  ? `Based on ${moodTrendCount} student ${moodTrendCount === 1 ? 'entry' : 'entries'}`
                  : 'No mood entries yet'}
              </Typography>

              <Box
                sx={{
                  display: 'flex',
                  height: 14,
                  borderRadius: 7,
                  overflow: 'hidden',
                  bgcolor: 'divider',
                  mb: 3,
                }}
              >
                {hasMoodData && (
                  <>
                    <Box sx={{ width: `${moodDistribution.happy}%`, bgcolor: 'success.main' }} />
                    <Box sx={{ width: `${moodDistribution.neutral}%`, bgcolor: 'warning.main' }} />
                    <Box sx={{ width: `${moodDistribution.sad}%`, bgcolor: 'error.main' }} />
                  </>
                )}
              </Box>

              <Stack spacing={1.5}>
                <MoodRow label="Happy" percent={moodDistribution.happy} color="success.main" />
                <MoodRow label="Neutral" percent={moodDistribution.neutral} color="warning.main" />
                <MoodRow label="Sad" percent={moodDistribution.sad} color="error.main" />
              </Stack>
            </Paper>
          </Box>
        </Box>

        <CreatePostModal
          newPost={newPost}
          setNewPost={setNewPost}
          categories={categories}
          sections={sections}
          creating={creating}
          handleCreate={handleCreate}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />

        <ConfirmDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="warning"
        />
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;