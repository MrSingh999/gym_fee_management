/**
 * Helper to get the start of today and 7 days from now
 * @returns { { today: Date, sevenDaysFromNow: Date } }
 */
export const getDateRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysFromNow = new Date(today);
  sevenDaysFromNow.setDate(today.getDate() + 7);

  return { today, sevenDaysFromNow };
};

/**
 * Helper to calculate the difference in days from today to a given date string/object
 * @param {Date|string} dateStr 
 * @returns {number}
 */
export const getDaysDiff = (dateStr) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const end = new Date(dateStr);
  end.setHours(0, 0, 0, 0);
  
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
