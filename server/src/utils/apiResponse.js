/**
 * Standard API response helper
 * All responses follow: { success, message, data } or { success, data, pagination }
 */

class ApiResponse {
  static success(res, { message = 'Success', data = null, statusCode = 200, pagination = null }) {
    const response = { success: true, message, data };
    if (pagination) {
      response.pagination = pagination;
    }
    return res.status(statusCode).json(response);
  }

  static created(res, { message = 'Created successfully', data = null }) {
    return res.status(201).json({ success: true, message, data });
  }

  static error(res, { message = 'Something went wrong', errors = null, statusCode = 500 }) {
    const response = { success: false, message };
    if (errors) {
      response.errors = errors;
    }
    return res.status(statusCode).json(response);
  }
}

module.exports = ApiResponse;
