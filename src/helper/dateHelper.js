export const formatAppointmentDateTime = (scheduledDate, endDate) => {
    if (!scheduledDate) return { date: "N/A", timeRange: "N/A" };
    
    const startDate = new Date(scheduledDate);
    const actualEndDate = endDate ? new Date(endDate) : null;
    
    const formattedDate = startDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    
    const startTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    
    if (!actualEndDate) {
      return { date: formattedDate, timeRange: startTime };
    }
    
    const endTime = actualEndDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    
    return { date: formattedDate, timeRange: `${startTime} - ${endTime}` };
  };

  export const formatDate = (dateString) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };


