import { useState, useEffect, useRef } from 'react';
import { useProgress } from '@react-three/drei';
import gsap from 'gsap';

const LOADING_TEXTS = ['Sketching...', 'Coding...', 'Brewing coffee...', 'Almost there...'];

const Preloader = ({ onComplete }) => {
  const [textIndex, setTextIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // Get actual asset loading progress
  const { progress: realProgress, active } = useProgress();

  const containerRef = useRef(null);
  const accentRef = useRef(null);
  const logoRef = useRef(null);

  // ---------------------------------------------------------------------------
  // 1. SMOOTH PROGRESS LOGIC
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // We want the progress to move smoothly to the realProgress.
    // But we also want to prevent it from jumping 0->100 instantly.
    // We will use a GSAP tween to mediate the value.

    // If we are currently loading (active) or realProgress < 100
    const target = active ? realProgress : 100;

    // Determine duration based on how big the jump is.
    // If it's a small jump, quick. If big (e.g. init), slower.
    // But user wants it "not fast", so we enforce a minimum feel.
    const duration = Math.max(0.5, (target - progress) / 30);

    const tween = gsap.to({ value: progress }, {
      value: target,
      duration: duration,
      ease: "power2.out",
      onUpdate: function () {
        setProgress(Math.round(this.targets()[0].value));
      }
    });

    return () => tween.kill();
  }, [realProgress, active]);

  // ---------------------------------------------------------------------------
  // 2. TEXT CYCLER
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (progress >= 100) return;
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
    }, 400);
    return () => clearInterval(interval);
  }, [progress]);

  // ---------------------------------------------------------------------------
  // 3. CIRCLE VISUALIZATION
  // ---------------------------------------------------------------------------
  // Circumference of the circle (r=40)
  const CIRCUMFERENCE = 2 * Math.PI * 40;

  useEffect(() => {
    const offset = CIRCUMFERENCE - (CIRCUMFERENCE * progress) / 100;
    if (accentRef.current) {
      gsap.to('.preloader__logo-accent-progress', {
        strokeDashoffset: offset,
        duration: 0.1,
        ease: 'none',
        overwrite: true
      });
    }
  }, [progress, CIRCUMFERENCE]);

  // ---------------------------------------------------------------------------
  // 4. EXIT TRANSITION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Only start exit when fully loaded
    if (progress < 100) return;

    // Small delay to let the user see "100%" or the full ring for a moment
    const timer = setTimeout(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setIsDone(true);
          onComplete?.();
        }
      });

      // Calculate center offset for the "O" to move to center of screen
      const getCenterOffset = () => {
        if (!accentRef.current) return { x: 0, y: 0 };
        const rect = accentRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        return {
          x: window.innerWidth / 2 - centerX,
          y: window.innerHeight / 2 - centerY
        };
      };

      const offset = getCenterOffset();

      // Step 1: Fade out the "IT" and "M" texts
      tl.to('.preloader__logo-text', {
        x: (i) => i === 0 ? -50 : 50,
        opacity: 0,
        duration: 0.6,
        ease: 'power3.in'
      });

      // Step 2: Move the "O" (accent wrapper) to the exact center of the screen
      tl.to(accentRef.current, {
        x: offset.x,
        y: offset.y,
        scale: 1.2, // Slight pulse
        duration: 0.8,
        ease: 'power3.inOut'
      }, '-=0.4');

      // Step 3: "Portal" Effect
      // Turn the green progress circle to black (or whatever color the void should be)
      // and expand it to fill the screen.

      // OPTION A: Expand the mask hole (using mix-blend-mode trick from CSS)
      // The CSS uses `--mask-size` to reveal the content? 
      // Actually checking CSS: 
      // mask-image: radial-gradient(circle at center, transparent var(--mask-size), black ...
      // This means transparent is the HOLE (where content shows? or hidden?)
      // Standard mask: alpha 1 = visible, alpha 0 = hidden.
      // transparent = alpha 0. black = alpha 1.
      // So `transparent var(--mask-size)` means the CENTER is HIDDEN?
      // Wait, let's look at CSS logic: `background-color: white`.
      // If we want to reveal the canvas *behind* this preloader div overlay...
      // We want the preloader div to become transparent.
      // If mask makes center transparent, then we see through the preloader div?
      // Yes.

      // So we animate mask-size from 0% to 200%.

      tl.to(containerRef.current, {
        '--mask-size': '150vmax', // Expand hole
        duration: 2.7,
        ease: 'expo.inOut'
      }, '+=0.1');

      // Also scale up the "O" ring to match the expanding hole so it looks like the ring is expanding
      tl.to(accentRef.current, {
        scale: 50, // Massive scale
        opacity: 0, // Fade out eventually
        duration: 2.5,
        ease: 'expo.inOut'
      }, '<');

      // Step 4: Final cleanup - fade entire container just in case
      tl.to(containerRef.current, {
        opacity: 0,
        duration: 0.5
      }, '-=0.5');

    }, 500); // 500ms pause at 100%

    return () => clearTimeout(timer);
  }, [progress, onComplete]);

  if (isDone) return null;

  return (
    <div ref={containerRef} className="preloader">
      <div className="preloader__content">
        <div className="preloader__logo" ref={logoRef}>
          <span className="preloader__logo-text">IT</span>

          <div ref={accentRef} className="preloader__logo-accent-wrapper">
            <svg viewBox="0 0 100 100" className="preloader__logo-accent">
              {/* Track Circle */}
              <circle
                className="preloader__logo-accent-track"
                cx="50" cy="50" r="40"
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="6"
                style={{ opacity: 0.3 }}
              />
              {/* Progress Circle - Neon Green */}
              <circle
                className="preloader__logo-accent-progress"
                cx="50" cy="50" r="40"
                fill="none"
                stroke="#39FF14"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE} // Starts empty
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>

          <span className="preloader__logo-text">M</span>
        </div>

        {/* Optional: Status text below if desired, user said "minimalist" so maybe not? 
            History says: "remove cluttered elements... extraneous loading indicators... only O". 
            So I will Keep it clean. */}
      </div>
    </div>
  );
};

export default Preloader;
