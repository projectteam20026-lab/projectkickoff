const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const admin = require('../controllers/adminController');

// All routes require authentication + admin role
router.use(protect, authorize('مسؤول'));

// Stats
router.get('/stats', admin.getStats);

// Users
router.get('/users', admin.getUsers);
router.delete('/users/:id', admin.deleteUser);
router.put('/users/:id/role', admin.updateUserRole);

// Bookings
router.get('/bookings', admin.getBookings);
router.put('/bookings/:id', admin.updateBooking);
router.delete('/bookings/:id', admin.deleteBooking);

// Fields
router.get('/fields', admin.getFields);
router.post('/fields', admin.createField);
router.put('/fields/:id', admin.updateField);
router.delete('/fields/:id', admin.deleteField);

// Teams
router.get('/teams', admin.getTeams);
router.delete('/teams/:id', admin.deleteTeam);

// Tournaments
router.get('/tournaments', admin.getTournaments);
router.post('/tournaments', admin.createTournament);
router.put('/tournaments/:id', admin.updateTournament);
router.delete('/tournaments/:id', admin.deleteTournament);
router.post('/tournaments/:id/add-team', admin.addTeamToTournament);
router.delete('/tournaments/:id/remove-team/:teamId', admin.removeTeamFromTournament);

module.exports = router;
