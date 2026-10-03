import React, { useState } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import { alpha } from '@mui/material/styles';

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const LONG_TEXT = 180;

const EventCard = ({ post, onDelete, isGuidanceStaff }) => {
  const [expanded, setExpanded] = useState(false);

  const content = post.post_content || post.POST_CONTENT || '';
  const sectionName = post.section_name || post.SECTION_NAME;
  const organization = post.organization || post.ORGANIZATION;
  const date = parseDate(post.posted_date || post.POSTED_DATE);

  const isLong = content.length > LONG_TEXT;

  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'flex',
        gap: 2,
        p: 2,
        borderRadius: 3,
        borderColor: 'divider',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': {
          borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
          boxShadow: (theme) => `0 2px 10px ${alpha(theme.palette.primary.main, 0.08)}`,
        },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 64,
          height: 72,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.main',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
        }}
      >
        {date ? (
          <>
            <Typography variant="caption" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {date.toLocaleString('en-US', { month: 'short' })}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {date.getDate()}
            </Typography>
          </>
        ) : (
          <EventOutlinedIcon />
        )}
      </Box>

      {/* Details */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
            <Chip size="small" color="primary" variant="outlined" label="Event" />
            {sectionName && <Chip size="small" label={sectionName} />}
          </Stack>

          {isGuidanceStaff && (
            <Tooltip title="Delete event">
              <IconButton
                size="small"
                aria-label="Delete event"
                onClick={() => onDelete(post.post_id)}
                sx={{ mt: -0.5, mr: -0.5, '&:hover': { color: 'error.main' } }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Typography
          variant="body1"
          sx={{
            mt: 1,
            whiteSpace: 'pre-line',
            wordBreak: 'break-word',
            ...(!expanded && {
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }),
          }}
        >
          {content}
        </Typography>

        {isLong && (
          <Button
            size="small"
            onClick={() => setExpanded((v) => !v)}
            sx={{ mt: 0.5, ml: -1, minWidth: 0 }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        )}

        {(date || organization) && (
          <Stack direction="row" spacing={2} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
            {date && (
              <Typography variant="caption" color="text.secondary">
                {date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            )}
            {organization && (
              <Typography variant="caption" color="text.secondary">
                {organization}
              </Typography>
            )}
          </Stack>
        )}
      </Box>
    </Paper>
  );
};

export default EventCard;