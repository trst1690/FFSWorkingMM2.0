// backend/src/controllers/marketMoverController.js
const marketMoverService = require('../services/marketMoverService');
const ticketService = require('../services/ticketService');
const contestService = require('../services/contestService');
const { validationResult } = require('express-validator');

const marketMoverController = {
  // Get current market mover status
  async getStatus(req, res) {
    try {
      const status = await marketMoverService.getVotingStatus();
      
      res.json({
        success: true,
        ...status
      });
    } catch (error) {
      console.error('Error getting market mover status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get market mover status'
      });
    }
  },

  // Get vote leaderboard
  async getVoteLeaders(req, res) {
    try {
      const leaders = await marketMoverService.getVoteLeaders();
      
      res.json({
        success: true,
        leaderboard: leaders
      });
    } catch (error) {
      console.error('Error getting vote leaders:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get vote leaders'
      });
    }
  },

  // Get current bid up player
  async getBidUpPlayer(req, res) {
    try {
      const bidUpPlayer = await marketMoverService.getCurrentBidUpPlayer();
      
      res.json({
        success: true,
        currentBidUpPlayer: bidUpPlayer
      });
    } catch (error) {
      console.error('Error getting bid up player:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get bid up player'
      });
    }
  },

  // Vote for a player
  async voteForPlayer(req, res) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const userId = req.user.id || req.user.userId;
      const { playerName, playerId } = req.body;
      
      if (!playerName) {
        return res.status(400).json({
          success: false,
          error: 'Player name is required'
        });
      }

      // Check if user can vote
      const eligibility = await marketMoverService.canUserVote(userId);
      if (!eligibility.canVote) {
        return res.status(400).json({
          success: false,
          error: eligibility.reason
        });
      }

      // Process the vote
      const result = await marketMoverService.voteForPlayer(userId, playerName, playerId);
      
      res.json({
        success: true,
        message: `Vote cast for ${playerName}`,
        newTickets: result.newTicketBalance
      });
    } catch (error) {
      console.error('Error voting for player:', error);
      
      if (error.message.includes('already voted')) {
        return res.status(400).json({
          success: false,
          error: 'You have already voted in this period'
        });
      }
      
      if (error.message.includes('Insufficient tickets')) {
        return res.status(400).json({
          success: false,
          error: 'You need at least 1 ticket to vote'
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to process vote'
      });
    }
  },

  // Check player ownership in a contest
  async checkOwnership(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const { contestId, playerName } = req.body;
      
      if (!contestId || !playerName) {
        return res.status(400).json({
          success: false,
          error: 'Contest ID and player name are required'
        });
      }

      // Check if user has tickets
      const ticketBalance = await ticketService.getBalance(userId);
      if (ticketBalance < 1) {
        return res.status(400).json({
          success: false,
          error: 'You need at least 1 ticket to check ownership'
        });
      }

      // Use a ticket
      const ticketResult = await ticketService.useTickets(userId, 1, `Ownership check: ${playerName} in contest ${contestId}`);
      if (!ticketResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to process ticket payment'
        });
      }

      // Calculate ownership
      const ownership = await marketMoverService.calculateOwnership(contestId, playerName);
      
      res.json({
        success: true,
        ownership: ownership,
        playerName: playerName,
        contestId: contestId,
        newTickets: ticketResult.newBalance
      });
    } catch (error) {
      console.error('Error checking ownership:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check player ownership'
      });
    }
  },

  // Get available players for voting
  async getAvailablePlayers(req, res) {
    try {
      const players = marketMoverService.getAvailablePlayers();
      
      res.json({
        success: true,
        players: players
      });
    } catch (error) {
      console.error('Error getting available players:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get available players'
      });
    }
  },

  // Get active Market Mover contests
  async getActiveContests(req, res) {
    try {
      const allContests = await contestService.getContests();
      const marketMoverContests = allContests.filter(contest => 
        contest.type === 'market' && 
        (contest.status === 'open' || contest.status === 'drafting')
      );
      
      res.json({
        success: true,
        contests: marketMoverContests.map(contest => ({
          id: contest.id,
          name: contest.name,
          currentEntries: contest.currentEntries,
          maxEntries: contest.maxEntries,
          entryFee: contest.entryFee,
          prizePool: contest.prizePool,
          status: contest.status
        }))
      });
    } catch (error) {
      console.error('Error getting active contests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get active contests'
      });
    }
  },

  // Check user's voting eligibility
  async checkVotingEligibility(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const eligibility = await marketMoverService.canUserVote(userId);
      
      res.json({
        success: true,
        canVote: eligibility.canVote,
        reason: eligibility.reason || null
      });
    } catch (error) {
      console.error('Error checking voting eligibility:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check voting eligibility'
      });
    }
  },

  // Get user's voting history
  async getVotingHistory(req, res) {
    try {
      const userId = req.user.id || req.user.userId;
      const limit = parseInt(req.query.limit) || 20;
      
      const db = require('../models');
      const votes = await db.MarketMoverVote.findAll({
        where: { user_id: userId },
        include: [{
          model: db.VotePeriod,
          as: 'votePeriod',
          attributes: ['period_start', 'period_end', 'status', 'winning_player']
        }],
        order: [['created_at', 'DESC']],
        limit: limit
      });

      const history = votes.map(vote => ({
        id: vote.id,
        playerName: vote.player_name,
        votedAt: vote.created_at,
        periodStart: vote.votePeriod.period_start,
        periodEnd: vote.votePeriod.period_end,
        periodStatus: vote.votePeriod.status,
        won: vote.votePeriod.winning_player === vote.player_name
      }));
      
      res.json({
        success: true,
        history: history
      });
    } catch (error) {
      console.error('Error getting voting history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get voting history'
      });
    }
  },

  // Admin function to manually set bid up player
  async setBidUpPlayer(req, res) {
    try {
      // Check admin privileges
      if (!req.user.isAdmin && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { playerName, boostPercentage = 35, durationHours = 6 } = req.body;
      
      if (!playerName) {
        return res.status(400).json({
          success: false,
          error: 'Player name is required'
        });
      }

      const db = require('../models');
      const now = new Date();
      const endsAt = new Date(now.getTime() + (durationHours * 60 * 60 * 1000));

      // Deactivate any current bid up
      await db.MarketMoverBidUp.update(
        { status: 'expired' },
        { where: { status: 'active' } }
      );

      // Create new bid up
      const bidUp = await db.MarketMoverBidUp.create({
        player_name: playerName,
        vote_count: 0,
        boost_percentage: boostPercentage,
        status: 'active',
        starts_at: now,
        ends_at: endsAt
      });

      // Emit event
      const io = require('../app').io;
      if (io) {
        io.emit('market-mover-admin-update', {
          type: 'bid_up_set',
          player: {
            name: playerName,
            boostPercentage: boostPercentage,
            endsAt: endsAt
          }
        });
      }
      
      res.json({
        success: true,
        message: `Set ${playerName} as bid up player with ${boostPercentage}% boost`,
        bidUp: bidUp
      });
    } catch (error) {
      console.error('Error setting bid up player:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to set bid up player'
      });
    }
  }
};

module.exports = marketMoverController;