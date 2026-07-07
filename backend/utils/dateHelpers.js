export const getDateRange = () => {
  const now = new Date();
  
  // IST is UTC + 5:30 (5.5 * 60 * 60 * 1000 = 19,800,000 ms)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  // Set to start of today in IST
  istTime.setUTCHours(0, 0, 0, 0);
  
  // Convert back to UTC Date for DB queries
  const todayIST = new Date(istTime.getTime() - istOffset);
  
  // Calculate 7 days from today in IST, set to the very end of that day (23:59:59.999 IST)
  const sevenDaysFromNowIST = new Date(todayIST.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  
  return { today: todayIST, sevenDaysFromNow: sevenDaysFromNowIST };
};

export const getDaysDiff = (dateStr) => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  
  // Start of today in IST
  const todayIST = new Date(now.getTime() + istOffset);
  todayIST.setUTCHours(0, 0, 0, 0);
  
  // Target date in IST
  const endDate = new Date(new Date(dateStr).getTime() + istOffset);
  endDate.setUTCHours(0, 0, 0, 0);
  
  const diffTime = endDate - todayIST;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

