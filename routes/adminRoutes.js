const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllUsers,
  deleteUser,
  updateUserRole,
  getAllResumes,
} = require('../controllers/adminController');

// All admin routes require authentication + admin role
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);
router.get('/resumes', getAllResumes);

module.exports = router;
