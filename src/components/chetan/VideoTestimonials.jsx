import { useRef, useState, useEffect } from 'react';
import { Star, Sparkles, Play, Pause, Volume2, VolumeX, Trophy } from 'lucide-react';

// ─── Testimonial video data ───
const testimonials = [
  {
    id: 1,
    src: "https://res.cloudinary.com/dx8lkofkl/video/upload/v1774289836/Copy_of_video_20260225_150241_1_j2wlsj.mp4",
    caseNumber: "01",
    name: "Ojus Walke",
    role: "CSE-AIML · 2nd Year · APSIT",
 tag: "Web Bootcamp Winner",    tagColor: "from-purple-500 to-pink-500",
    title: "From Learning Web to Winning Hackathons",
    description:
  "After attending the Coding Nexus Web Bootcamp, I understood how a real web project works — from UI design to backend logic and API integration. This practical understanding helped me build a complete working project during the hackathon, and that’s what helped our team win.",
    achievement: "Winner – Coding Nexus Web Bootcamp Hackathon",
    stars: 5,
    accentColor: "#a855f7",
    accentGlow: "rgba(168,85,247,0.4)",
  },
  {
    id: 2,
  src: "https://res.cloudinary.com/dx8lkofkl/video/upload/v1774288579/WhatsApp_Video_2026-03-23_at_11.23.35_PM_q5fasy.mp4",
  images: ["https://res.cloudinary.com/dx8lkofkl/image/upload/v1774293138/WhatsApp_Image_2026-03-12_at_6.39.27_PM_hyackb.jpg",
    "https://res.cloudinary.com/dx8lkofkl/image/upload/v1774283177/Java_Byte_Challenge_1_2_zv1qci.png",

    "https://res.cloudinary.com/dx8lkofkl/image/upload/v1774293113/IMG_20260318_164547_bzqywd.jpg",
    "https://res.cloudinary.com/dx8lkofkl/image/upload/v1774289420/WhatsApp_Image_2026-03-23_at_9.52.38_PM_oy9muw.jpg",
    "https://res.cloudinary.com/dx8lkofkl/image/upload/v1774288712/WhatsApp_Image_2026-03-20_at_10.35.41_AM_wt0tje.jpg",
  ],
    caseNumber: "02",
  name: "Java Byte Challenge",
  role: "Live Coding Event · Coding Nexus",
  tag: "System Stress Test",
  tagColor: "from-green-500 to-emerald-500",
  title: "Handling 130+ Concurrent Coders",
    description:
    "During the Java Byte Challenge on March 12, Coding Nexus successfully handled over 130 students simultaneously writing, compiling, and running Java code on the platform. The system remained stable under heavy load, proving the strength of the backend architecture and real-time code execution system built for large-scale coding events.",
  achievement: "130+ Concurrent Users Successfully Supported",
    stars: 5,
  accentColor: "#10b981",
  accentGlow: "rgba(16,185,129,0.4)",
  link: "https://codingnexus.apsit.edu.in/"
  },
  {
    id: 3,
  src: "https://res.cloudinary.com/dx8lkofkl/video/upload/v1774283484/WhatsApp_Video_2026-03-19_at_3.10.59_PM_k208t1.mp4",
    caseNumber: "03",
  name: "Git & GitHub Hands-On Session",
  role: "Technical Workshop · Coding Nexus",
  tag: "Developer Tools",
  tagColor: "from-blue-500 to-indigo-500",
  title: "Learning Version Control & Collaboration",
    description:
    "Coding Nexus conducted a hands-on Git & GitHub session for SE students where they learned Git basics, essential commands, and real developer workflows. The event also included an interactive quiz hosted on our Coding Nexus portal.",
  achievement: "Successful Technical Workshop for SE Students",
    stars: 5,
  accentColor: "#3b82f6",
  accentGlow: "rgba(59,130,246,0.4)"
}
];

// ─── Clamp helper ───
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// ─── Detect if a URL is an image (PNG, JPG, WEBP, GIF, etc.) ───
const isImageUrl = (url = '') => /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(url);

