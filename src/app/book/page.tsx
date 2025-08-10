'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { appointmentSchema, type AppointmentFormData } from '@/lib/validations';
import { 
  getMinBookingDate, 
  getMaxBookingDate, 
  getAvailableTimeSlots,
  getAvailableTimeSlotsForDate,
  formatCentralTime,
  getCurrentCentralTime,
  isTodayCentral,
  CENTRAL_TIMEZONE 
} from '@/lib/timezone';
import { Calendar, Clock, User, Phone, Mail, ArrowLeft, MapPin, X } from 'lucide-react';
import Link from 'next/link';

// Type for booked slot data
interface BookedSlot {
  time: string;
  status: string;
}

// Success Modal Component
function SuccessModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-green-800 mb-2">Booking Confirmed! 🎉</h3>
          <p className="text-gray-600 mb-4">
            Your appointment has been successfully booked!
          </p>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-green-700">
              We will confirm your booking shortly.
            </p>
            <p className="text-sm text-green-700 mt-1">
              You will receive a confirmation email at the address you provided.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default function BookAppointment() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      date: getMinBookingDate(),
      time: '',
      notes: ''
    }
  });

  const watchedDate = watch('date');

  // Update current time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = getCurrentCentralTime();
      setCurrentTime(format(now, 'h:mm a'));
    };
    
    updateTime(); // Update immediately
    const interval = setInterval(updateTime, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  // Initialize available slots for the default date
  useEffect(() => {
    const defaultDate = getMinBookingDate();
    const dateStr = formatCentralTime(defaultDate, 'yyyy-MM-dd');
    setSelectedDate(dateStr);
    fetchAvailableSlots(dateStr);
  }, []);

  // Fetch available time slots when date changes
  useEffect(() => {
    if (watchedDate) {
      const dateStr = formatCentralTime(watchedDate, 'yyyy-MM-dd');
      setSelectedDate(dateStr);
      fetchAvailableSlots(dateStr);
    }
  }, [watchedDate]);

  const fetchAvailableSlots = async (date: string) => {
    try {
      const response = await fetch(`/api/appointments?availableSlots=true&date=${date}`);
      if (response.ok) {
        const data = await response.json();
        const dateObj = new Date(date);
        const allSlots = getAvailableTimeSlotsForDate(dateObj);
        const bookedSlots = data.bookedSlots || [];
        
        // Filter out confirmed and pending slots
        const unavailableSlots = bookedSlots
          .filter((slot: BookedSlot) => ['confirmed', 'pending'].includes(slot.status))
          .map((slot: BookedSlot) => slot.time);
        
        const available = allSlots.filter(slot => !unavailableSlots.includes(slot));
        setAvailableSlots(available);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      const dateObj = new Date(date);
      setAvailableSlots(getAvailableTimeSlotsForDate(dateObj));
    }
  };

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setShowSuccessModal(true);
        reset();
        const defaultDate = getMinBookingDate();
        const dateStr = formatCentralTime(defaultDate, 'yyyy-MM-dd');
        fetchAvailableSlots(dateStr);
      } else {
        setSubmitMessage({
          type: 'error',
          message: result.error || 'Failed to book appointment. Please try again.'
        });
      }
    } catch (error) {
      setSubmitMessage({
        type: 'error',
        message: 'An error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          {/* <Link 
            href="/" 
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link> */}
          <h1 className="text-3xl font-bold text-gray-900">Book Your Appointment</h1>
          <p className="mt-2 text-gray-600">Fill out the form below to schedule your salon appointment.</p>
          
          {/* Timezone Info */}
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-2" />
            All times are in Central Time ({CENTRAL_TIMEZONE})
          </div>
          
          {/* Current Time */}
          {currentTime && (
            <div className="mt-2 flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              Current Time: {currentTime} CT
            </div>
          )}
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6 md:p-8">
          {submitMessage && submitMessage.type === 'error' && (
            <div className="mb-6 p-4 rounded-md bg-red-50 text-red-800 border border-red-200">
              <p className="text-sm">{submitMessage.message}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline h-4 w-4 mr-2" />
                Full Name
              </label>
              <input
                type="text"
                id="name"
                {...register('name')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {/* Phone Number Field */}
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="inline h-4 w-4 mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                id="phoneNumber"
                {...register('phoneNumber')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your phone number"
              />
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="inline h-4 w-4 mr-2" />
                Email Address
              </label>
              <input
                type="email"
                id="email"
                {...register('email')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter your email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Date Field */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-2" />
                Preferred Date
              </label>
              <input
                type="date"
                id="date"
                {...register('date', { valueAsDate: true })}
                min={formatCentralTime(getMinBookingDate(), 'yyyy-MM-dd')}
                max={formatCentralTime(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Available dates: Today and Tomorrow only
              </p>
            </div>

            {/* Time Field */}
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline h-4 w-4 mr-2" />
                Preferred Time
              </label>
              <select
                id="time"
                {...register('time')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">Select a time slot</option>
                {availableSlots.map((time) => {
                  const [hours, minutes] = time.split(':');
                  const hour = parseInt(hours);
                  const ampm = hour >= 12 ? 'PM' : 'AM';
                  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                  const displayTime = `${displayHour}:${minutes} ${ampm}`;
                  
                  return (
                    <option key={time} value={time}>
                      {displayTime}
                    </option>
                  );
                })}
              </select>
              {errors.time && (
                <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
              )}
              {selectedDate && availableSlots.length === 0 && (
                <p className="mt-1 text-sm text-red-600">
                  {isTodayCentral(new Date(selectedDate)) 
                    ? 'No available time slots for today. All times have passed. Please select another date.'
                    : 'No available time slots for this date. Please select another date.'
                  }
                </p>
              )}
            </div>

            {/* Notes Field */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes (Optional)
              </label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="Any special requests or notes..."
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || availableSlots.length === 0}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Success Modal */}
      <SuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
      />
    </div>
  );
} 