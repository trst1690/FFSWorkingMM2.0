// frontend/src/components/Landing/LandingPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [marketMoverDemo, setMarketMoverDemo] = useState({
    currentBidUpPlayer: null,
    topVotes: [],
    votingActive: false
  });

  useEffect(() => {
    // Try to fetch public MarketMover data for demo
    fetchPublicMarketMoverData();
  }, []);

  const fetchPublicMarketMoverData = async () => {
    try {
      // Try to get public status (this might work without auth for demo purposes)
      const response = await fetch('/api/market-mover/status');
      
      if (response.ok) {
        const data = await response.json();
        setMarketMoverDemo({
          currentBidUpPlayer: data.currentBidUpPlayer,
          topVotes: data.leaderboard?.slice(0, 3) || [],
          votingActive: data.votingActive || false
        });
      } else {
        // Fallback demo data
        setMarketMoverDemo({
          currentBidUpPlayer: { name: 'Josh Allen', boostPercentage: 35 },
          topVotes: [
            { name: 'Christian McCaffrey', votes: 127 },
            { name: 'Cooper Kupp', votes: 89 },
            { name: 'Travis Kelce', votes: 76 }
          ],
          votingActive: true
        });
      }
    } catch (error) {
      console.log('Using demo data for landing page');
      // Demo data for showcase
      setMarketMoverDemo({
        currentBidUpPlayer: { name: 'Josh Allen', boostPercentage: 35 },
        topVotes: [
          { name: 'Christian McCaffrey', votes: 127 },
          { name: 'Cooper Kupp', votes: 89 },
          { name: 'Travis Kelce', votes: 76 }
        ],
        votingActive: true
      });
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0e1b 0%, #1a1f2e 100%)',
      color: '#ffffff'
    }}>
      {/* Hero Section */}
      <div style={{ 
        textAlign: 'center', 
        padding: '4rem 2rem',
        background: 'linear-gradient(180deg, rgba(0, 191, 255, 0.1) 0%, transparent 100%)'
      }}>
        <h1 style={{ 
          fontSize: '4rem', 
          fontWeight: '900',
          marginBottom: '1rem',
          background: 'linear-gradient(45deg, #00bfff, #4ade80)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Fantasy Fire Sale
        </h1>
        <p style={{ 
          fontSize: '1.5rem', 
          color: '#94a3b8', 
          marginBottom: '3rem',
          letterSpacing: '2px'
        }}>
          Draft. Vote. Influence. Win.
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem', 
          justifyContent: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap'
        }}>
          <Link to="/register" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '1rem 2.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              border: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(45deg, #00bfff, #0099cc)',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 4px 15px rgba(0, 191, 255, 0.3)'
            }}>
              Start Playing Free
            </button>
          </Link>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button style={{
              padding: '1rem 2.5rem',
              fontSize: '1.1rem',
              fontWeight: '600',
              background: 'transparent',
              color: '#00bfff',
              border: '2px solid #00bfff',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}>
              Login
            </button>
          </Link>
        </div>
      </div>

      {/* MarketMover Preview Section */}
      <div style={{ 
        padding: '4rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{ 
          textAlign: 'center',
          fontSize: '2.5rem',
          marginBottom: '1rem',
          color: '#00d4ff'
        }}>
          🔥 Introducing Market Mover
        </h2>
        <p style={{
          textAlign: 'center',
          fontSize: '1.2rem',
          color: '#8892b0',
          marginBottom: '3rem',
          maxWidth: '600px',
          margin: '0 auto 3rem'
        }}>
          The first fantasy platform where YOU control the player pool. 
          Vote for players to boost their appearance rates and gain competitive intelligence.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {/* Current BID UP Player */}
          {marketMoverDemo.currentBidUpPlayer && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(255, 170, 68, 0.1), rgba(255, 140, 0, 0.1))',
              border: '2px solid #ffd700',
              borderRadius: '16px',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <h3 style={{ color: '#ffd700', marginBottom: '1rem' }}>
                🔥 Current BID UP Player
              </h3>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#fff',
                marginBottom: '0.5rem'
              }}>
                {marketMoverDemo.currentBidUpPlayer.name}
              </div>
              <div style={{
                background: '#ffd700',
                color: '#1a1a2e',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                display: 'inline-block',
                fontWeight: 'bold'
              }}>
                +{marketMoverDemo.currentBidUpPlayer.boostPercentage}% Appearance Rate
              </div>
            </div>
          )}

          {/* Vote Leaders */}
          {marketMoverDemo.topVotes.length > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <h3 style={{ 
                color: '#00d4ff', 
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                🏆 Vote Leaders
              </h3>
              {marketMoverDemo.topVotes.map((leader, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: index < marketMoverDemo.topVotes.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none'
                }}>
                  <span style={{ color: '#ffffff', fontWeight: '500' }}>
                    #{index + 1} {leader.name}
                  </span>
                  <span style={{ color: '#4ade80', fontWeight: 'bold' }}>
                    {leader.votes} votes
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Voting Status */}
          <div style={{
            background: 'rgba(68, 255, 68, 0.1)',
            border: '2px solid #44ff44',
            borderRadius: '16px',
            padding: '2rem',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '2rem' }}>🗳️</span>
              <h3 style={{ color: '#44ff44', margin: 0 }}>
                {marketMoverDemo.votingActive ? 'VOTING ACTIVE' : 'VOTING CLOSED'}
              </h3>
              {marketMoverDemo.votingActive && (
                <div style={{
                  width: '10px',
                  height: '10px',
                  background: '#44ff44',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }}></div>
              )}
            </div>
            <p style={{ color: '#8892b0', margin: 0 }}>
              Cast your vote every 6 hours to influence which players appear more often in contests!
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div style={{ 
        padding: '4rem 2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{ 
          textAlign: 'center',
          fontSize: '2.5rem',
          marginBottom: '3rem',
          color: '#ffffff'
        }}>
          Unique Game Features
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center',
            transition: 'all 0.3s'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#00bfff' }}>
              Cash Games
            </h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
              5-player winner-take-all contests with $5 entry fee. Fast-paced action with immediate payouts.
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📈</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#00bfff' }}>
              Market Mover
            </h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
              Vote for players and check ownership data. Influence the market and gain competitive intelligence.
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#00bfff' }}>
              Daily Tournaments
            </h3>
            <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
              Free entry tournaments with guaranteed prize pools. Compete against hundreds of players.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div style={{ 
        padding: '4rem 2rem',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <h2 style={{ 
          textAlign: 'center',
          fontSize: '2.5rem',
          marginBottom: '3rem',
          color: '#ffffff'
        }}>
          How It Works
        </h2>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          maxWidth: '1000px',
          margin: '0 auto',
          flexWrap: 'wrap'
        }}>
          {[
            { num: 1, title: 'Join a Contest', desc: 'Pick from cash games, tournaments, or Market Mover contests' },
            { num: 2, title: 'Draft Your Team', desc: 'Select 5 players within your $15 budget using our unique board' },
            { num: 3, title: 'Influence the Market', desc: 'Vote for BID UP players and check ownership data' },
            { num: 4, title: 'Compete & Win', desc: 'Score points and win prizes based on real player performance' }
          ].map((step) => (
            <div key={step.num} style={{
              flex: '1',
              minWidth: '200px',
              textAlign: 'center',
              padding: '2rem'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'linear-gradient(45deg, #00bfff, #4ade80)',
                color: '#1a1a2e',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 4px 15px rgba(0, 191, 255, 0.3)'
              }}>
                {step.num}
              </div>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#ffffff' }}>
                {step.title}
              </h3>
              <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ 
        textAlign: 'center', 
        padding: '4rem 2rem',
        background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%)'
      }}>
        <h2 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '1rem',
          color: '#00d4ff'
        }}>
          Ready to Start Playing?
        </h2>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#8892b0', 
          marginBottom: '2rem'
        }}>
          Join thousands of players in the most innovative fantasy platform ever created.
        </p>
        
        <Link to="/register" style={{ textDecoration: 'none' }}>
          <button style={{
            padding: '1.2rem 3rem',
            fontSize: '1.2rem',
            fontWeight: '700',
            border: 'none',
            borderRadius: '8px',
            background: 'linear-gradient(45deg, #00bfff, #0099cc)',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s',
            boxShadow: '0 6px 20px rgba(0, 191, 255, 0.4)'
          }}>
            Get Started - It's Free!
          </button>
        </Link>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(68, 255, 68, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(68, 255, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(68, 255, 68, 0); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;