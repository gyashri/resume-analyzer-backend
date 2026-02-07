const User = require('../models/User');
const Resume = require('../models/Resume');

/**
 * Admin Controller - Admin-only operations
 * All routes require protect + authorize('admin') middleware
 */

/**
 * @route   GET /api/admin/stats
 * @desc    Get dashboard statistics
 * @access  Admin only
 */
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalResumes,
      completedResumes,
      failedResumes,
      processingResumes,
      recentUsers,
      recentResumes,
    ] = await Promise.all([
      User.countDocuments(),
      Resume.countDocuments(),
      Resume.countDocuments({ status: 'completed' }),
      Resume.countDocuments({ status: 'failed' }),
      Resume.countDocuments({ status: 'processing' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
      Resume.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('originalFileName status analysis.matchScore createdAt')
        .populate('user', 'name email'),
    ]);

    // Calculate average score
    const avgResult = await Resume.aggregate([
      { $match: { status: 'completed', 'analysis.matchScore': { $exists: true } } },
      { $group: { _id: null, avgScore: { $avg: '$analysis.matchScore' } } },
    ]);

    const averageScore = avgResult.length > 0 ? Math.round(avgResult[0].avgScore) : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalResumes,
          completedResumes,
          failedResumes,
          processingResumes,
          averageScore,
        },
        recentUsers,
        recentResumes,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/admin/users
 * @desc    Get all users
 * @access  Admin only
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .select('-password');

    // Get resume count for each user
    const userIds = users.map((u) => u._id);
    const resumeCounts = await Resume.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 } } },
    ]);

    const resumeCountMap = {};
    resumeCounts.forEach((rc) => {
      resumeCountMap[rc._id.toString()] = rc.count;
    });

    const usersWithCounts = users.map((user) => ({
      ...user.toObject(),
      resumeCount: resumeCountMap[user._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      count: usersWithCounts.length,
      data: usersWithCounts,
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message,
    });
  }
};

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete a user and their resumes
 * @access  Admin only
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Delete all user's resumes first
    await Resume.deleteMany({ user: user._id });

    // Delete the user
    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: `User "${user.name}" and their resumes deleted successfully`,
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message,
    });
  }
};

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update user role
 * @access  Admin only
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be "user" or "admin"',
      });
    }

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role',
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `User "${user.name}" role updated to ${role}`,
      data: user,
    });
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/admin/resumes
 * @desc    Get all resumes across all users
 * @access  Admin only
 */
const getAllResumes = async (req, res) => {
  try {
    const resumes = await Resume.find()
      .sort({ createdAt: -1 })
      .select('-extractedText')
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes,
    });
  } catch (error) {
    console.error('Admin get resumes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching resumes',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  updateUserRole,
  getAllResumes,
};
