// backend/src/routes/marketMoverRoutes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const marketMoverController = require('../controllers/marketMoverController');

// Validation middleware
const validateVote = [
  body('playerName')
    .notEmpty()
    .withMessage('Player name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Player name must be between 2 and 100 characters'),
  body('playerId')
    .optional()
    .isString()
    .withMessage('Player ID must be a string')
];

const validateOwnership = [
  body('contestId')
    .notEmpty()
    .withMessage('Contest ID is required')
    .isUUID()
    .withMessage('Contest ID must be a valid UUID'),
  body('playerName')
    .notEmpty()
    .withMessage('Player name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Player name must be between 2 and 100 characters')
];

const validateBidUpAdmin = [
  body('playerName')
    .notEmpty()
    .withMessage('Player name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Player name must be between 2 and 100 characters'),
  body('boostPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Boost percentage must be between 0 and 100'),
  body('durationHours')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('Duration must be between 1 and 24 hours')
];

// Public routes (no auth required)
router.get('/status', marketMoverController.getStatus);
router.get('/leaderboard', marketMoverController.getVoteLeaders);
router.get('/bid-up-player', marketMoverController.getBidUpPlayer);
router.get('/available-players', marketMoverController.getAvailablePlayers);

// Protected routes (auth required)
router.use(auth); // Apply auth middleware to all routes below

// User voting and interaction routes
router.post('/vote', validateVote, marketMoverController.voteForPlayer);
router.post('/ownership', validateOwnership, marketMoverController.checkOwnership);
router.get('/voting-eligibility', marketMoverController.checkVotingEligibility);
router.get('/voting-history', marketMoverController.getVotingHistory);
router.get('/active-contests', marketMoverController.getActiveContests);

// Admin routes
router.post('/admin/set-bid-up', admin, validateBidUpAdmin, marketMoverController.setBidUpPlayer);

module.exports = router;

// Make sure this route is registered in your main routes file
// backend/src/routes/index.js - Add this line:
// router.use('/market-mover', require('./marketMoverRoutes'));