// ─── Auto-scrolling Image Carousel ───
const ImageCarousel = ({ images, accentColor, isActive }) => {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const timerRef = useRef(null);

  // Auto-advance every 2.5s only when the card is active
  useEffect(() => {
    if (!isActive || images.length <= 1) return;
    timerRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent(c => (c + 1) % images.length);
        setFading(false);
      }, 300); // fade-out duration before switching
    }, 2500);
    return () => clearInterval(timerRef.current);
  }, [isActive, images.length]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Image with fade transition */}
      <img
        key={current}
        src={images[current]}
        alt={`slide-${current}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          background: '#0a0a0a',
          display: 'block',
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Dot indicators */}
      <div style={{
        position: 'absolute',
        bottom: '0.6rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '6px',
        zIndex: 10,
      }}>
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => { setFading(true); setTimeout(() => { setCurrent(i); setFading(false); }, 300); }}
            style={{
              width: i === current ? 20 : 8,
              height: 8,
              borderRadius: 4,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: i === current ? accentColor : 'rgba(255,255,255,0.3)',
              boxShadow: i === current ? `0 0 8px ${accentColor}` : 'none',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div style={{
        position: 'absolute',
        top: '0.6rem',
        right: '0.7rem',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${accentColor}44`,
        color: '#fff',
        fontSize: '0.65rem',
        fontWeight: 700,
        letterSpacing: '0.08em',
        padding: '0.2rem 0.55rem',
        borderRadius: '999px',
        zIndex: 10,
      }}>
        {current + 1} / {images.length}
      </div>
    </div>
  );
};

