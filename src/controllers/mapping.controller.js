const prisma = require('../config/db');

/**
 * Assign a doctor to a patient
 * POST /api/mappings/
 */
const createMapping = async (req, res, next) => {
  try {
    const { patientId, doctorId } = req.body;
    const userId = req.userId;

    // 1. Verify patient exists and belongs to the authenticated user
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${patientId} was not found.`
      });
    }

    if (patient.createdById !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only assign doctors to your own patients.'
      });
    }

    // 2. Verify doctor exists
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor with ID ${doctorId} was not found.`
      });
    }

    // 3. Prevent duplicate assignment
    const existingMapping = await prisma.patientDoctor.findUnique({
      where: {
        patient_doctor_unique: {
          patientId,
          doctorId
        }
      }
    });

    if (existingMapping) {
      return res.status(409).json({
        success: false,
        message: 'Conflict. Doctor is already assigned to this patient.'
      });
    }

    // 4. Create mapping
    const mapping = await prisma.patientDoctor.create({
      data: {
        patientId,
        doctorId
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            gender: true,
            contact: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            contact: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Doctor successfully assigned to patient.',
      data: mapping
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all mappings for the authenticated user's patients
 * GET /api/mappings/
 */
const getMappings = async (req, res, next) => {
  try {
    const userId = req.userId;

    const mappings = await prisma.patientDoctor.findMany({
      where: {
        patient: {
          createdById: userId
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            gender: true,
            contact: true
          }
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            contact: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Mappings retrieved successfully.',
      count: mappings.length,
      data: mappings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Return doctors assigned to a specific patient
 * GET /api/mappings/:patientId/
 */
const getMappingsByPatientId = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const userId = req.userId;

    // Verify patient exists and belongs to authenticated user
    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${patientId} was not found.`
      });
    }

    if (patient.createdById !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to view mappings for this patient.'
      });
    }

    const mappings = await prisma.patientDoctor.findMany({
      where: {
        patientId
      },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            contact: true,
            address: true
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Assigned doctors retrieved successfully.',
      patient: {
        id: patient.id,
        name: patient.name
      },
      count: mappings.length,
      data: mappings
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a patient-doctor assignment
 * DELETE /api/mappings/:id/
 */
const deleteMapping = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const mapping = await prisma.patientDoctor.findUnique({
      where: { id },
      include: {
        patient: true
      }
    });

    if (!mapping) {
      return res.status(404).json({
        success: false,
        message: `Mapping with ID ${id} was not found.`
      });
    }

    // Verify patient ownership
    if (mapping.patient.createdById !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to delete mappings for this patient.'
      });
    }

    await prisma.patientDoctor.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: `Mapping with ID ${id} was deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMapping,
  getMappings,
  getMappingsByPatientId,
  deleteMapping
};
