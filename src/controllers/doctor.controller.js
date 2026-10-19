const prisma = require('../config/db');

/**
 * Create a new doctor
 * POST /api/doctors/
 */
const createDoctor = async (req, res, next) => {
  try {
    const { name, specialization, contact, address } = req.body;
    const userId = req.userId;

    const doctor = await prisma.doctor.create({
      data: {
        name,
        specialization,
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
      message: 'Doctor created successfully.',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all doctors (authenticated users)
 * GET /api/doctors/
 */
const getDoctors = async (req, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: { mappings: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Doctors retrieved successfully.',
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get doctor details by ID (authenticated users)
 * GET /api/doctors/:id/
 */
const getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await prisma.doctor.findUnique({
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
            patient: {
              select: {
                id: true,
                name: true,
                gender: true,
                contact: true
              }
            }
          }
        }
      }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor with ID ${id} was not found.`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Doctor details retrieved successfully.',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update doctor details (only creator/owner can update)
 * PUT /api/doctors/:id/
 */
const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { name, specialization, contact, address } = req.body;

    const existingDoctor = await prisma.doctor.findUnique({
      where: { id }
    });

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor with ID ${id} was not found.`
      });
    }

    // Authorization rule: Only creator can update
    if (existingDoctor.createdById !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to modify this doctor profile because you did not create it.'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (specialization !== undefined) updateData.specialization = specialization;
    if (contact !== undefined) updateData.contact = contact;
    if (address !== undefined) updateData.address = address;

    const updatedDoctor = await prisma.doctor.update({
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
      message: 'Doctor updated successfully.',
      data: updatedDoctor
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a doctor (only creator/owner can delete)
 * DELETE /api/doctors/:id/
 */
const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const existingDoctor = await prisma.doctor.findUnique({
      where: { id }
    });

    if (!existingDoctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor with ID ${id} was not found.`
      });
    }

    // Authorization rule: Only creator can delete
    if (existingDoctor.createdById !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have permission to delete this doctor profile because you did not create it.'
      });
    }

    await prisma.doctor.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: `Doctor with ID ${id} was deleted successfully.`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  updateDoctor,
  deleteDoctor
};
