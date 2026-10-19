const { z } = require('zod');

const patientIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, { message: 'Patient ID must be an integer' })
    .transform(Number)
    .refine((val) => val > 0, { message: 'Patient ID must be a positive integer' })
});

const createPatientSchema = z.object({
  name: z
    .string({ required_error: 'Patient name is required' })
    .trim()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name cannot exceed 100 characters' }),
  dateOfBirth: z
    .string()
    .datetime({ message: 'Date of birth must be a valid ISO 8601 date string (e.g. 1995-05-15T00:00:00.000Z)' })
    .optional()
    .nullable(),
  age: z
    .number()
    .int({ message: 'Age must be an integer' })
    .min(0, { message: 'Age cannot be negative' })
    .max(150, { message: 'Age must be 150 or less' })
    .optional()
    .nullable(),
  gender: z
    .string({ required_error: 'Gender is required' })
    .trim()
    .min(1, { message: 'Gender is required' })
    .max(20, { message: 'Gender cannot exceed 20 characters' }),
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
}).refine(
  (data) => data.dateOfBirth !== undefined || data.age !== undefined,
  {
    message: 'Either dateOfBirth or age must be provided',
    path: ['dateOfBirth']
  }
);

const updatePatientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name cannot exceed 100 characters' })
    .optional(),
  dateOfBirth: z
    .string()
    .datetime({ message: 'Date of birth must be a valid ISO 8601 date string' })
    .optional()
    .nullable(),
  age: z
    .number()
    .int({ message: 'Age must be an integer' })
    .min(0, { message: 'Age cannot be negative' })
    .max(150, { message: 'Age must be 150 or less' })
    .optional()
    .nullable(),
  gender: z
    .string()
    .trim()
    .min(1, { message: 'Gender cannot be empty' })
    .max(20, { message: 'Gender cannot exceed 20 characters' })
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
  patientIdParamSchema,
  createPatientSchema,
  updatePatientSchema
};
