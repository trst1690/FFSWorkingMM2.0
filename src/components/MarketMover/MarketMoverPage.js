// frontend/src/components/MarketMover/MarketMoverPage.js
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectAuthUser } from '../../store/slices/authSlice';
import VoteModal from './VoteModal';
import OwnershipModal from './OwnershipModal';
import './MarketMover.css';

const MarketMoverPage = () => {
  const user = useSelector(selectAuthUser);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [showOwnershipModal, setShowOwnershipModal] = useState(false);
  const [marketMoverData, setMarketMoverData] = useState({
    votingActive: false,
    leaderboard: [],
    currentBidUpPlayer: null,
    nextVoteTime: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userTickets, setUserTickets] = useState(user?.tickets || 0);

  useEffect(() => {
    fetchMarketMoverStatus();
    setUserTickets(user?.tickets || 0);
  }, [user]);

  const fetchMarketMoverStatus = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/market-mover/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMarketMoverData({
          votingActive: data.votingActive || false,
          leaderboard: data.leaderboard || [],
          currentBidUpPlayer: data.currentBidUpPlayer,
          nextVoteTime: data.nextVoteTime
        });
      } else {
        throw new Error('Failed to fetch MarketMover status');
      }
    } catch (error) {
      console.error('Error fetching market mover status:', error);
      setError('Unable to load MarketMover data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (player, newTicketCount) => {
    try {
      if (newTicketCount !== undefined) {
        setUserTickets(newTicketCount);
        // Update user in Redux store if needed
        // dispatch(updateUserTickets(newTicketCount));
      }
      
      // Refresh status to show updated leaderboard
      await fetchMarketMoverStatus();
    } catch (error) {
      console.error('Error processing vote:', error);
    }
  };

  const handleOwnershipQuery = async (newTicketCount) => {
    try {
      if (newTicketCount !== undefined) {
        setUserTickets(newTicketCount);
      }
    } catch (error) {
      console.error('Error processing ownership query:', error);
    }
  };

  const formatTimeRemaining = (endTime) => {
    if (!endTime) return 'Unknown';
    
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getVotingStatusDisplay = () => {
    if (marketMoverData.votingActive) {
      return {
        text: 'VOTING ACTIVE',
        className: 'status-active',
        icon: '🗳️'
      };
    } else {
      return {
        text: 'VOTING CLOSED',
        className: 'status-inactive',
        icon: '🔒'
      };
    }
  };

  const votingStatus = getVotingStatusDisplay();

  if (loading) {
    return (
      <div className="market-mover-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading MarketMover...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="market-mover-page">
      <div className="page-header">
        <h1>📈 Market Mover Hub</h1>
        <p className="page-subtitle">
          Vote for players, check ownership data, and influence the market!
        </p>
        <div className="user-ticket-display">
          <span className="ticket-balance">Your Tickets: {userTickets} 🎟️</span>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={fetchMarketMoverStatus} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {/* Voting Status Section */}
      <div className="voting-status-section">
        <div className={`status-card ${votingStatus.className}`}>
          <div className="status-header">
            <span className="status-icon">{votingStatus.icon}</span>
            <h2>{votingStatus.text}</h2>
            {marketMoverData.votingActive && <span className="pulse-dot"></span>}
          </div>
          {marketMoverData.nextVoteTime && (
            <p className="status-time">
              {marketMoverData.votingActive 
                ? `Voting ends in: ${formatTimeRemaining(marketMoverData.nextVoteTime)}`
                : `Next voting period: ${new Date(marketMoverData.nextVoteTime).toLocaleString()}`
              }
            </p>
          )}
        </div>
      </div>

      {/* Current BID UP Player */}
      {marketMoverData.currentBidUpPlayer && (
        <div className="bid-up-section">
          <div className="bid-up-card">
            <h3>🔥 Current BID UP Player</h3>
            <div className="bid-up-content">
              <div className="player-info">
                <span className="player-name">{marketMoverData.currentBidUpPlayer.name}</span>
                <span className="boost-badge">
                  +{marketMoverData.currentBidUpPlayer.boostPercentage}% Appearance Rate
                </span>
              </div>
              {marketMoverData.currentBidUpPlayer.endsAt && (
                <div className="time-remaining">
                  Ends in: {formatTimeRemaining(marketMoverData.currentBidUpPlayer.endsAt)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Cards */}
      <div className="actions-section">
        <h2>Available Actions</h2>
        <div className="action-cards">
          <div 
            className={`action-card vote-card ${
              !marketMoverData.votingActive || userTickets < 1 ? 'disabled' : ''
            }`}
            onClick={() => marketMoverData.votingActive && userTickets >= 1 && setShowVoteModal(true)}
          >
            <div className="card-icon">🗳️</div>
            <h3>Vote for BID UP</h3>
            <p>Vote for the next player to get a 35% appearance boost</p>
            <div className="card-cost">
              {marketMoverData.votingActive 
                ? (userTickets >= 1 ? 'Cost: 1 🎟️' : 'Need 1 🎟️')
                : 'Voting Closed'
              }
            </div>
            {!marketMoverData.votingActive && (
              <div className="disabled-overlay">
                <span>Voting Closed</span>
              </div>
            )}
          </div>

          <div 
            className={`action-card ownership-card ${userTickets < 1 ? 'disabled' : ''}`}
            onClick={() => userTickets >= 1 && setShowOwnershipModal(true)}
          >
            <div className="card-icon">📊</div>
            <h3>Check Ownership</h3>
            <p>See what percentage of lineups contain a specific player</p>
            <div className="card-cost">
              {userTickets >= 1 ? 'Cost: 1 🎟️' : 'Need 1 🎟️'}
            </div>
            {userTickets < 1 && (
              <div className="disabled-overlay">
                <span>Need Tickets</span>
              </div>
            )}
          </div>

          <div className="action-card shop-card">
            <div className="card-icon">🎟️</div>
            <h3>Buy Tickets</h3>
            <p>Purchase tickets to use MarketMover features</p>
            <div className="card-cost">Various Packages</div>
          </div>
        </div>
      </div>

      {/* Vote Leaderboard */}
      {marketMoverData.leaderboard && marketMoverData.leaderboard.length > 0 && (
        <div className="leaderboard-section">
          <h2>🏆 Current Vote Leaders</h2>
          <div className="leaderboard-card">
            <div className="leaderboard-list">
              {marketMoverData.leaderboard.slice(0, 10).map((leader, index) => (
                <div key={index} className={`leader-row ${index < 3 ? 'top-three' : ''}`}>
                  <span className={`rank rank-${index + 1}`}>#{index + 1}</span>
                  <span className="player-name">{leader.name}</span>
                  <span className="vote-count">{leader.votes} votes</span>
                </div>
              ))}
            </div>
            {marketMoverData.leaderboard.length === 0 && marketMoverData.votingActive && (
              <div className="no-votes">
                <p>No votes cast yet. Be the first to vote!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* How It Works Section */}
      <div className="how-it-works-section">
        <h2>How Market Mover Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h4>Vote for Players</h4>
            <p>Use 1 ticket to vote for a player every 6 hours</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h4>Player Gets Boosted</h4>
            <p>Winner gets 35% higher appearance in contests</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h4>Check Ownership</h4>
            <p>Use tickets to see ownership percentages</p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h4>Gain Advantage</h4>
            <p>Use data to make better draft decisions</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <VoteModal
        isOpen={showVoteModal}
        onClose={() => setShowVoteModal(false)}
        onVote={handleVote}
        tickets={userTickets}
        currentLeaders={marketMoverData.leaderboard}
      />

      <OwnershipModal
        isOpen={showOwnershipModal}
        onClose={() => setShowOwnershipModal(false)}
        onQuery={handleOwnershipQuery}
        tickets={userTickets}
      />
    </div>
  );
};

export default MarketMoverPage;