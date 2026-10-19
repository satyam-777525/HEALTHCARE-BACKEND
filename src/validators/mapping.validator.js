const { z } = require('zod');

const createMappingSchema = z.object({
  patientId: z
    .number({ required_error: 'patientId is required' })
    .int({ message: 'patientId must be an integer' })
    .positive({ message: 'patientId must be a positive integer' }),
  doctorId: z
    .number({ required_error: 'doctorId is required' })
    .int({ message: 'doctorId must be an integer' })
    .positive({ message: 'doctorId must be a positive integer' })
});

const mappingIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, { message: 'Mapping ID must be an integer' })
    .transform(Number)
    .refine((val) => val > 0, { message: 'Mapping ID must be a positive integer' })
});

const patientIdInMappingParamSchema = z.object({
  patientId: z
    .string()
    .regex(/^\d+$/, { message: 'Patient ID must be an integer' })
    .transform(Number)
    .refine((val) => val > 0, { message: 'Patient ID must be a positive integer' })
});

module.exports = {
  createMappingSchema,
  mappingIdParamSchema,
  patientIdInMappingParamSchema
};
