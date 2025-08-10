import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { appointmentUpdateSchema } from '@/lib/validations';
import { sendStatusUpdate } from '@/lib/email';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    
    const { id } = await params;
    const body = await request.json();
    
    // Validate the request body
    const validatedData = appointmentUpdateSchema.parse(body);
    
    // Get the original appointment to check if status changed
    const originalAppointment = await Appointment.findById(id);
    if (!originalAppointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    const statusChanged = originalAppointment.status !== validatedData.status;
    
    // Update the appointment
    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { ...validatedData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    // Send status update email if status changed
    if (statusChanged) {
      try {
        await sendStatusUpdate(appointment);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the update if email fails
      }
    }
    
    return NextResponse.json({ 
      message: 'Appointment updated successfully',
      appointment 
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const appointment = await Appointment.findByIdAndDelete(params.id);
    
    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Appointment deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { error: 'Failed to delete appointment' },
      { status: 500 }
    );
  }
} 