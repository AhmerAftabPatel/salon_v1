import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { appointmentSchema } from '@/lib/validations';
import { sendCustomerConfirmation, sendAdminNotification } from '@/lib/email';
import { zonedTimeToUtc } from 'date-fns-tz';

// Central Timezone
const CENTRAL_TIMEZONE = 'America/Chicago';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const validatedData = appointmentSchema.parse(body);
    
    // Check if the requested time slot is still available
    const requestedDate = new Date(validatedData.date);
    const requestedTime = validatedData.time;
    
    console.log('POST: Requested date:', requestedDate);
    console.log('POST: Requested time:', requestedTime);
    
    // Check if the requested date is in the past
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (requestedDate < today) {
      console.log('POST: Date is in the past');
      return NextResponse.json(
        { error: 'Cannot book appointments for past dates.' },
        { status: 400 }
      );
    }
    
    // If it's today, check if the requested time has passed
    if (requestedDate.getTime() === today.getTime()) {
      const [hours, minutes] = requestedTime.split(':').map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      console.log('POST: Checking if time has passed. Requested:', hours + ':' + minutes, 'Current:', currentHour + ':' + currentMinute);
      
      if (hours < currentHour || (hours === currentHour && minutes <= currentMinute)) {
        console.log('POST: Time has passed');
        return NextResponse.json(
          { error: 'Cannot book appointments for past time slots.' },
          { status: 400 }
        );
      }
    }
    
    // Check if the time slot is already booked
    const existingAppointment = await Appointment.findOne({
      date: requestedDate,
      time: requestedTime,
      status: { $nin: ['cancelled'] }
    });
    
    if (existingAppointment) {
      console.log('POST: Time slot already booked');
      return NextResponse.json(
        { error: 'This time slot is already booked. Please select another time.' },
        { status: 400 }
      );
    }
    
    // Create the appointment
    const appointment = new Appointment(validatedData);
    await appointment.save();
    
    // Send confirmation emails
    try {
      await sendCustomerConfirmation(appointment);
      await sendAdminNotification(appointment);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the appointment creation if emails fail
    }
    
    return NextResponse.json(
      { 
        message: 'Appointment booked successfully!',
        appointment 
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const availableSlots = searchParams.get('availableSlots');
    
    const query: Record<string, unknown> = {};
    
    if (status) {
      query.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }
    
    if (availableSlots === 'true' && date) {
      // Get all booked time slots for a specific date
      console.log('API: Processing availableSlots request for date:', date);
      console.log('API: Date type:', typeof date);
      
      // Parse the date string and convert to Central timezone
      // The date string is in format "YYYY-MM-DD" and represents a date in Central time
      const [year, month, day] = date.split('-').map(Number);
      const centralDate = new Date(year, month - 1, day); // month is 0-indexed
      
      // Convert to UTC for MongoDB query
      const startOfDayUTC = zonedTimeToUtc(centralDate, CENTRAL_TIMEZONE);
      const endOfDayUTC = zonedTimeToUtc(new Date(year, month - 1, day, 23, 59, 59, 999), CENTRAL_TIMEZONE);
      
      console.log('API: Central date:', centralDate);
      console.log('API: Start of day UTC:', startOfDayUTC);
      console.log('API: End of day UTC:', endOfDayUTC);
      
      const bookedSlots = await Appointment.find({
        date: { $gte: startOfDayUTC, $lte: endOfDayUTC },
        status: { $nin: ['cancelled'] }
      }).select('time status');
      
      console.log('API: Found booked slots:', bookedSlots);
      
      return NextResponse.json({ 
        bookedSlots: bookedSlots.map(slot => ({
          time: slot.time,
          status: slot.status
        }))
      });
    }
    
    const appointments = await Appointment.find(query)
      .sort({ date: 1, time: 1 })
      .exec();
    
    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
} 