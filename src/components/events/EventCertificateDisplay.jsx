import { useState } from "react";

const goldGradient = "linear-gradient(135deg, #c9a84c 0%, #f5e07a 40%, #c9a84c 60%, #a07830 100%)";
const navyDark = "#0d1f3c";
const navyMid = "#1a3560";
const gold = "#c9a84c";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Dancing+Script:wght@600&family=Cormorant+Garamond:wght@300;400;600&display=swap');

  .cert-wrap {
    min-height: 100vh;
    background: #e8e0d0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    font-family: 'Cormorant Garamond', serif;
  }

  .cert-outer {
    position: relative;
    width: 820px;
    max-width: 100%;
    background: #fafaf5;
    border-radius: 4px;
    box-shadow: 0 20px 80px rgba(0,0,0,0.3), 0 0 0 2px ${gold};
    overflow: hidden;
  }

  /* Corner waves - top */
  .wave-top {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 110px;
    overflow: hidden;
    z-index: 1;
  }
  .wave-top svg { width: 100%; height: 100%; }

  /* Corner waves - bottom */
  .wave-bottom {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 110px;
    overflow: hidden;
    z-index: 1;
  }
  .wave-bottom svg { width: 100%; height: 100%; }

  /* Gold decorative corners */
  .corner {
    position: absolute;
    width: 60px;
    height: 60px;
    z-index: 3;
  }
  .corner-tr { top: 8px; right: 8px; }
  .corner-bl { bottom: 8px; left: 8px; }

  /* Content */
  .cert-content {
    position: relative;
    z-index: 2;
    padding: 50px 70px 45px;
    text-align: center;
  }

  /* Medal */
  .medal-wrap {
    position: absolute;
    top: 18px;
    left: 42px;
    z-index: 5;
    width: 80px;
  }
  .medal-ribbon {
    display: flex;
    justify-content: center;
    gap: 2px;
    margin-bottom: -4px;
  }
  .ribbon-stripe {
    width: 14px;
    height: 28px;
    clip-path: polygon(0 0, 100% 0, 100% 80%, 50% 100%, 0 80%);
  }
  .medal-circle {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: ${goldGradient};
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.4);
    border: 3px solid #a07830;
  }
  .medal-inner {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: ${goldGradient};
    border: 2px solid rgba(255,255,255,0.35);
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);
  }

  /* Title */
  .cert-title {
    font-family: 'Playfair Display', serif;
    font-size: 42px;
    font-weight: 700;
    letter-spacing: 8px;
    color: ${navyDark};
    margin: 0 0 4px;
    text-transform: uppercase;
  }
  .cert-subtitle {
    font-size: 14px;
    letter-spacing: 5px;
    color: ${gold};
    text-transform: uppercase;
    font-weight: 600;
    margin: 0 0 32px;
  }

  .cert-presented {
    font-size: 17px;
    color: #555;
    font-style: italic;
    margin: 0 0 8px;
    font-weight: 300;
  }

  .cert-name {
    font-family: 'Dancing Script', cursive;
    font-size: 52px;
    color: ${gold};
    margin: 0 0 2px;
    line-height: 1.15;
  }

  .cert-line {
    width: 70%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #c9a84c, transparent);
    margin: 0 auto 28px;
  }

  .cert-body {
    font-size: 16px;
    color: #444;
    line-height: 1.7;
    max-width: 500px;
    margin: 0 auto 40px;
    font-weight: 300;
  }

  .cert-signatories {
    display: flex;
    justify-content: center;
    gap: 80px;
    margin-top: 8px;
  }

  .signatory {
    text-align: center;
  }
  .signatory-name {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    font-weight: 700;
    color: ${navyDark};
    margin: 0;
  }
  .signatory-role {
    font-size: 13px;
    color: #777;
    margin: 2px 0 0;
    font-weight: 300;
  }

  /* Corner ornament SVG */
  .ornament path { fill: ${gold}; }

  /* Edit mode */
  .edit-btn {
    margin-top: 28px;
    padding: 10px 28px;
    background: ${navyDark};
    color: #f5e07a;
    border: none;
    border-radius: 2px;
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
    transition: background 0.2s;
  }
  .edit-btn:hover { background: ${navyMid}; }

  .editable {
    background: rgba(201,168,76,0.08);
    border: 1px dashed ${gold};
    border-radius: 2px;
    outline: none;
    width: 100%;
    text-align: center;
    font-family: 'Dancing Script', cursive;
    font-size: 52px;
    color: ${gold};
    line-height: 1.15;
    resize: none;
    padding: 2px 6px;
    box-sizing: border-box;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }
  .editable:focus {
    background: rgba(201,168,76,0.12);
    border-color: ${gold};
    box-shadow: 0 0 4px rgba(201,168,76,0.3);
  }
  .editable-name {
    font-family: 'Dancing Script', cursive;
    font-size: 52px;
    color: ${gold};
    line-height: 1.15;
  }
