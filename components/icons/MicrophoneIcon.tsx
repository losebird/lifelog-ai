
import React from 'react';

export const MicrophoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    {...props}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6zM12 18.75a6 6 0 00-6-6v-1.5a6 6 0 0012 0v1.5a6 6 0 00-6 6zM12 4.5v.75m0 13.5v.75m-6-7.5h.75m10.5 0h.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 12a4.5 4.5 0 014.5-4.5v1.5a3 3 0 00-3 3h-1.5z" />
  </svg>
);
