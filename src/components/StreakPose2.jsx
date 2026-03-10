export default function StreakPose2({ style }) {
  return (
    <svg viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg" style={{ ...style, overflow: 'visible' }}>
      {/* Head */}
      <circle cx="148" cy="55" r="40" fill="#f26522" />

      {/* Left arm — sweeps down-left */}
      <path
        d="M122,100 C105,108 75,125 42,158 C28,172 34,192 55,184 C82,172 110,150 124,118 Z"
        fill="#c0392b"
      />

      {/* Right arm with upward arrow */}
      <path
        d="M174,90 C192,72 215,52 240,34 L230,28 L252,18 L256,42 L244,36 C220,52 198,72 178,92 Z"
        fill="#c0392b"
      />

      {/* Body — S-curve flowing to two legs */}
      <path
        d="
          M122,112
          C118,135 114,162 110,188
          C104,218 90,244 74,268
          C62,286 68,308 90,300
          C106,294 118,270 126,246
          C132,226 136,204 140,182
          C144,204 148,226 154,246
          C162,270 174,294 190,300
          C212,308 218,286 206,268
          C190,244 176,218 170,188
          C166,162 162,135 158,112
          C152,104 130,104 122,112 Z
        "
        fill="#f26522"
      />

      {/* Shadow depth on body */}
      <path
        d="
          M140,116
          C140,140 140,170 140,200
          C140,225 138,250 134,272
          C138,272 142,272 146,272
          C142,250 140,225 140,200
          C140,170 140,140 140,116 Z
        "
        fill="#c0392b"
        opacity="0.3"
      />
    </svg>
  );
}