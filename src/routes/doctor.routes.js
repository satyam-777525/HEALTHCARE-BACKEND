const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  doctorIdParamSchema,
  createDoctorSchema,
  updateDoctorSchema
} = require('../validators/doctor.validator');

// All doctor routes require authentication
router.use(authenticate);

// POST /api/doctors/ - Create a doctor
router.post(
  '/',
  validate({ body: createDoctorSchema }),
  doctorController.createDoctor
);

// GET /api/doctors/ - List all doctors
router.get(
  '/',
  doctorController.getDoctors
);

// GET /api/doctors/:id/ - Get doctor details
router.get(
  '/:id',
  validate({ params: doctorIdParamSchema }),
  doctorController.getDoctorById
);

// PUT /api/doctors/:id/ - Update doctor details (creator only)
router.put(
  '/:id',
  validate({ params: doctorIdParamSchema, body: updateDoctorSchema }),
  doctorController.updateDoctor
);

// DELETE /api/doctors/:id/ - Delete a doctor (creator only)
router.delete(
  '/:id',
  validate({ params: doctorIdParamSchema }),
  doctorController.deleteDoctor
);

module.exports = router;
