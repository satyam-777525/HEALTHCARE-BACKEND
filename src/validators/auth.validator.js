const { z } = require('zod');

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(2, { message: 'Name must be at least 2 characters long' })
    .max(100, { message: 'Name cannot exceed 100 characters' }),
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'Invalid email address format' })
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters long' })
    .max(128, { message: 'Password cannot exceed 128 characters' })
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .email({ message: 'Invalid email address format' })
    .toLowerCase(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, { message: 'Password is required' })
});

module.exports = {
  registerSchema,
  loginSchema
};
