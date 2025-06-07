// backend/src/services/marketMoverService.js
const db = require('../models');
const { MarketMoverVote, MarketMoverBidUp, User, Contest, ContestEntry } = db;
const { PLAYER_POOLS } = require('../utils/gameLogic');
const ticketService = require('./ticketService');

class MarketMoverService {
  constructor() {
    this.votingPeriodHours = 6; // 6 hour voting periods
    this.currentVotingPeriod = null;
    this.currentBidUpPlayer = null;
  }

  // Initialize voting period
  async initializeVotingPeriod() {
    try {
      const now = new Date();
      const periodStart = new Date(now);
      periodStart.setHours(Math.floor(now.getHours() / this.votingPeriodHours) * this.votingPeriodHours, 0, 0, 0);
      
      const periodEnd = new Date(periodStart);
      periodEnd.setHours(periodStart.getHours() + this.votingPeriodHours);

      // Check if we already have a voting period for this time
      let votingPeriod = await db.VotePeriod.findOne({
        where: {
          period_start: periodStart,
          period_end: periodEnd
        }
      });

      if (!votingPeriod) {
        votingPeriod = await db.VotePeriod.create({
          period_start: periodStart,
          period_end: periodEnd,
          status: now < periodEnd ? 'active' : 'completed'
        });
        console.log('Created new voting period:', votingPeriod.id);
      }

      this.currentVotingPeriod = votingPeriod;
      return votingPeriod;
    } catch (error) {
      console.error('Error initializing voting period:', error);
      throw error;
    }
  }

  // Vote for a player to be bid up
  async voteForPlayer(userId, playerName, playerId) {
    try {
      // Ensure we have an active voting period
      await this.initializeVotingPeriod();
      
      if (!this.currentVotingPeriod || this.currentVotingPeriod.status !== 'active') {
        throw new Error('No active voting period');
      }

      // Check if user has already voted in this period
      const existingVote = await MarketMoverVote.findOne({
        where: {
          user_id: userId,
          vote_period_id: this.currentVotingPeriod.id
        }
      });

      if (existingVote) {
        throw new Error('You have already voted in this period');
      }

      // Spend ticket
      const ticketResult = await ticketService.useTickets(userId, 1, `Voted for ${playerName} to be bid up`);
      if (!ticketResult.success) {
        throw new Error('Insufficient tickets');
      }

      // Record the vote
      const vote = await MarketMoverVote.create({
        user_id: userId,
        vote_period_id: this.currentVotingPeriod.id,
        player_name: playerName,
        player_id: playerId || `${playerName}-vote`,
        created_at: new Date()
      });

      console.log(`User ${userId} voted for ${playerName}`);
      
      // Update vote counts
      await this.updateVoteLeaderboard();
      
      return {
        success: true,
        vote,
        newTicketBalance: ticketResult.newBalance
      };
    } catch (error) {
      console.error('Error voting for player:', error);
      throw error;
    }
  }

  // Get current vote leaders
  async getVoteLeaders() {
    try {
      await this.initializeVotingPeriod();
      
      if (!this.currentVotingPeriod) {
        return [];
      }

      const votes = await MarketMoverVote.findAll({
        where: {
          vote_period_id: this.currentVotingPeriod.id
        },
        attributes: [
          'player_name',
          [db.sequelize.fn('COUNT', db.sequelize.col('player_name')), 'vote_count']
        ],
        group: ['player_name'],
        order: [[db.sequelize.fn('COUNT', db.sequelize.col('player_name')), 'DESC']],
        limit: 10
      });

      return votes.map(vote => ({
        name: vote.player_name,
        votes: parseInt(vote.getDataValue('vote_count'))
      }));
    } catch (error) {
      console.error('Error getting vote leaders:', error);
      return [];
    }
  }

  // Update vote leaderboard and select winner if period ended
  async updateVoteLeaderboard() {
    try {
      const now = new Date();
      
      if (!this.currentVotingPeriod) {
        await this.initializeVotingPeriod();
      }

      // Check if voting period has ended
      if (now >= this.currentVotingPeriod.period_end && this.currentVotingPeriod.status === 'active') {
        await this.completeVotingPeriod();
      }
    } catch (error) {
      console.error('Error updating vote leaderboard:', error);
    }
  }

  // Complete voting period and select winner
  async completeVotingPeriod() {
    try {
      const leaders = await this.getVoteLeaders();
      
      if (leaders.length > 0) {
        const winner = leaders[0];
        
        // Create bid up entry
        const bidUp = await MarketMoverBidUp.create({
          player_name: winner.name,
          vote_count: winner.votes,
          vote_period_id: this.currentVotingPeriod.id,
          boost_percentage: 35, // 35% boost
          status: 'active',
          starts_at: new Date(),
          ends_at: new Date(Date.now() + (this.votingPeriodHours * 60 * 60 * 1000)) // Next period
        });

        // Mark voting period as completed
        await this.currentVotingPeriod.update({ 
          status: 'completed',
          winning_player: winner.name 
        });

        this.currentBidUpPlayer = bidUp;
        
        console.log(`Voting period completed. Winner: ${winner.name} with ${winner.votes} votes`);
        
        // Emit event to all clients
        const io = require('../app').io;
        if (io) {
          io.emit('market-mover-winner', {
            player: winner,
            bidUp: bidUp
          });
        }
      }

      // Initialize next voting period
      await this.initializeVotingPeriod();
    } catch (error) {
      console.error('Error completing voting period:', error);
    }
  }

