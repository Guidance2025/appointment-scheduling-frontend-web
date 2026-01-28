export const triggerMoodTrendReload = () => {
  console.log("[MoodTrendHelper] Triggering mood trend reload...");
  
  if (typeof window.triggerMoodTrendReload === 'function') {
    window.triggerMoodTrendReload();
  } else {
    console.warn("[MoodTrendHelper] MoodTrend component not found or not loaded yet");
  }
  
  const event = new Event('moodEntrySubmitted');
  window.dispatchEvent(event);
};


export const dispatchMoodEntryEvent = () => {
  console.log("[MoodTrendHelper] Dispatching moodEntrySubmitted event...");
  const event = new Event('moodEntrySubmitted');
  window.dispatchEvent(event);
};
