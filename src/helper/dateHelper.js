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
