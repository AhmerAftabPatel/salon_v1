import { z } from 'zod';

export const appointmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits').max(15, 'Phone number must be less than 15 digits'),
  email: z.string().email('Please enter a valid email address'),
  date: z.preprocess(
    (arg) => {
      if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
      return arg;
    },
    z.date({
      required_error: 'Please select a date',
      invalid_type_error: 'Please select a valid date',
    })
  ),
  time: z.string().min(1, 'Please select a time'),
  notes: z.string().optional(),
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

export const appointmentUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'completed']),
  notes: z.string().optional(),
});

export type AppointmentUpdateData = z.infer<typeof appointmentUpdateSchema>; 