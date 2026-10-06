export const STARTUP_STYLES = `
@keyframes yr-spin     { to { transform: rotate(360deg); } }
@keyframes yr-spin-rev { to { transform: rotate(-360deg); } }
@keyframes yr-ping {
  0%   { transform: scale(0.75); opacity: 0.45; }
  100% { transform: scale(1.7);  opacity: 0; }
}
@keyframes yr-rise {
  from { opacity: 0; transform: translateY(14px); filter: blur(6px); }
  to   { opacity: 1; transform: none;             filter: none; }
}
@keyframes yr-fade  { from { opacity: 0; } to { opacity: 1; } }
@keyframes yr-float {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50%      { transform: translate3d(0, -14px, 0); }
}
@keyframes yr-twinkle {
  0%, 100% { opacity: 0.15; }
  50%      { opacity: 0.8; }
}
@keyframes yr-pin {
  0%, 100% { transform: scale(1);   opacity: 1; }
  50%      { transform: scale(1.5); opacity: 0.55; }
}

.yr-orbit   { transform-origin: 60px 60px; animation: yr-spin 3.2s linear infinite; }
.yr-ring    { transform-origin: 60px 60px; animation: yr-spin-rev 24s linear infinite; }
.yr-globe   { transform-origin: 60px 60px; animation: yr-spin 40s linear infinite; }
.yr-ping    { animation: yr-ping 2.6s ease-out infinite; }
.yr-rise    { animation: yr-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
.yr-fade    { animation: yr-fade 0.6s ease-out both; }
.yr-float   { animation: yr-float 9s ease-in-out infinite; }
.yr-twinkle { animation: yr-twinkle 3.4s ease-in-out infinite; }
.yr-pin     { transform-origin: 78px 50px; animation: yr-pin 1.6s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .yr-orbit, .yr-ring, .yr-globe, .yr-ping, .yr-rise,
  .yr-fade, .yr-float, .yr-twinkle, .yr-pin {
    animation: none !important;
  }
}
`;