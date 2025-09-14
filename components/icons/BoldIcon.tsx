
import React from 'react';

export const BoldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 3h8c3.314 0 6 2.686 6 6s-2.686 6-6 6H6V3zm0 6h6c1.105 0 2-.895 2-2s-.895-2-2-2H6v4z"
    />
  </svg>
);
