const express = require('express');
const router = express.Router();
const { getMatches, createMatch, updateResult } = require('../controllers/matchController');
const { protect } = require('../middleware/auth');

router.get('/', getMatches);
router.post('/', protect, createMatch);
router.put('/:id/result', protect, updateResult);

module.exports = router;
