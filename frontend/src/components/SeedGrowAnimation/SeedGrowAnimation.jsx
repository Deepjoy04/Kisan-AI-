import React, { useState, useEffect } from "react";
import "./SeedGrowAnimation.css";

export default function SeedGrowAnimation() {
  const [key, setKey] = useState(0);

  useEffect(() => {
    // Total loop duration is 22 seconds
    const interval = setInterval(() => {
      setKey((prev) => prev + 1);
    }, 22000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div key={key} className="seed-grow-container" aria-hidden="true">
      <svg className="tree-svg" xmlns="http://www.w3.org/2000/svg">
        <g className="tree-root">
          {/* Dust Puff at landing spot */}
          <ellipse cx="0" cy="0" rx="15" ry="5" className="dust-puff" />

          {/* Seed falling and bouncing */}
          <g className="seed-wrapper">
            <ellipse cx="0" cy="0" rx="6" ry="10" className="seed" fill="#5C3D1E" />
          </g>

          {/* Seed Cracking into two halves */}
          <g className="seed-halves">
            <path
              d="M 0,-10 L 0,10 L -6,10 L -6,-10 Z"
              className="seed-left"
              fill="#5C3D1E"
            />
            <path
              d="M 0,-10 L 0,10 L 6,10 L 6,-10 Z"
              className="seed-right"
              fill="#5C3D1E"
            />
          </g>

          {/* Sprouting Stem */}
          <g className="sprout">
            <path
              d="M 0,0 Q -10,-10 0,-25 Q 10,-10 0,0 Z M 0,0 L 0,-15"
              stroke="#2d7a45"
              strokeWidth="2"
              fill="#4aab67"
              strokeLinejoin="round"
            />
          </g>

          {/* Tree sway group */}
          <g className="tree-sway-group">
            {/* Trunk */}
            <path className="trunk" d="M 0,0 L 0,-250" strokeLinecap="round" />

            {/* Branches */}
            <path
              className="branch branch-l1"
              style={{ "--len": 100, animationDelay: "5s" }}
              d="M 0,-100 Q -40,-120 -80,-160"
              strokeLinecap="round"
            />
            <path
              className="branch branch-r1"
              style={{ "--len": 130, animationDelay: "6s" }}
              d="M 0,-130 Q 60,-150 100,-200"
              strokeLinecap="round"
            />
            <path
              className="branch branch-l2"
              style={{ "--len": 80, animationDelay: "7s" }}
              d="M 0,-180 Q -30,-220 -60,-240"
              strokeLinecap="round"
            />
            <path
              className="branch branch-r2"
              style={{ "--len": 80, animationDelay: "8s" }}
              d="M 0,-210 Q 40,-230 70,-260"
              strokeLinecap="round"
            />

            {/* Leaf Clusters */}
            {/* L1 Cluster */}
            <g
              className="leaf-cluster"
              style={{ animationDelay: "6.5s", transformOrigin: "-80px -160px" }}
            >
              <circle cx="-80" cy="-160" r="22" fill="#2d7a45" />
              <circle cx="-95" cy="-150" r="18" fill="#4aab67" />
              <circle cx="-70" cy="-175" r="16" fill="#1a5c2e" />
            </g>

            {/* R1 Cluster */}
            <g
              className="leaf-cluster"
              style={{ animationDelay: "7.5s", transformOrigin: "100px -200px" }}
            >
              <circle cx="100" cy="-200" r="20" fill="#1a5c2e" />
              <circle cx="115" cy="-190" r="16" fill="#4aab67" />
              <circle cx="85" cy="-215" r="15" fill="#2d7a45" />
            </g>

            {/* L2 Cluster */}
            <g
              className="leaf-cluster"
              style={{ animationDelay: "8.5s", transformOrigin: "-60px -240px" }}
            >
              <circle cx="-60" cy="-240" r="18" fill="#4aab67" />
              <circle cx="-75" cy="-230" r="14" fill="#2d7a45" />
              <circle cx="-45" cy="-250" r="12" fill="#1a5c2e" />
            </g>

            {/* R2 Cluster */}
            <g
              className="leaf-cluster"
              style={{ animationDelay: "9.5s", transformOrigin: "70px -260px" }}
            >
              <circle cx="70" cy="-260" r="16" fill="#2d7a45" />
              <circle cx="85" cy="-250" r="12" fill="#1a5c2e" />
              <circle cx="55" cy="-275" r="14" fill="#4aab67" />
            </g>

            {/* Top Cluster */}
            <g
              className="leaf-cluster"
              style={{ animationDelay: "6.5s", transformOrigin: "0px -250px" }}
            >
              <circle cx="0" cy="-250" r="28" fill="#1a5c2e" />
              <circle cx="-20" cy="-235" r="22" fill="#4aab67" />
              <circle cx="20" cy="-240" r="20" fill="#2d7a45" />
              <circle cx="0" cy="-275" r="18" fill="#4aab67" />
            </g>
          </g>

          {/* Flying Leaves */}
          <path className="fly-leaf leaf-1" d="M 0,0 Q 5,-5 10,0 Q 5,5 0,0 Z" fill="#4aab67" />
          <path className="fly-leaf leaf-2" d="M 0,0 Q 6,-6 12,0 Q 6,6 0,0 Z" fill="#E6A817" />
          <path className="fly-leaf leaf-3" d="M 0,0 Q 4,-4 8,0 Q 4,4 0,0 Z" fill="#6dcc88" />
          <path className="fly-leaf leaf-4" d="M 0,0 Q 5,-5 10,0 Q 5,5 0,0 Z" fill="#4aab67" />
          <path className="fly-leaf leaf-5" d="M 0,0 Q 7,-5 14,0 Q 7,5 0,0 Z" fill="#E6A817" />
          <path className="fly-leaf leaf-6" d="M 0,0 Q 4,-6 8,0 Q 4,6 0,0 Z" fill="#1a5c2e" />
          <path className="fly-leaf leaf-7" d="M 0,0 Q 6,-4 12,0 Q 6,4 0,0 Z" fill="#6dcc88" />
          <path className="fly-leaf leaf-8" d="M 0,0 Q 5,-5 10,0 Q 5,5 0,0 Z" fill="#E6A817" />
        </g>
      </svg>
    </div>
  );
}
