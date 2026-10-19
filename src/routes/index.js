const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const patientRoutes = require('./patient.routes');
const doctorRoutes = require('./doctor.routes');
const mappingRoutes = require('./mapping.routes');
const healthRoutes = require('./health.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/mappings', mappingRoutes);
router.use('/health', healthRoutes);

module.exports = router;
