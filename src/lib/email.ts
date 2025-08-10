import nodemailer from 'nodemailer';
import { formatTime } from './timezone';

// Type for appointment data used in emails
interface AppointmentEmailData {
  _id?: string;
  name: string;
  phoneNumber: string;
  email: string;
  date: Date | string;
  time: string;
  status: string;
  notes?: string;
}

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change this to other services
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Use app password for Gmail
  },
});

// Email templates
export const emailTemplates = {
  // New appointment confirmation to customer
  customerConfirmation: (appointment: AppointmentEmailData) => ({
    subject: 'Appointment Confirmation - Salon Elegance',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Appointment Confirmation</h2>
        <p>Dear ${appointment.name},</p>
        <p>Your appointment has been successfully booked with Salon Elegance!</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Appointment Details:</h3>
          <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${formatTime(appointment.time)}</p>
          <p><strong>Status:</strong> Pending Confirmation</p>
          ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
        </div>
        
        <p>We will review your appointment and send you a confirmation email shortly.</p>
        <p>If you need to make any changes, please contact us.</p>
        
        <p>Thank you for choosing Salon Elegance!</p>
        <p>Best regards,<br>Salon Elegance Team</p>
      </div>
    `
  }),

  // New appointment notification to admin
  adminNotification: (appointment: AppointmentEmailData) => ({
    subject: 'New Appointment Request - Salon Elegance',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">New Appointment Request</h2>
        <p>A new appointment has been requested:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Customer Details:</h3>
          <p><strong>Name:</strong> ${appointment.name}</p>
          <p><strong>Phone:</strong> ${appointment.phoneNumber}</p>
          <p><strong>Email:</strong> ${appointment.email}</p>
          <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${formatTime(appointment.time)}</p>
          ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
        </div>
        
        <p>Please review and confirm this appointment.</p>
        <p>Appointment ID: ${appointment._id}</p>
      </div>
    `
  }),

  // Status update to customer
  statusUpdate: (appointment: AppointmentEmailData) => ({
    subject: `Appointment ${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)} - Salon Elegance`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #7c3aed;">Appointment Status Update</h2>
        <p>Dear ${appointment.name},</p>
        <p>Your appointment status has been updated:</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Updated Details:</h3>
          <p><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${formatTime(appointment.time)}</p>
          <p><strong>New Status:</strong> <span style="color: #059669; font-weight: bold;">${appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span></p>
          ${appointment.notes ? `<p><strong>Admin Notes:</strong> ${appointment.notes}</p>` : ''}
        </div>
        
        <p>If you have any questions, please contact us.</p>
        <p>Thank you for choosing Salon Elegance!</p>
        <p>Best regards,<br>Salon Elegance Team</p>
      </div>
    `
  })
};

// Send email function
export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Send customer confirmation email
export async function sendCustomerConfirmation(appointment: AppointmentEmailData) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email credentials not configured, skipping email');
    return false;
  }

  const { subject, html } = emailTemplates.customerConfirmation(appointment);
  return await sendEmail(appointment.email, subject, html);
}

// Send admin notification email
export async function sendAdminNotification(appointment: AppointmentEmailData) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.ADMIN_EMAIL) {
    console.log('Email credentials or admin email not configured, skipping email');
    return false;
  }

  const { subject, html } = emailTemplates.adminNotification(appointment);
  return await sendEmail(process.env.ADMIN_EMAIL, subject, html);
}

// Send status update email
export async function sendStatusUpdate(appointment: AppointmentEmailData) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email credentials not configured, skipping email');
    return false;
  }

  const { subject, html } = emailTemplates.statusUpdate(appointment);
  return await sendEmail(appointment.email, subject, html);
} 