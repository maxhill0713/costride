export default function CustomFlameIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      {/* Flame body */}
      <path
        d="M14 2C14 2 10 10 10 15C10 18.3137 11.7909 21 14 21C16.2091 21 18 18.3137 18 15C18 10 14 2 14 2Z"
        fill="#FF6B35"
      />
      
      {/* Flame highlight/lighter area */}
      <path
        d="M14 4C14 4 11.5 10 11.5 15C11.5 17.4853 12.5402 19.5 14 19.5C15.4598 19.5 16.5 17.4853 16.5 15C16.5 10 14 4 14 4Z"
        fill="#FFA500"
      />

      {/* Left eye */}
      <circle cx="11" cy="12" r="1.5" fill="white" />
      <circle cx="11" cy="12" r="0.8" fill="black" />

      {/* Right eye */}
      <circle cx="17" cy="12" r="1.5" fill="white" />
      <circle cx="17" cy="12" r="0.8" fill="black" />

      {/* Smile */}
      <path
        d="M12 15C12 15 13.5 16 14 16C14.5 16 16 15 16 15"
        stroke="black"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}