// ─── Individual Video Card ───
const VideoCard = ({ testimonial, scrollProgress, index, total }) => {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);

  // Each card "owns" 1/total of the scroll range
  const segmentSize = 1 / total;
  const segStart = index * segmentSize;
  const segEnd = (index + 1) * segmentSize;

  // Within the card's segment: 0 → entering, 1 → leaving
  const localProgress = clamp((scrollProgress - segStart) / segmentSize, 0, 1);

  // ── Slide-in from bottom (entering phase: 0..0.15 of segment)
  const enterPhase = clamp(localProgress / 0.15, 0, 1);

  // ── Slide-out upward (leaving phase: 0.85..1.0 of segment)
  const exitPhase = clamp((localProgress - 0.85) / 0.15, 0, 1);

  // Before this card's segment → card waits below screen
  // During segment → card is centred (entering → then steady → then exiting up)
  // After segment → card is gone above (hidden by next card overlapping)
  let translateY, opacity, scale, zIndex;

  if (scrollProgress < segStart) {
    // Not yet — wait below the viewport
    const preProgress = clamp((scrollProgress - (segStart - segmentSize)) / segmentSize, 0, 1);
    translateY = `${100 - preProgress * 0}%`; // stays at 100% until its turn
    // Specifically: card sits completely off-screen below
    translateY = '100%';
    opacity = 0;
    scale = 0.92;
    zIndex = index + 1;
  } else if (scrollProgress >= segEnd) {
    // Done — card has been scrolled past; pushed above and hidden
    translateY = '-8%';
    opacity = 0;
    scale = 0.95;
    zIndex = index + 1;
  } else {
    // Active segment
    // enterPhase: 0→1 during first 15% of segment (slides in from bottom)
    // exitPhase: 0→1 during last 15% of segment (slides off top)
    const inY  = (1 - enterPhase) * 100; // 100% → 0%
    const outY = exitPhase * -8;          // 0% → -8% (subtle upward drift)
    translateY = `${inY + outY}%`;
    opacity = enterPhase * (1 - exitPhase * 0.8);
    scale = 0.92 + enterPhase * 0.08 - exitPhase * 0.04;
    zIndex = index + 10; // active card always on top
  }

  const isActive = scrollProgress >= segStart && scrollProgress < segEnd;

  const isImage = isImageUrl(testimonial.src);

  // Auto-play / pause based on active state (video only)
  useEffect(() => {
    if (isImage || !videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive, isImage]);

  const togglePlay = () => {
    if (isImage || !videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  return (
    <div
      className="vt-card"
      style={{
        transform: `translateY(${translateY}) scale(${scale})`,
        opacity,
        zIndex,
        pointerEvents: isActive ? 'auto' : 'none',
        // No CSS transition — driven purely by scroll for smoothness
      }}
    >
      <div className="vt-card-inner">
        {/* LEFT — video */}
        <div className="vtc-video-col">
          <div
            className="vtc-video-wrap"
            style={{ boxShadow: `0 30px 80px rgba(0,0,0,0.7), 0 0 0 1px ${testimonial.accentColor}33, 0 0 60px ${testimonial.accentGlow}` }}
          >
            {/* Carousel / single image / video — priority: images[] > single img > video */}
            {testimonial.images && testimonial.images.length > 0 ? (
              // Multi-image auto-scrolling carousel
              <ImageCarousel
                images={testimonial.images}
                accentColor={testimonial.accentColor}
                isActive={isActive}
              />
            ) : isImage ? (
              // Single static image
              <img
                src={testimonial.src}
                alt={testimonial.name}
                className="vtc-video"
                style={{ objectFit: 'contain', background: '#0a0a0a' }}
              />
            ) : (
              // Video
            <video
              ref={videoRef}
              src={testimonial.src}
              autoPlay
              loop
              muted={muted}
              playsInline
              className="vtc-video"
            />
            )}
            {/* Gradient overlay — only for videos */}
            {!isImage && !testimonial.images && <div className="vtc-overlay" />}

            {/* Controls bar — play/mute hidden for images */}
            <div className="vtc-controls">
              {!isImage && (
              <div className="vtc-btns">
                <button className="vtc-btn" onClick={togglePlay}>
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button className="vtc-btn" onClick={() => setMuted(m => !m)}>
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              )}
              {isImage && <div />}{/* spacer to keep tag right-aligned */}
              <div
                className="vtc-tag"
                style={{
                  background: `linear-gradient(135deg, ${testimonial.accentColor}33, ${testimonial.accentColor}11)`,
                  borderColor: `${testimonial.accentColor}55`,
                }}
              >
                {testimonial.tag}
              </div>
            </div>

            {/* Bottom name/role */}
            <div className="vtc-bottom">
              <div className="vtc-name">{testimonial.name}</div>
              <div className="vtc-role">{testimonial.role}</div>
            </div>
          </div>
        </div>

        {/* RIGHT — description */}
        <div className="vtc-desc-col">
          <div className="vtc-desc-inner">
            {/* Large case number */}
            <span className="vtc-case" style={{ color: `${testimonial.accentColor}25` }}>
              {testimonial.caseNumber}
            </span>

            {/* Stars */}
            <div className="vtc-stars">
              {[...Array(testimonial.stars)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            {/* Title */}
            <h3 className="vtc-title">{testimonial.title}</h3>

            {/* Body */}
            <p className="vtc-body">{testimonial.description}</p>

            {/* Achievement */}
            <div
              className="vtc-achievement"
              style={{ borderColor: `${testimonial.accentColor}33`, background: `${testimonial.accentColor}0d` }}
            >
              <Trophy className="w-4 h-4 shrink-0" style={{ color: testimonial.accentColor }} />
              <span style={{ color: testimonial.accentColor }}>{testimonial.achievement}</span>
            </div>

            {/* Author pill */}
            <div className="vtc-author">
              <div className={`vtc-avatar bg-gradient-to-br ${testimonial.tagColor}`}>
                {testimonial.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="vtc-author-name">{testimonial.name}</div>
                <div className="vtc-author-role">{testimonial.role}</div>
              </div>
            </div>

            {/* CTA */}
            <a
              href="/signup"
              className="vtc-cta"
              style={{ borderColor: `${testimonial.accentColor}66`, color: testimonial.accentColor }}
            >
              Join the Club →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main VideoTestimonials Section ───
const VideoTestimonials = () => {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Total scrollable distance = container height - one viewport
      const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const progress = clamp(scrolled / totalScrollable, 0, 1);
      setScrollProgress(progress);
      setActiveIndex(Math.min(Math.floor(progress * testimonials.length), testimonials.length - 1));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initialise on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToCard = (index) => {
    if (!containerRef.current) return;
    const totalScrollable = containerRef.current.offsetHeight - window.innerHeight;
    const targetProgress = (index / testimonials.length) + 0.01;
    window.scrollTo({
      top: containerRef.current.offsetTop + targetProgress * totalScrollable,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <style>{`
        /* ── Outer scroll container — 3× viewport tall ── */
        .vt-section {
          position: relative;
        }

        /* ── Sticky inner — stays put while outer scrolls ── */
        .vt-sticky {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: visible;
          display: flex;
          flex-direction: column;
          background: #050508;
          text-align: left;
          padding-bottom: 1rem;   /* breathing room at bottom of each frame */
        }

        /* ── Ambient glow bg ── */
        .vt-glow-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(ellipse 60% 45% at 30% 50%, rgba(168,85,247,0.08), transparent 70%),
            radial-gradient(ellipse 50% 40% at 70% 50%, rgba(34,211,238,0.05), transparent 70%);
        }

        /* ── Header ── */
        .vt-header {
          position: relative;
          z-index: 20;
          padding: 2rem 2rem 0.75rem;
          margin-top: 3.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          flex-shrink: 0;
          text-align: center;
        }
        .vt-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.3rem 0.9rem;
          border-radius: 999px;
          border: 1px solid rgba(168,85,247,0.4);
          background: rgba(168,85,247,0.1);
          color: #c084fc;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 0.4rem;
        }
        .vt-heading {
          font-size: clamp(1.5rem, 3.5vw, 2.6rem);
          font-weight: 900;
          color: #fff;
          line-height: 1.1;
          margin: 0;
        }
        .vt-heading-grad {
          background: linear-gradient(135deg, #a855f7, #ec4899, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Progress pills ── */
        .vt-pills {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          padding-top: 0.4rem;
        }
        .vt-pill {
          height: 4px;
          border-radius: 2px;
          background: rgba(168,85,247,0.18);
          transition: width 0.35s ease, background 0.35s ease, box-shadow 0.35s ease;
          cursor: pointer;
          border: none;
          padding: 0;
        }
        .vt-pill-active {
          background: #a855f7;
          box-shadow: 0 0 10px rgba(168,85,247,0.9);
        }

        /* ── Cards area — fills remaining height, clips overflowing cards ── */
        .vt-cards-area {
          flex: 1;
          position: relative;
          overflow: hidden;          /* safe here — only clips the card stack, not sticky root */
        }

        /* ── Individual card — fills the cards area ── */
        .vt-card {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1.5rem 3rem;  /* extra bottom padding on desktop to visually centre */
          will-change: transform, opacity;
        }

        /* ── Two-column grid inside card ── */
        .vt-card-inner {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          width: 100%;
          max-width: 1180px;
          height: 100%;
          max-height: calc(100vh - 180px);  /* accounts for header + margins to fit in one frame */
          align-items: center;
        }
        @media (min-width: 768px) {
          .vt-card-inner {
            grid-template-columns: 1.15fr 0.85fr;
            gap: 1.5rem;   /* less gap between video and description */
          }
        }

        /* ── Mobile overrides ── */
        @media (max-width: 767px) {
          .vt-header {
            margin-top: 1rem;
            padding: 1rem 1rem 0.5rem;
            gap: 0.4rem;
          }
          .vt-heading {
            font-size: 1.35rem;
          }
          .vt-card {
            padding: 0.5rem 0.75rem 0.75rem;
          }
          .vt-card-inner {
            gap: 0.75rem;
            max-height: calc(100vh - 140px);
          }
          .vtc-video-wrap {
            aspect-ratio: 16 / 9;
            max-height: 240px;
            border-radius: 14px;
          }
          .vtc-desc-inner {
            gap: 0.5rem;
            padding: 0;
          }
          .vtc-case {
            font-size: 2.5rem;
          }
          .vtc-title {
            font-size: 1.1rem;
          }
          .vtc-body {
            font-size: 0.8rem;
            line-height: 1.6;
            display: -webkit-box;
            -webkit-line-clamp: 4;
            -webkit-box-orient: vertical;
            overflow: hidden;   /* clamp long text on mobile */
          }
          .vtc-achievement, .vtc-author {
            padding: 0.35rem 0.65rem;
            font-size: 0.75rem;
          }
          .vtc-cta {
            padding: 0.45rem 1rem;
            font-size: 0.78rem;
          }
          .vt-scroll-hint {
            bottom: 0.5rem;
          }
        }

        /* ── Video column ── */
        .vtc-video-col {
          width: 100%;
          max-height: 400px;       /* shorter height */
        }
        .vtc-video-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;   /* wide landscape rectangle, not square */
          max-height: 400px;
          border-radius: 20px;
          overflow: hidden;
          background: #0a0a0a;
        }
        .vtc-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .vtc-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(to right, rgba(0,0,0,0.18), transparent),
            linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 50%);
        }

        /* Controls bar */
        .vtc-controls {
          position: absolute;
          top: 0.7rem;
          left: 0.7rem;
          right: 0.7rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 10;
        }
        .vtc-btns { display: flex; gap: 0.4rem; }
        .vtc-btn {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(0,0,0,0.52);
          backdrop-filter: blur(8px);
          color: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
        }
        .vtc-btn:hover { background: rgba(168,85,247,0.55); border-color: #a855f7; }
        .vtc-tag {
          padding: 0.28rem 0.75rem;
          border-radius: 999px;
          border: 1px solid;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #fff;
          backdrop-filter: blur(8px);
        }

        /* Bottom name overlay */
        .vtc-bottom {
          position: absolute;
          bottom: 0.7rem;
          left: 0.7rem;
          right: 0.7rem;
          z-index: 10;
        }
        .vtc-name { color: #fff; font-weight: 800; font-size: 1rem; text-shadow: 0 1px 6px rgba(0,0,0,0.9); }
        .vtc-role { color: rgba(255,255,255,0.65); font-size: 0.75rem; text-shadow: 0 1px 6px rgba(0,0,0,0.9); }

        /* ── Description column ── */
        .vtc-desc-col {
          display: flex;
          align-items: center;
          height: 100%;
        }
        .vtc-desc-inner {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;   /* tighter — less vertical space between elements */
          padding: 0.25rem 0;
        }

        /* Large decorative case number */
        .vtc-case {
          font-size: clamp(2rem, 5vw, 4rem);   /* smaller — was 3rem–7rem */
          font-weight: 900;
          line-height: 1;
          font-variant-numeric: tabular-nums;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
          user-select: none;
        }

        .vtc-stars { display: flex; gap: 2px; }

        .vtc-title {
          font-size: clamp(1.3rem, 3vw, 2.1rem);
          font-weight: 800;
          color: #fff;
          line-height: 1.15;
          margin: 0;
        }

        .vtc-body {
          color: #9ca3af;
          font-size: 0.93rem;
          line-height: 1.8;
          margin: 0;
        }

        .vtc-achievement {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 0.85rem;
          border-radius: 10px;
          border: 1px solid;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .vtc-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.6rem 0.85rem;
          border-radius: 12px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .vtc-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 0.78rem; color: #fff;
          flex-shrink: 0;
        }
        .vtc-author-name { color: #fff; font-weight: 700; font-size: 0.88rem; }
        .vtc-author-role { color: #6b7280; font-size: 0.73rem; }

        .vtc-cta {
          display: inline-flex;
          align-items: center;
          padding: 0.55rem 1.3rem;
          border-radius: 999px;
          border: 1px solid;
          font-weight: 700;
          font-size: 0.83rem;
          text-decoration: none;
          transition: background 0.25s, transform 0.25s;
          width: fit-content;
          background: transparent;
        }
        .vtc-cta:hover {
          background: rgba(168,85,247,0.14);
          transform: translateX(4px);
        }

        /* ── Scroll hint ── */
        .vt-scroll-hint {
          position: absolute;
          bottom: 1rem;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          color: rgba(168,85,247,0.5);
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          z-index: 30;
          pointer-events: none;
          animation: vtHintBounce 2s ease-in-out infinite;
        }
        @keyframes vtHintBounce {
          0%,100% { transform: translateX(-50%) translateY(0); opacity: .45; }
          50%      { transform: translateX(-50%) translateY(7px); opacity: 1; }
        }
        .vt-scroll-bar {
          width: 1px;
          height: 36px;
          background: linear-gradient(to bottom, rgba(168,85,247,0.9), transparent);
        }
      `}</style>

      {/* Section — tall (N × 100vh) to give scroll room while sticky view holds */}
      <section
        ref={containerRef}
        className="vt-section"
        style={{ height: `${testimonials.length * 100}vh` }}
      >
        <div className="vt-sticky">
          {/* Ambient background glow */}
          <div className="vt-glow-bg" />

          {/* Header */}
          <div className="vt-header">
            {/* Eyebrow + Heading — centered */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <div className="vt-eyebrow">
                <Sparkles className="w-3 h-3" />
                Student Stories · APSIT Coding Nexus
              </div>
              <h2 className="vt-heading">
                Real Students.{' '}
                <span className="vt-heading-grad">Real Results.</span>
              </h2>
            </div>

            {/* Progress pills — centered below heading */}
            <div className="vt-pills">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  className={`vt-pill ${i === activeIndex ? 'vt-pill-active' : ''}`}
                  style={{ width: i === activeIndex ? 40 : 20 }}
                  onClick={() => scrollToCard(i)}
                />
              ))}
            </div>
          </div>

          {/* Card stack */}
          <div className="vt-cards-area">
            {testimonials.map((testimonial, index) => (
              <VideoCard
                key={testimonial.id}
                testimonial={testimonial}
                scrollProgress={scrollProgress}
                index={index}
                total={testimonials.length}
              />
            ))}
          </div>

          {/* Scroll hint — hide on last card */}
          {activeIndex < testimonials.length - 1 && (
            <div className="vt-scroll-hint">
              <span>scroll</span>
              <div className="vt-scroll-bar" />
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default VideoTestimonials;
