const parseUTCToPH = (utcString) => {
  if (!utcString) return null;
  const date = new Date(utcString + "Z");  
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
};

export const formatAppointmentDateTime = (scheduledDate, endDate) => {
  if (!scheduledDate) return { date: "N/A", timeRange: "N/A" };

  const startDate = parseUTCToPH(scheduledDate);
  const actualEndDate = endDate ? parseUTCToPH(endDate) : null;

  const formattedDate = startDate.toLocaleDateString("en-US", {
    timeZone: "Asia/Manila",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const startTime = startDate.toLocaleTimeString("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  if (!actualEndDate) return { date: formattedDate, timeRange: startTime };

  const endTime = actualEndDate.toLocaleTimeString("en-US", {
    timeZone: "Asia/Manila",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { date: formattedDate, timeRange: `${startTime} - ${endTime}` };
};
