import React from 'react';

import { SvgProps } from '../../../interfaces/Svg';

const Icon: React.FC<SvgProps> = (props) => {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M3.56689 15.1035C3.21826 15.4521 3.20166 16.0747 3.5752 16.4399C3.94043 16.8052 4.56299 16.7969 4.91162 16.4482L9.9917 11.3599L15.0801 16.4482C15.437 16.8052 16.0513 16.8052 16.4165 16.4399C16.7734 16.0664 16.7817 15.4605 16.4165 15.1035L11.3364 10.0151L16.4165 4.93506C16.7817 4.57813 16.7817 3.96387 16.4165 3.59863C16.043 3.2417 15.437 3.2334 15.0801 3.59033L9.9917 8.67871L4.91162 3.59033C4.56299 3.2417 3.93213 3.2251 3.5752 3.59863C3.20996 3.96387 3.21826 4.58643 3.56689 4.93506L8.65527 10.0151L3.56689 15.1035Z"/>
    </svg>

  );
};

export default Icon;
