const express = require('express');
const router = express.Router();
const { getReviews, createReview, deleteReview, getMyReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.get('/', getReviews);                 // Public: get all reviews for a field
router.get('/my', protect, getMyReview);     // Private: get my review for a field
router.post('/', protect, createReview);     // Private: create or update review
router.delete('/:id', protect, deleteReview); // Private: delete review

module.exports = router;
