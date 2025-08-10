import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { appointmentSchema } from '@/lib/validations';
import { sendCustomerConfirmation, sendAdminNotification } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    
    // Validate the request body
    const validatedData = appointmentSchema.parse(body);
    
    // Check if the time slot is available
    const existingAppointment = await Appointment.findOne({
      date: validatedData.date,
      time: validatedData.time,
      status: { $nin: ['cancelled'] }
    });
    
    if (existingAppointment) {
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
  } catch (error: any) {
    if (error.name === 'ZodError') {
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
    
    let query: any = {};
    
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
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const bookedSlots = await Appointment.find({
        date: { $gte: startOfDay, $lte: endOfDay },
        status: { $nin: ['cancelled'] }
      }).select('time status');
      
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