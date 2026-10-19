const prisma = require('../config/db');

/**
 * Create a new patient
 * POST /api/patients/
 */
const createPatient = async (req, res, next) => {
  try {
    const { name, dateOfBirth, age, gender, contact, address } = req.body;
    const userId = req.userId;

    const patient = await prisma.patient.create({
      data: {
        name,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        age: age !== undefined ? age : null,
        gender,
        contact,
        address,
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Patient created successfully.',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all patients created by the authenticated user
 * GET /api/patients/
 */
const getPatients = async (req, res, next) => {
  try {
    const userId = req.userId;

    const patients = await prisma.patient.findMany({
      where: {
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        mappings: {
          include: {
            doctor: {
              select: {
                id: true,
                name: true,
                specialization: true,
                contact: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Patients retrieved successfully.',
      count: patients.length,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific patient by ID (only if owned by the authenticated user)
 * GET /api/patients/:id/
 */
const getPatientById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        mappings: {
          include: {
            doctor: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${id} was not found.`
      });
    }

    if (patient.createdById !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to view this patient.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Patient details retrieved successfully.',
      data: patient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update an owned patient
 * PUT /api/patients/:id/
 */
const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { name, dateOfBirth, age, gender, contact, address } = req.body;

    const existingPatient = await prisma.patient.findUnique({
      where: { id }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${id} was not found.`
      });
    }

    if (existingPatient.createdById !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to update this patient.'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (age !== undefined) updateData.age = age;
    if (gender !== undefined) updateData.gender = gender;
    if (contact !== undefined) updateData.contact = contact;
    if (address !== undefined) updateData.address = address;

    const updatedPatient = await prisma.patient.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Patient updated successfully.',
      data: updatedPatient
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an owned patient
 * DELETE /api/patients/:id/
 */
const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const existingPatient = await prisma.patient.findUnique({
      where: { id }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: `Patient with ID ${id} was not found.`
      });
    }

    if (existingPatient.createdById !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to delete this patient.'
      });
    }

    await prisma.patient.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: `Patient with ID ${id} was deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient
};
