import { format, addDays, startOfDay, isToday, isTomorrow, parseISO } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

// Central Timezone
export const CENTRAL_TIMEZONE = 'America/Chicago';

// Convert local time to Central time
export function toCentralTime(date: Date): Date {
  return utcToZonedTime(date, CENTRAL_TIMEZONE);
}

// Convert Central time to UTC
export function toUTC(date: Date): Date {
  return zonedTimeToUtc(date, CENTRAL_TIMEZONE);
}

// Get current Central time
export function getCurrentCentralTime(): Date {
  return utcToZonedTime(new Date(), CENTRAL_TIMEZONE);
}

// Format date for display in Central time
export function formatCentralTime(date: Date, formatString: string = 'yyyy-MM-dd'): string {
  const centralDate = toCentralTime(date);
  return format(centralDate, formatString);
}

// Check if a date is today in Central time
export function isTodayCentral(date: Date): boolean {
  const centralDate = toCentralTime(date);
  return isToday(centralDate);
}

// Check if a date is tomorrow in Central time
export function isTomorrowCentral(date: Date): boolean {
  const centralDate = toCentralTime(date);
  return isTomorrow(centralDate);
}

// Get minimum booking date (today in Central time)
export function getMinBookingDate(): Date {
  return getCurrentCentralTime();
}

// Get maximum booking date (30 days from today in Central time)
export function getMaxBookingDate(): Date {
  return addDays(getCurrentCentralTime(), 30);
}

// Format time for display
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}

// Get available time slots for a specific date
export function getAvailableTimeSlots(): string[] {
  return [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];
}

// Get available time slots for a specific date, filtering out past times for current day
export function getAvailableTimeSlotsForDate(date: Date): string[] {
  const allSlots = getAvailableTimeSlots();
  
  // If it's not today, return all slots
  if (!isTodayCentral(date)) {
    return allSlots;
  }
  
  // If it's today, filter out past times
  const now = getCurrentCentralTime();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  return allSlots.filter(slot => {
    const [slotHour, slotMinute] = slot.split(':').map(Number);
    
    // If slot hour is less than current hour, it's in the past
    if (slotHour < currentHour) return false;
    
    // If slot hour equals current hour, check minutes
    if (slotHour === currentHour && slotMinute <= currentMinute) return false;
    
    return true;
  });
} 