  // Get current bid up player
  async getCurrentBidUpPlayer() {
    try {
      const now = new Date();
      
      const activeBidUp = await MarketMoverBidUp.findOne({
        where: {
          status: 'active',
          starts_at: { [db.Sequelize.Op.lte]: now },
          ends_at: { [db.Sequelize.Op.gte]: now }
        },
        order: [['created_at', 'DESC']]
      });

      if (activeBidUp) {
        this.currentBidUpPlayer = activeBidUp;
        return {
          name: activeBidUp.player_name,
          boostPercentage: activeBidUp.boost_percentage,
          endsAt: activeBidUp.ends_at,
          voteCount: activeBidUp.vote_count
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting current bid up player:', error);
      return null;
    }
  }

  // Check if voting is currently active
  async isVotingActive() {
    try {
      await this.initializeVotingPeriod();
      
      if (!this.currentVotingPeriod) {
        return false;
      }

      const now = new Date();
      return now >= this.currentVotingPeriod.period_start && 
             now < this.currentVotingPeriod.period_end &&
             this.currentVotingPeriod.status === 'active';
    } catch (error) {
      console.error('Error checking voting status:', error);
      return false;
    }
  }

  // Get voting status for frontend
  async getVotingStatus() {
    try {
      const isActive = await this.isVotingActive();
      const leaders = await this.getVoteLeaders();
      const bidUpPlayer = await this.getCurrentBidUpPlayer();
      
      let nextVoteTime = null;
      if (this.currentVotingPeriod) {
        nextVoteTime = this.currentVotingPeriod.period_end;
      }

      return {
        votingActive: isActive,
        leaderboard: leaders,
        currentBidUpPlayer: bidUpPlayer,
        nextVoteTime: nextVoteTime
      };
    } catch (error) {
      console.error('Error getting voting status:', error);
      return {
        votingActive: false,
        leaderboard: [],
        currentBidUpPlayer: null,
        nextVoteTime: null
      };
    }
  }

  // Calculate player ownership in a contest
  async calculateOwnership(contestId, playerName) {
    try {
      // Get all entries for this contest
      const totalEntries = await ContestEntry.count({
        where: {
          contest_id: contestId,
          status: { [db.Sequelize.Op.in]: ['completed', 'active'] }
        }
      });

      if (totalEntries === 0) {
        return 0;
      }

      // Count entries that have this player in their roster
      const entriesWithPlayer = await ContestEntry.count({
        where: {
          contest_id: contestId,
          status: { [db.Sequelize.Op.in]: ['completed', 'active'] },
          roster: {
            [db.Sequelize.Op.or]: [
              { QB: { name: playerName } },
              { RB: { name: playerName } },
              { WR: { name: playerName } },
              { TE: { name: playerName } },
              { FLEX: { name: playerName } }
            ]
          }
        }
      });

      const ownershipPercentage = (entriesWithPlayer / totalEntries) * 100;
      return Math.round(ownershipPercentage * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      console.error('Error calculating ownership:', error);
      throw error;
    }
  }

  // Apply bid up boost to player board
  async applyBidUpBoost(playerBoard) {
    try {
      const bidUpPlayer = await this.getCurrentBidUpPlayer();
      
      if (!bidUpPlayer) {
        return playerBoard;
      }

      const boostedBoard = JSON.parse(JSON.stringify(playerBoard));
      const boostMultiplier = 1 + (bidUpPlayer.boostPercentage / 100);
      
      // Find and boost the player
      for (let row = 0; row < boostedBoard.length; row++) {
        for (let col = 0; col < boostedBoard[row].length; col++) {
          const player = boostedBoard[row][col];
          if (player && player.name === bidUpPlayer.name) {
            // Mark as bid up for visual indication
            player.isBidUp = true;
            player.originalAppearanceRate = player.appearanceRate || 1;
            player.appearanceRate = (player.appearanceRate || 1) * boostMultiplier;
            console.log(`Applied ${bidUpPlayer.boostPercentage}% boost to ${player.name}`);
          }
        }
      }

      return boostedBoard;
    } catch (error) {
      console.error('Error applying bid up boost:', error);
      return playerBoard;
    }
  }

  // Get available players for voting (from player pools)
  getAvailablePlayers() {
    const players = [];
    
    Object.entries(PLAYER_POOLS).forEach(([position, priceGroups]) => {
      Object.entries(priceGroups).forEach(([price, playerList]) => {
        playerList.forEach(player => {
          players.push({
            ...player,
            position,
            price: parseInt(price),
            id: `${player.name}-${player.team}`,
            displayName: `${player.name} ${player.team}`
          });
        });
      });
    });
    
    return players.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Check user's voting eligibility
  async canUserVote(userId) {
    try {
      await this.initializeVotingPeriod();
      
      if (!this.currentVotingPeriod || this.currentVotingPeriod.status !== 'active') {
        return { canVote: false, reason: 'No active voting period' };
      }

      // Check tickets
      const ticketBalance = await ticketService.getBalance(userId);
      if (ticketBalance < 1) {
        return { canVote: false, reason: 'Insufficient tickets' };
      }

      // Check if already voted
      const existingVote = await MarketMoverVote.findOne({
        where: {
          user_id: userId,
          vote_period_id: this.currentVotingPeriod.id
        }
      });

      if (existingVote) {
        return { canVote: false, reason: 'Already voted this period' };
      }

      return { canVote: true };
    } catch (error) {
      console.error('Error checking voting eligibility:', error);
      return { canVote: false, reason: 'Error checking eligibility' };
    }
  }

  // Start the service with periodic checks
  start() {
    console.log('MarketMover service started');
    
    // Check voting periods every minute
    setInterval(async () => {
      try {
        await this.updateVoteLeaderboard();
      } catch (error) {
        console.error('Error in periodic vote check:', error);
      }
    }, 60000); // 1 minute
  }
}

module.exports = new MarketMoverService();