`;

const OrnamentCorner = () => (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.85">
      <path d="M2 2 L58 2 L58 6 L6 6 L6 58 L2 58 Z" fill={gold} />
      <path d="M2 2 L18 2 L2 18 Z" fill={gold} />
      <circle cx="30" cy="30" r="8" fill="none" stroke={gold} strokeWidth="1.5"/>
      <circle cx="30" cy="30" r="4" fill={gold} opacity="0.5"/>
      <path d="M30 20 L32 28 L30 26 L28 28 Z" fill={gold}/>
      <path d="M40 30 L32 32 L34 30 L32 28 Z" fill={gold}/>
      <path d="M30 40 L28 32 L30 34 L32 32 Z" fill={gold}/>
      <path d="M20 30 L28 28 L26 30 L28 32 Z" fill={gold}/>
    </g>
  </svg>
);

export default function EventCertificateDisplay({ certificate }) {
  // Get logged-in user name from localStorage (same as dashboard)
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const participantName = userData?.name || "Participant";
  
  // Get data from database
  const eventTitle = certificate?.event?.title || "Event";
  const eventDate = new Date(certificate?.event?.eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const certificateNumber = certificate?.certificateNumber || "";
  const templateType = certificate?.templateType === 'winner' ? 'Winner' :
                       certificate?.templateType === 'runner_up' ? 'Runner-Up' :
                       certificate?.templateType === 'excellence' ? 'Excellence' : 'Participation';

  const getCertificateMessage = () => {
    switch (certificate?.templateType) {
      case 'winner':
        return `For securing first place and demonstrating exceptional excellence in ${eventTitle}. This outstanding achievement reflects dedication, skill, and a commitment to excellence.`;
      case 'runner_up':
        return `For securing second place and demonstrating remarkable excellence in ${eventTitle}. This achievement reflects dedication, skill, and a commitment to excellence.`;
      case 'excellence':
        return `For demonstrating outstanding excellence, integrity, and exceptional performance throughout ${eventTitle}.`;
      default:
        return `For outstanding dedication and participation in demonstrating excellence, integrity, and a commitment to growth throughout the duration of this distinguished program.`;
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="cert-wrap">
        <div className="cert-outer">
          {/* Top wave */}
          <div className="wave-top">
            <svg viewBox="0 0 820 110" preserveAspectRatio="none">
              <path d="M0 0 L820 0 L820 60 Q650 110 410 70 Q200 35 0 90 Z" fill={navyDark}/>
              <path d="M0 0 L820 0 L820 55 Q650 100 410 62 Q200 28 0 82 Z" fill={navyMid} opacity="0.6"/>
              <path d="M0 55 Q200 20 410 56 Q650 92 820 42 L820 62 Q650 112 410 76 Q200 40 0 75 Z" fill={gold} opacity="0.55"/>
            </svg>
          </div>

          {/* Bottom wave */}
          <div className="wave-bottom">
            <svg viewBox="0 0 820 110" preserveAspectRatio="none">
              <path d="M0 110 L820 110 L820 20 Q620 80 410 40 Q200 5 0 50 Z" fill={navyDark}/>
              <path d="M0 110 L820 110 L820 26 Q620 86 410 46 Q200 11 0 56 Z" fill={navyMid} opacity="0.6"/>
              <path d="M0 60 Q200 110 410 70 Q620 30 820 90 L820 72 Q620 12 410 52 Q200 92 0 42 Z" fill={gold} opacity="0.55"/>
            </svg>
          </div>

          {/* Corners */}
          <div className="corner corner-tr"><OrnamentCorner /></div>
          <div className="corner corner-bl" style={{ transform: "rotate(180deg)" }}><OrnamentCorner /></div>

          {/* Medal */}
          <div className="medal-wrap">
            <div className="medal-ribbon">
              <div className="ribbon-stripe" style={{ background: navyDark }}/>
              <div className="ribbon-stripe" style={{ background: gold }}/>
              <div className="ribbon-stripe" style={{ background: navyDark }}/>
            </div>
            <div className="medal-circle">
              <div className="medal-inner"/>
            </div>
          </div>

          {/* Main content */}
          <div className="cert-content">
            <p className="cert-title">Certificate</p>
            <p className="cert-subtitle">of {templateType}</p>

            <p className="cert-presented">This certificate is proudly presented to</p>

            <p className="cert-name">
              <span className="editable-name">{participantName}</span>
            </p>
            <div className="cert-line"/>

            <p className="cert-body">
              {getCertificateMessage()}
            </p>

            <div className="cert-signatories">
              <div className="signatory">
                <p className="signatory-name">Coding Nexus</p>
                <p className="signatory-role">Event Organizers</p>
              </div>
              <div className="signatory">
                <p className="signatory-name">{eventDate}</p>
                <p className="signatory-role">Date of Issue</p>
              </div>
            </div>

            {certificateNumber && (
              <div style={{ marginTop: '20px', fontSize: '13px', color: '#777' }}>
                Certificate #: {certificateNumber}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
