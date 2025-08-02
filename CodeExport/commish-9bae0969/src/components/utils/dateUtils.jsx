
import { isValid, parseISO } from 'date-fns';

/**
 * Safely parses a date string or Date object, handling timezone issues.
 * Returns a valid Date object or null if the input is invalid.
 * @param {string | Date | null | undefined} dateInput - The date string or object to parse.
 * @returns {Date | null} A valid Date object or null.
 */
export const toValidDate = (dateInput) => {
  if (!dateInput) {
    return null;
  }

  // If it's already a Date object, check its validity
  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : null;
  }
  
  // For date strings in YYYY-MM-DD format, parse them as local dates to avoid timezone issues
  if (typeof dateInput === 'string') {
    const dateStr = dateInput.trim();
    
    // Check if it's in YYYY-MM-DD format
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (isoDatePattern.test(dateStr)) {
      // Parse as local date to avoid UTC conversion issues
      const [year, month, day] = dateStr.split('-').map(num => parseInt(num, 10));
      const localDate = new Date(year, month - 1, day, 12, 0, 0); // Set to noon to avoid DST issues
      return isValid(localDate) ? localDate : null;
    }
    
    // For other formats, try parseISO first
    let date = parseISO(dateStr);
    if (isValid(date)) {
      return date;
    }

    // Fallback for other potential date string formats
    date = new Date(dateStr);
    return isValid(date) ? date : null;
  }

  return null;
};

/**
 * Get current financial year based on region
 * @param {string} region - User's region (australia, new_zealand, usa, uk, canada)
 * @returns {string} Current financial year in format YYYY-YY
 */
export const getCurrentFinancialYear = (region = 'australia') => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  switch (region) {
    case 'australia':
      // July 1st to June 30th
      return currentMonth >= 6 ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
    
    case 'new_zealand':
       // April 1st to March 31st
       return currentMonth >= 3 ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;

    case 'uk':
      // April 6th to April 5th
      return (currentMonth > 3 || (currentMonth === 3 && now.getDate() >= 6)) ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
    
    case 'canada':
      // January 1st to December 31st (same as calendar year)
      return `${currentYear}-${currentYear.toString().slice(-2)}`;
    
    case 'usa':
    default:
      // October 1st to September 30th (US Federal)
      return currentMonth >= 9 ? `${currentYear}-${(currentYear + 1).toString().slice(-2)}` : `${currentYear - 1}-${currentYear.toString().slice(-2)}`;
  }
};

/**
 * Derives the financial year for a given date based on region.
 * @param {string | Date} inputDate - The date to check.
 * @param {string} region - The user's region.
 * @returns {string | null} The financial year string or null if date is invalid.
 */
export const getFinancialYearForDate = (inputDate, region = 'australia') => {
  const date = toValidDate(inputDate);
  if (!date) return null;

  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const day = date.getDate();

  switch (region) {
    case 'australia':
      return month >= 6 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
    case 'new_zealand':
       return month >= 3 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
    case 'uk':
      return (month > 3 || (month === 3 && day >= 6)) ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
    case 'canada':
      return `${year}-${year.toString().slice(-2)}`;
    case 'usa':
    default:
      return month >= 9 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;
  }
};

/**
 * Generate financial year options based on region
 * @param {string} region - User's region (australia, new_zealand, usa, uk, canada)
 * @returns {string[]} Array of financial year options
 */
export const getFinancialYearOptions = (region = 'australia') => {
  const now = new Date();
  
  let startYearOfCurrentFY;
  
  // Determine the starting year of the CURRENT financial year based on region
  switch (region) {
    case 'australia': // Starts July 1
      startYearOfCurrentFY = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
      break;
    case 'new_zealand': // Starts April 1
      startYearOfCurrentFY = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      break;
    case 'uk': // Starts April 6
      startYearOfCurrentFY = (now.getMonth() > 3 || (now.getMonth() === 3 && now.getDate() >= 6)) ? now.getFullYear() : now.getFullYear() - 1;
      break;
    case 'usa': // Starts Oct 1
      startYearOfCurrentFY = now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1;
      break;
    case 'canada': // Starts Jan 1
      startYearOfCurrentFY = now.getFullYear();
      break;
    default: // Default to Australia
      startYearOfCurrentFY = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
      break;
  }

  const options = [];
  
  // Add current and past 5 financial years
  for (let i = 0; i < 6; i++) {
    const year = startYearOfCurrentFY - i;
    if (region === 'canada') {
      options.push(`${year}-${year.toString().slice(-2)}`);
    } else {
      options.push(`${year}-${(year + 1).toString().slice(-2)}`);
    }
  }
  
  return options;
};
