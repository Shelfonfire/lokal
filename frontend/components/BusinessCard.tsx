'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Business } from '@/types/business';
import BusinessFeatureBadge from './BusinessFeatureBadge';

interface BusinessCardProps {
  business: Business;
  variant?: 'full' | 'compact';
  onExternalLink?: (url: string, destination: string) => void;
}

export default function BusinessCard({ business, variant = 'compact', onExternalLink }: BusinessCardProps) {
  const isCompact = variant === 'compact';
  const [showOpeningHours, setShowOpeningHours] = useState(false);

  // Generate logo placeholder if no logo provided
  const logoUrl = business.logo || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23C86B4B'/%3E%3Ctext x='50' y='70' font-size='60' text-anchor='middle' fill='white' font-weight='bold'%3E${business.name.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;

  const handleLinkClick = (e: React.MouseEvent, url: string, destination: string) => {
    if (onExternalLink) {
      e.preventDefault();
      onExternalLink(url, destination);
    }
  };

  return (
    <article className={`business-card ${isCompact ? 'compact' : ''}`}>
      {/* Feature Badges - Hanging from top right */}
      {business.features && business.features.length > 0 && (
        <div className="feature-badges-container">
          {business.features.map((feature, idx) => (
            <BusinessFeatureBadge 
              key={`${feature.key}-${idx}`} 
              feature={feature} 
            />
          ))}
        </div>
      )}

      {/* Verified Badge */}
      {business.isVerified && (
        <div className="verified-badge" aria-label="Verified business">
          ✓
        </div>
      )}

      {/* Header with Logo */}
      <div className="card-header">
        <img 
          src={logoUrl} 
          alt={`${business.name} logo`} 
          className="business-logo"
          loading="lazy"
        />
      </div>

      {/* Main Content */}
      <div className="card-content">
        {/* Title Section */}
        <div className="business-title">
          <h2 className="business-name">{business.name}</h2>
          {business.category && (
            <span className="category-badge">{business.category}</span>
          )}
        </div>

        {/* Description */}
        {business.description && (
          <p className="business-description">{business.description}</p>
        )}

        {/* Impact Metrics Section - Only show in full variant */}
        {!isCompact && business.impactMetrics && (
          <div className="impact-section">
            <div className="section-label">Sustainability Impact</div>
            <div className="metrics-grid">
              {business.impactMetrics.carbonSaved && (
                <div className="metric-item">
                  <span className="metric-label">Carbon Saved</span>
                  <span className="metric-value">{business.impactMetrics.carbonSaved}</span>
                </div>
              )}
              {business.impactMetrics.localSourcing && (
                <div className="metric-item">
                  <span className="metric-label">Local Sourcing</span>
                  <span className="metric-value">{business.impactMetrics.localSourcing}</span>
                </div>
              )}
              {business.impactMetrics.wasteReduction && (
                <div className="metric-item">
                  <span className="metric-label">Waste Reduction</span>
                  <span className="metric-value">{business.impactMetrics.wasteReduction}</span>
                </div>
              )}
              {business.impactMetrics.renewableEnergy && (
                <div className="metric-item">
                  <span className="metric-label">Renewable Energy</span>
                  <span className="metric-value">{business.impactMetrics.renewableEnergy}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Opening Hours Button - Bottom right */}
        {business.openingHours && business.openingHours.length > 0 && (
          <>
            <button
              className="opening-hours-button"
              onClick={(e) => {
                e.stopPropagation();
                setShowOpeningHours(!showOpeningHours);
              }}
              aria-label="View opening hours"
            >
              opening hours
            </button>
            
            {/* Opening Hours Popup - To the right of card, bottom aligned */}
            {showOpeningHours && (
              <div 
                className="opening-hours-popup"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="opening-hours-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOpeningHours(false);
                  }}
                  aria-label="Close opening hours"
                >
                  ×
                </button>
                <table className="hours-table">
                  <tbody>
                    {business.openingHours.map((hours, idx) => (
                      <tr key={idx}>
                        <td className="hours-day">{hours.day.slice(0, 3)}</td>
                        <td className="hours-time">{hours.start} - {hours.end}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Social Links - Always show all 4 icons at bottom */}
        <div className="social-links">
          {/* Facebook */}
          {business.socialLinks?.facebook ? (
            <a 
              href={business.socialLinks.facebook} 
              className="social-link" 
              title="Facebook"
              aria-label="Visit Facebook"
              onClick={(e) => handleLinkClick(e, business.socialLinks!.facebook!, 'Facebook profile')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/icons/socials/facebook-colour.png"
                alt="Facebook"
                width={16}
                height={16}
                className="social-icon social-icon-colour"
              />
            </a>
          ) : (
            <div className="social-link-disabled" title="Facebook">
              <Image
                src="/icons/socials/facebook-bw.png"
                alt="Facebook"
                width={16}
                height={16}
                className="social-icon"
              />
            </div>
          )}
          
          {/* Instagram */}
          {business.socialLinks?.instagram ? (
            <a 
              href={business.socialLinks.instagram} 
              className="social-link" 
              title="Instagram"
              aria-label="Visit Instagram"
              onClick={(e) => handleLinkClick(e, business.socialLinks!.instagram!, 'Instagram profile')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/icons/socials/insta-colour.jpg"
                alt="Instagram"
                width={16}
                height={16}
                className="social-icon social-icon-colour"
              />
            </a>
          ) : (
            <div className="social-link-disabled" title="Instagram">
              <Image
                src="/icons/socials/insta-bw.png"
                alt="Instagram"
                width={16}
                height={16}
                className="social-icon"
              />
            </div>
          )}
          
          {/* X (Twitter) */}
          {business.socialLinks?.twitter ? (
            <a 
              href={business.socialLinks.twitter} 
              className="social-link" 
              title="X (Twitter)"
              aria-label="Visit X (Twitter)"
              onClick={(e) => handleLinkClick(e, business.socialLinks!.twitter!, 'X profile')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/icons/socials/X.webp"
                alt="X (Twitter)"
                width={16}
                height={16}
                className="social-icon social-icon-colour"
              />
            </a>
          ) : (
            <div className="social-link-disabled" title="X (Twitter)">
              <Image
                src="/icons/socials/X.webp"
                alt="X (Twitter)"
                width={16}
                height={16}
                className="social-icon"
                style={{ opacity: 0.4 }}
              />
            </div>
          )}
          
          {/* TikTok */}
          {business.socialLinks?.tiktok ? (
            <a 
              href={business.socialLinks.tiktok} 
              className="social-link" 
              title="TikTok"
              aria-label="Visit TikTok"
              onClick={(e) => handleLinkClick(e, business.socialLinks!.tiktok!, 'TikTok profile')}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src="/icons/socials/tiktok-colour-v2.png"
                alt="TikTok"
                width={16}
                height={16}
                className="social-icon social-icon-colour"
              />
            </a>
          ) : (
            <div className="social-link-disabled" title="TikTok">
              <Image
                src="/icons/socials/tiktok-colour.webp"
                alt="TikTok"
                width={16}
                height={16}
                className="social-icon"
                style={{ opacity: 0.4 }}
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
