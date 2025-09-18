import type { SVGProps } from 'react';

export const FieldWiseLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    aria-label="FieldWise Logo"
    {...props}
  >
    <path fill="none" d="M0 0h256v256H0z" />
    <path
      fill="currentColor"
      d="M208 28H48a20 20 0 0 0-20 20v160a20 20 0 0 0 20 20h160a20 20 0 0 0 20-20V48a20 20 0 0 0-20-20Zm-48 168h-64a8 8 0 0 1-8-8v-56h80v56a8 8 0 0 1-8 8Zm-52-104 52-32 52 32v24H88Z"
    />
  </svg>
);
