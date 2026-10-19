const { ZodError } = require('zod');

/**
 * Middleware factory for validating request body, query, and params using Zod schemas
 * @param {Object} schemas - { body?: ZodSchema, params?: ZodSchema, query?: ZodSchema }
 */
const validate = (schemas) => {
  return async (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors
        });
      }
      next(error);
    }
  };
};

module.exports = validate;
