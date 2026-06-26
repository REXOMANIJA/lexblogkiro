export function DecorativeBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Top Left Corner Ornament */}
      <svg
        className="absolute top-8 left-8 w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 animate-fade-in"
        viewBox="0 0 200 200"
        fill="none"
        style={{ opacity: 0.15, color: '#caa873', animationDelay: '0.3s' }}
        aria-hidden="true"
      >
        <path
          d="M10 10 Q30 30 10 50 Q30 70 10 90 M10 10 Q30 10 50 10 Q70 30 90 10"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="10" cy="10" r="3" fill="currentColor" />
        <path
          d="M20 20 Q35 25 40 40 Q25 35 20 20"
          fill="currentColor"
          opacity="0.6"
        />
        <path
          d="M15 35 Q25 40 35 35 Q40 45 35 55 Q25 50 15 55 Q10 45 15 35"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
      </svg>

      {/* Top Right Corner Ornament */}
      <svg
        className="absolute top-8 right-8 w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 animate-fade-in"
        viewBox="0 0 200 200"
        fill="none"
        style={{ opacity: 0.15, color: '#caa873', animationDelay: '0.4s', transform: 'scaleX(-1)' }}
        aria-hidden="true"
      >
        <path
          d="M10 10 Q30 30 10 50 Q30 70 10 90 M10 10 Q30 10 50 10 Q70 30 90 10"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <circle cx="10" cy="10" r="3" fill="currentColor" />
        <path
          d="M20 20 Q35 25 40 40 Q25 35 20 20"
          fill="currentColor"
          opacity="0.6"
        />
        <path
          d="M15 35 Q25 40 35 35 Q40 45 35 55 Q25 50 15 55 Q10 45 15 35"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
      </svg>

      {/* Scattered Stars */}
      <svg
        className="absolute top-[8%] left-[15%] w-4 h-4 animate-fade-in"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ opacity: 0.2, color: '#caa873', animationDelay: '0.5s' }}
        aria-hidden="true"
      >
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
      </svg>

      <svg
        className="absolute top-[12%] right-[20%] w-3 h-3 animate-fade-in"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ opacity: 0.15, color: '#caa873', animationDelay: '0.6s' }}
        aria-hidden="true"
      >
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
      </svg>

      <svg
        className="absolute top-[18%] left-[25%] w-3.5 h-3.5 animate-fade-in"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ opacity: 0.12, color: '#caa873', animationDelay: '0.7s' }}
        aria-hidden="true"
      >
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
      </svg>

      <svg
        className="absolute top-[15%] right-[35%] w-2.5 h-2.5 animate-fade-in"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ opacity: 0.1, color: '#caa873', animationDelay: '0.8s' }}
        aria-hidden="true"
      >
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
      </svg>

      <svg
        className="absolute top-[10%] left-[40%] w-3 h-3 animate-fade-in"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ opacity: 0.18, color: '#caa873', animationDelay: '0.9s' }}
        aria-hidden="true"
      >
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
      </svg>

      <svg
        className="absolute top-[20%] right-[12%] w-2 h-2 animate-fade-in"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ opacity: 0.08, color: '#caa873', animationDelay: '1s' }}
        aria-hidden="true"
      >
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
      </svg>

      <svg
        className="absolute top-[14%] left-[60%] w-3.5 h-3.5 animate-fade-in"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ opacity: 0.14, color: '#caa873', animationDelay: '1.1s' }}
        aria-hidden="true"
      >
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
      </svg>

      <svg
        className="absolute top-[22%] left-[8%] w-2.5 h-2.5 animate-fade-in"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ opacity: 0.11, color: '#caa873', animationDelay: '1.2s' }}
        aria-hidden="true"
      >
        <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z" />
      </svg>

      {/* Bottom Left Tree Branch */}
      <svg
        className="absolute bottom-0 left-0 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 animate-fade-in hidden sm:block"
        viewBox="0 0 400 400"
        fill="none"
        style={{ opacity: 0.15, color: '#1a2722', animationDelay: '0.5s' }}
        aria-hidden="true"
      >
        <path
          d="M0 400 Q20 380 40 360 Q50 340 60 320 Q70 300 85 285 Q100 270 120 260 Q140 250 160 245"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M60 320 Q70 310 80 300 Q90 290 100 285"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M85 285 Q95 275 105 268 Q115 261 125 258"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M40 360 Q50 350 60 345 Q70 340 80 338"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <ellipse cx="100" cy="285" rx="8" ry="12" fill="currentColor" opacity="0.6" transform="rotate(-30 100 285)" />
        <ellipse cx="125" cy="258" rx="6" ry="10" fill="currentColor" opacity="0.5" transform="rotate(-25 125 258)" />
        <ellipse cx="80" cy="338" rx="7" ry="11" fill="currentColor" opacity="0.6" transform="rotate(-35 80 338)" />
        <ellipse cx="70" cy="310" rx="6" ry="9" fill="currentColor" opacity="0.5" transform="rotate(-40 70 310)" />
      </svg>

      {/* Bottom Right Tree Branch */}
      <svg
        className="absolute bottom-0 right-0 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 animate-fade-in hidden sm:block"
        viewBox="0 0 400 400"
        fill="none"
        style={{ opacity: 0.15, color: '#1a2722', animationDelay: '0.6s', transform: 'scaleX(-1)' }}
        aria-hidden="true"
      >
        <path
          d="M0 400 Q20 380 40 360 Q50 340 60 320 Q70 300 85 285 Q100 270 120 260 Q140 250 160 245"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
        />
        <path
          d="M60 320 Q70 310 80 300 Q90 290 100 285"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M85 285 Q95 275 105 268 Q115 261 125 258"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M40 360 Q50 350 60 345 Q70 340 80 338"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <ellipse cx="100" cy="285" rx="8" ry="12" fill="currentColor" opacity="0.6" transform="rotate(-30 100 285)" />
        <ellipse cx="125" cy="258" rx="6" ry="10" fill="currentColor" opacity="0.5" transform="rotate(-25 125 258)" />
        <ellipse cx="80" cy="338" rx="7" ry="11" fill="currentColor" opacity="0.6" transform="rotate(-35 80 338)" />
        <ellipse cx="70" cy="310" rx="6" ry="9" fill="currentColor" opacity="0.5" transform="rotate(-40 70 310)" />
      </svg>

      {/* Forest Floor Silhouette */}
      <svg
        className="absolute bottom-0 left-0 w-full h-24 sm:h-28 lg:h-32 animate-fade-in"
        viewBox="0 0 1200 120"
        fill="none"
        preserveAspectRatio="none"
        style={{ opacity: 0.12, color: '#1a2722', animationDelay: '0.7s' }}
        aria-hidden="true"
      >
        <path
          d="M0 120 L0 80 Q50 70 100 75 Q150 80 200 70 Q250 60 300 65 Q350 70 400 75 Q450 80 500 70 Q550 65 600 70 Q650 75 700 65 Q750 60 800 70 Q850 75 900 65 Q950 60 1000 70 Q1050 75 1100 65 Q1150 60 1200 70 L1200 120 Z"
          fill="currentColor"
        />
        <path
          d="M0 90 Q100 85 200 90 Q300 95 400 88 Q500 82 600 90 Q700 95 800 88 Q900 85 1000 92 Q1100 95 1200 88 L1200 120 L0 120 Z"
          fill="currentColor"
          opacity="0.7"
        />
      </svg>

      {/* Floating Leaves */}
      <svg
        className="absolute top-[35%] right-[8%] w-6 h-6 animate-fade-in hidden lg:block"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ opacity: 0.1, color: '#507c58', animationDelay: '1.3s' }}
        aria-hidden="true"
      >
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.66-1.89C8 14 10 6 17 8zm0 0c-1.33 0-2.67.5-3.67 1.5-.67.67-1 1.5-1 2.5 0 2 2 4 4 4 1 0 1.83-.33 2.5-1 1-1 1.5-2.34 1.5-3.67C20.33 9 18.67 8 17 8z" />
      </svg>

      <svg
        className="absolute top-[45%] left-[12%] w-5 h-5 animate-fade-in hidden lg:block"
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ opacity: 0.08, color: '#507c58', animationDelay: '1.4s', transform: 'rotate(45deg)' }}
        aria-hidden="true"
      >
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.66-1.89C8 14 10 6 17 8zm0 0c-1.33 0-2.67.5-3.67 1.5-.67.67-1 1.5-1 2.5 0 2 2 4 4 4 1 0 1.83-.33 2.5-1 1-1 1.5-2.34 1.5-3.67C20.33 9 18.67 8 17 8z" />
      </svg>
    </div>
  );
}
