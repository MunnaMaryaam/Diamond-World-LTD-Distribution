import React from 'react';

interface DiamondWorldLogoProps {
  className?: string;
  size?: number | string;
  color?: string;
}

/**
 * Diamond World (DW) Trademark Monogram Logo with Faceted Diamond
 * Accurately vectorized from the official cutout
 */
export const DiamondWorldLogo: React.FC<DiamondWorldLogoProps> = ({
  className = 'w-10 h-10',
  size,
  color = 'currentColor'
}) => {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <svg
      viewBox="0 0 600 600"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block select-none shrink-0 ${className}`}
      style={style}
      aria-label="Diamond World DW Logo"
    >
      {/* 1. FACETED BRILLIANT DIAMOND (Positioned atop the center W apex) */}
      <g id="diamond-gem" transform="translate(345, 230) scale(0.95)">
        {/* Crown Table & Facets */}
        {/* Top Left Triangle / Trapezoid */}
        <polygon points="-28,-36 -8,-36 -14,-20 -38,-20" fill={color} />
        {/* Top Center Trapezoid */}
        <polygon points="-6,-36 6,-36 10,-20 -10,-20" fill={color} />
        {/* Top Right Triangle / Trapezoid */}
        <polygon points="8,-36 28,-36 38,-20 14,-20" fill={color} />
        
        {/* Lower Pavilion Facets meeting at bottom Culet (0, 24) */}
        {/* Left Pavilion */}
        <polygon points="-38,-16 -12,-16 0,22 -30,-16" fill={color} />
        {/* Center Pavilion */}
        <polygon points="-8,-16 8,-16 0,22" fill={color} />
        {/* Right Pavilion */}
        <polygon points="12,-16 38,-16 30,-16 0,22" fill={color} />
      </g>

      {/* 2. CALLIGRAPHIC "DW" MONOGRAM (Flourished Cursive Signature Strokes) */}
      {/* Upper-left starting flourish down into the left loop of 'D' */}
      <path
        d="M 152 178 
           C 185 200, 218 240, 238 285
           C 255 325, 260 365, 245 405
           C 230 442, 192 462, 155 452
           C 120 442, 98 408, 105 365
           C 112 320, 142 270, 188 238
           C 215 218, 248 220, 265 245
           C 285 275, 275 320, 255 375
           C 238 415, 205 440, 168 440
           C 145 440, 128 425, 125 402
           C 122 370, 142 332, 172 295
           C 205 255, 235 240, 248 245
           C 255 248, 258 258, 252 275
           C 240 310, 215 360, 185 398
           C 165 422, 145 428, 138 418
           C 132 405, 138 382, 155 352
           C 178 312, 212 272, 240 248
           C 230 220, 198 195, 152 178 Z"
        fill={color}
      />

      {/* Main Sweeping Body: Left loop connection through 'W' and right soaring flourish */}
      <path
        d="M 235 345
           C 245 310, 265 260, 290 252
           C 310 245, 325 262, 328 290
           C 332 325, 318 375, 298 422
           C 278 468, 250 490, 225 480
           C 205 470, 202 445, 215 410
           C 235 355, 272 295, 305 260
           C 325 240, 342 242, 345 265
           C 348 290, 335 335, 315 385
           C 300 422, 280 452, 258 465
           C 278 455, 305 428, 325 390
           C 345 350, 362 295, 358 260
           C 355 242, 342 238, 330 250
           C 310 272, 282 325, 262 380
           C 245 425, 232 455, 238 465
           C 245 475, 268 462, 290 425
           C 320 375, 345 305, 350 255
           C 352 240, 345 235, 335 242
           C 315 258, 288 310, 270 365
           Z"
        fill={color}
      />

      {/* The iconic W valleys and the soaring right crest */}
      <path
        d="M 285 390
           C 298 340, 322 280, 345 275
           C 362 272, 375 292, 378 322
           C 382 360, 368 410, 345 448
           C 328 475, 308 488, 292 482
           C 280 478, 280 460, 290 435
           C 310 388, 342 328, 362 298
           C 375 280, 388 285, 390 305
           C 395 340, 378 400, 350 450
           C 380 432, 420 382, 448 318
           C 475 255, 480 185, 452 142
           C 432 112, 395 102, 335 125
           C 375 125, 412 142, 432 172
           C 455 208, 452 265, 428 328
           C 405 385, 368 435, 332 458
           C 358 435, 385 392, 402 342
           C 418 295, 422 250, 410 220
           C 398 190, 368 182, 330 195
           C 370 185, 405 198, 420 228
           C 438 262, 432 315, 408 375
           C 382 435, 340 478, 295 488
           Z"
        fill={color}
      />
    </svg>
  );
};
