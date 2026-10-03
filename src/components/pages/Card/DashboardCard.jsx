import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { alpha } from '@mui/material/styles';

/**
 * Reusable stat card.
 * Old usage still works: <DashboardCard title="Appointments" data={12} />
 *
 * Optional props:
 *  - subtitle: small text under the number
 *  - icon: any MUI icon element, e.g. <EventAvailableOutlinedIcon />
 *  - color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
 *  - loading: shows a skeleton instead of the number
 */
function DashboardCard({
  title,
  data,
  subtitle,
  icon,
  color = 'primary',
  loading = false,
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        minWidth: 0,
        height: '100%',
        borderRadius: 3,
        borderColor: 'divider',
      }}
    >
      <CardContent
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
          p: 2.5,
          '&:last-child': { pb: 2.5 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>

          {loading ? (
            <Skeleton width={64} height={48} />
          ) : (
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1.2 }}>
              {data ?? 0}
            </Typography>
          )}

          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        {icon && (
          <Box
            sx={{
              flexShrink: 0,
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              color: `${color}.main`,
              bgcolor: (theme) => alpha(theme.palette[color].main, 0.12),
            }}
          >
            {icon}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default DashboardCard;