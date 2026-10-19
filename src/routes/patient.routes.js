const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  patientIdParamSchema,
  createPatientSchema,
  updatePatientSchema
} = require('../validators/patient.validator');

// All patient routes require authentication
router.use(authenticate);

// POST /api/patients/ - Create a patient
router.post(
  '/',
  validate({ body: createPatientSchema }),
  patientController.createPatient
);

// GET /api/patients/ - Get only patients created by authenticated user
router.get(
  '/',
  patientController.getPatients
);

// GET /api/patients/:id/ - Get a specific patient (only if owned)
router.get(
  '/:id',
  validate({ params: patientIdParamSchema }),
  patientController.getPatientById
);

// PUT /api/patients/:id/ - Update an owned patient
router.put(
  '/:id',
  validate({ params: patientIdParamSchema, body: updatePatientSchema }),
  patientController.updatePatient
);

// DELETE /api/patients/:id/ - Delete an owned patient
router.delete(
  '/:id',
  validate({ params: patientIdParamSchema }),
  patientController.deletePatient
);

module.exports = router;
