# Salon Management System

A modern, full-stack salon management application built with Next.js 15, React 19, TypeScript, and MongoDB. This system provides a seamless booking experience for customers and comprehensive management tools for salon administrators.

## ✨ Features

### Customer Features
- **Easy Appointment Booking**: Simple form with name, phone, email, date, and time selection
- **Real-time Availability**: See available time slots for any selected date
- **Same-day Booking**: Book appointments for the current day
- **Central Timezone Support**: All times displayed in Central Time (America/Chicago)
- **Instant Confirmation**: Receive immediate confirmation emails
- **Responsive Design**: Works perfectly on all devices

### Admin Features
- **Comprehensive Dashboard**: View all appointments with filtering and search
- **Status Management**: Update appointment status (pending, confirmed, cancelled, completed)
- **Real-time Updates**: See changes immediately across the interface
- **Email Notifications**: Automatic emails for status changes
- **Time Slot Management**: Prevent double-booking of confirmed slots

### Technical Features
- **Modern Tech Stack**: Next.js 15, React 19, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Form Validation**: React Hook Form with Zod validation
- **Email System**: Nodemailer integration for automated notifications
- **Timezone Handling**: Proper Central Timezone support
- **Responsive UI**: Tailwind CSS for beautiful, mobile-friendly design

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or Atlas)
- Gmail account (for email notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd salon-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update `.env.local` with your values:
   ```env
   # MongoDB Connection
   MONGODB_URI=mongodb://localhost:27017/salon-management
   
   # Next.js Configuration
   NEXTAUTH_SECRET=your-generated-secret
   NEXTAUTH_URL=http://localhost:3000
   
   # Email Configuration (Gmail)
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ADMIN_EMAIL=admin@salonelegance.com
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📧 Email Setup

### Gmail Configuration
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASS`

### Email Templates
The system includes three email templates:
- **Customer Confirmation**: Sent when appointment is booked
- **Admin Notification**: Sent to admin for new appointments
- **Status Update**: Sent to customer when status changes

## 🕐 Timezone Features

### Central Timezone Support
- All times are displayed in Central Time (America/Chicago)
- Automatic timezone conversion for database storage
- Same-day booking available
- 30-day advance booking window

### Time Slot Management
- 18 available time slots (9:00 AM - 5:30 PM)
- Real-time availability checking
- Prevents double-booking of confirmed slots
- Shows only available times for selected dates

## 📱 Usage

### For Customers
1. Visit the homepage
2. Click "Book Appointment"
3. Fill out the booking form
4. Select your preferred date and time
5. Submit and receive confirmation email

### For Administrators
1. Access the admin panel at `/admin`
2. View all appointments with filtering options
3. Update appointment status and add notes
4. Receive email notifications for new bookings
5. Manage time slot availability

## 🔧 API Endpoints

### Appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments` - Get all appointments (with filters)
- `GET /api/appointments?availableSlots=true&date=YYYY-MM-DD` - Get available slots
- `PATCH /api/appointments/[id]` - Update appointment
- `DELETE /api/appointments/[id]` - Delete appointment

### Features
- **Validation**: Zod schema validation for all inputs
- **Error Handling**: Comprehensive error handling and user feedback
- **Email Integration**: Automatic email notifications
- **Timezone Support**: Central Timezone handling throughout

## 🗄️ Database Schema

### Appointment Model
```typescript
{
  name: String (required),
  phoneNumber: String (required),
  email: String (required),
  date: Date (required),
  time: String (required),
  status: Enum ['pending', 'confirmed', 'cancelled', 'completed'],
  notes: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

## 🎨 Customization

### Styling
- Modify `tailwind.config.js` for color schemes
- Update CSS classes in components
- Customize email templates in `src/lib/email.ts`

### Business Logic
- Adjust time slots in `src/lib/timezone.ts`
- Modify booking rules and validation
- Update email templates and notifications

### Timezone
- Change timezone in `src/lib/timezone.ts`
- Update `CENTRAL_TIMEZONE` constant
- Adjust date formatting as needed

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
- **Netlify**: Similar to Vercel setup
- **Railway**: Good for full-stack apps
- **DigitalOcean**: Manual deployment option

### Environment Variables
Ensure all required environment variables are set in production:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `EMAIL_USER`
- `EMAIL_PASS`
- `ADMIN_EMAIL`

## 🐛 Troubleshooting

### Common Issues
1. **MongoDB Connection**: Check connection string and network access
2. **Email Not Sending**: Verify Gmail credentials and app password
3. **Timezone Issues**: Ensure server timezone matches Central Time
4. **Build Errors**: Check Node.js version compatibility

### Debug Mode
Enable debug logging by setting:
```env
DEBUG=true
```

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support or questions, please open an issue in the GitHub repository.

---

**Built with ❤️ using Next.js, React, TypeScript, and MongoDB**
