'use strict';

const express = require('express');
const router  = express.Router();
const {
  getFields,
  getFeaturedFields,
  getFieldsByCity,
  getField,
  createField,
  updateField,
  deleteField,
  getMyFields,
} = require('../controllers/fieldController');
const { protect } = require('../middleware/auth');

router.get('/featured',    getFeaturedFields);
router.get('/city/:city',  getFieldsByCity);
router.get('/mine',        protect, getMyFields);   // must be before /:id
router.get('/',            getFields);
router.get('/:id',         getField);
router.post('/',           protect, createField);
router.put('/:id',         protect, updateField);
router.delete('/:id',      protect, deleteField);

module.exports = router;
