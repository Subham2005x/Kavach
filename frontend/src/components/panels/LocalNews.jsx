import React, { useState, useEffect } from 'react';
import { Newspaper, ExternalLink, Calendar, TrendingUp } from 'lucide-react';

const LocalNews = ({ location }) => {
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      if (!location) {
        setNews([]);
        setLocationName('');
        return;
      }

      const lat = location?.coordinates?.lat || location?.lat;
      const lng = location?.coordinates?.lng || location?.lng;

      if (!lat || !lng) return;

      setIsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8000/local_news?lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        
        if (data.status === 'success') {
          setNews(data.news || []);
          setLocationName(data.location || 'Selected Area');
        }
      } catch (error) {
        console.error('News fetch error:', error);
        setNews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [location]);

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'Recent') return 'Recent';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div style={{
      background: 'rgba(30,41,59,0.6)',
      backdropFilter: 'blur(12px)',
      borderRadius: 12,
      padding: 16,
      border: '1px solid rgba(51,65,85,0.5)',
      maxHeight: 500,
      overflowY: 'auto'
    }}
    className="custom-scrollbar">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
          border-radius: 10px;
          border: 2px solid rgba(30, 41, 59, 0.6);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
      `}</style>
      
      <h3 style={{
        fontWeight: 600,
        color: '#f1f5f9',
        marginBottom: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 15,
        letterSpacing: '0.3px'
      }}>
        <Newspaper style={{ width: 18, height: 18, color: '#f59e0b' }} />
        Local Weather & Disaster News
        {isLoading && (
          <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>
            Loading...
          </span>
        )}
      </h3>

      {locationName && (
        <div style={{
          fontSize: 11,
          color: '#94a3b8',
          marginBottom: 12,
          paddingBottom: 12,
          borderBottom: '1px solid rgba(51,65,85,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <TrendingUp style={{ width: 12, height: 12, color: '#f59e0b' }} />
          News for {locationName}
        </div>
      )}

      {!location ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px 20px',
          color: '#64748b',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.3 }}>📰</div>
          <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '4px', color: '#94a3b8' }}>
            No Location Selected
          </div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Select a location to view local weather news
          </div>
        </div>
      ) : news.length === 0 && !isLoading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          color: '#64748b',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.3 }}>📰</div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px', color: '#94a3b8' }}>
            No news so far
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Stay informed about weather conditions in your area
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {news.map((article, index) => (
            <div key={index} style={{
              background: 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,42,0.4))',
              border: '1px solid rgba(51,65,85,0.5)',
              borderRadius: 10,
              padding: 14,
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30,41,59,0.6), rgba(15,23,42,0.5))';
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(30,41,59,0.4), rgba(15,23,42,0.4))';
              e.currentTarget.style.borderColor = 'rgba(51,65,85,0.5)';
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', lineHeight: 1.4, flex: 1 }}>
                  {article.title}
                </div>
              </div>
              
              {article.description && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#cbd5e1', 
                  lineHeight: 1.5, 
                  marginBottom: 10,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {article.description}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '10px', color: '#94a3b8' }}>
                  <span style={{ fontWeight: 600, color: '#f59e0b' }}>{article.source}</span>
                  <span>•</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar style={{ width: 10, height: 10 }} />
                    {formatDate(article.published_at)}
                  </div>
                </div>
                
                {article.url && article.url !== '#' && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 8px',
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))',
                      border: '1px solid rgba(59,130,246,0.3)',
                      borderRadius: 5,
                      color: '#60a5fa',
                      fontSize: '9px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.25))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(37,99,235,0.15))';
                    }}
                  >
                    Read More
                    <ExternalLink style={{ width: 8, height: 8 }} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default LocalNews;
