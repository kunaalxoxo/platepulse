const ApiResponse = require('../utils/apiResponse');

const getVolunteerProfile = async (req, res, next) => {
  try {
    return ApiResponse.success(res, { message: 'Volunteer profile fetched', data: {} });
  } catch (error) { next(error); }
};

const getAvailableMissions = async (req, res, next) => {
  try {
    return ApiResponse.success(res, { message: 'Available missions fetched', data: [] });
  } catch (error) { next(error); }
};

const acceptMission = async (req, res, next) => {
  try {
    return ApiResponse.success(res, { message: 'Mission accepted', data: {} });
  } catch (error) { next(error); }
};

const getLeaderboard = async (req, res, next) => {
  try {
    return ApiResponse.success(res, { message: 'Leaderboard fetched', data: [] });
  } catch (error) { next(error); }
};

module.exports = { getVolunteerProfile, getAvailableMissions, acceptMission, getLeaderboard };
