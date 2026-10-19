const express = require('express');
const router = express.Router();
const mappingController = require('../controllers/mapping.controller');
const authenticate = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const {
  createMappingSchema,
  mappingIdParamSchema,
  patientIdInMappingParamSchema
} = require('../validators/mapping.validator');

// All mapping routes require authentication
router.use(authenticate);

// POST /api/mappings/ - Assign a doctor to a patient
router.post(
  '/',
  validate({ body: createMappingSchema }),
  mappingController.createMapping
);

// GET /api/mappings/ - List mappings for the authenticated user's patients
router.get(
  '/',
  mappingController.getMappings
);

// GET /api/mappings/:patientId/ - Return doctors assigned to a specific patient
router.get(
  '/:patientId',
  validate({ params: patientIdInMappingParamSchema }),
  mappingController.getMappingsByPatientId
);

// DELETE /api/mappings/:id/ - Remove a patient-doctor assignment
router.delete(
  '/:id',
  validate({ params: mappingIdParamSchema }),
  mappingController.deleteMapping
);

module.exports = router;
