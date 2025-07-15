const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth.middleware');
const adminController = require('../../controllers/admin.controller');

router.post('/getUsers', authenticate, requireRole('super_admin', 'admin'), adminController.getUsers);
router.get('/getRoles', authenticate, requireRole('super_admin', 'admin'), adminController.getRoles);
router.get('/getUserRoles', authenticate, requireRole('super_admin', 'admin'), adminController.getUserRoles);
router.post('/addRole', authenticate, requireRole('super_admin'), adminController.addRole);
router.post('/deleteRole', authenticate, requireRole('super_admin'), adminController.deleteRole);
router.post('/addUserRole', authenticate, requireRole('super_admin', 'admin'), adminController.addUserRole);
router.post('/removeUserRole', authenticate, requireRole('super_admin', 'admin'), adminController.removeUserRole);
router.get('/getRoleById', authenticate, requireRole('super_admin'), adminController.getRoleById);

module.exports = router;