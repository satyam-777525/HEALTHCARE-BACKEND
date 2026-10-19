const { z } = require('zod');

const doctorIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, { message: 'Doctor ID must be an integer' })
    .transform(Number)
    .refine((val) => val > 0, { message: 'Doctor ID must be a positive integer' })
});

const createDoctorSchema = z.object({
  name: z
    .string({ required_error: 'Doctor name is required' })
    .trim()
    .min(2, { message: 'Doctor name must be at least 2 characters long' })
    .max(100, { message: 'Doctor name cannot exceed 100 characters' }),
  specialization: z
    .string({ required_error: 'Specialization is required' })
    .trim()
    .min(2, { message: 'Specialization must be at least 2 characters long' })
    .max(100, { message: 'Specialization cannot exceed 100 characters' }),
  contact: z
    .string({ required_error: 'Contact information is required' })
    .trim()
    .min(5, { message: 'Contact must be at least 5 characters long' })
    .max(50, { message: 'Contact cannot exceed 50 characters' }),
  address: z
    .string({ required_error: 'Address is required' })
    .trim()
    .min(3, { message: 'Address must be at least 3 characters long' })
    .max(255, { message: 'Address cannot exceed 255 characters' })
});

const updateDoctorSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Doctor name must be at least 2 characters long' })
    .max(100, { message: 'Doctor name cannot exceed 100 characters' })
    .optional(),
  specialization: z
    .string()
    .trim()
    .min(2, { message: 'Specialization must be at least 2 characters long' })
    .max(100, { message: 'Specialization cannot exceed 100 characters' })
    .optional(),
  contact: z
    .string()
    .trim()
    .min(5, { message: 'Contact must be at least 5 characters long' })
    .max(50, { message: 'Contact cannot exceed 50 characters' })
    .optional(),
  address: z
    .string()
    .trim()
    .min(3, { message: 'Address must be at least 3 characters long' })
    .max(255, { message: 'Address cannot exceed 255 characters' })
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

module.exports = {
  doctorIdParamSchema,
  createDoctorSchema,
  updateDoctorSchema
};
