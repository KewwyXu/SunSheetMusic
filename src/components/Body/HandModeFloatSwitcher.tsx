import { FloatButton } from 'antd';
import { CSSProperties, FC } from 'react';
import { createFromIconfontCN } from '@ant-design/icons';
import { HandMode } from '../../enums/HandMode';

const IconFont = createFromIconfontCN({
   scriptUrl: '//at.alicdn.com/t/c/font_4987078_0fsm1zqgtpw.js',
});

export interface HandModeFloatSwitcherProps {
   handMode: HandMode;
   setHandMode: React.Dispatch<React.SetStateAction<HandMode>>;
}

export const HandModeFloatSwitcher: FC<HandModeFloatSwitcherProps> = (props) => {
   const { handMode, setHandMode } = props;

   const buttonGroupStyle: CSSProperties = {
      insetInlineEnd: 10,
      position: 'fixed',
      right: '1980px',
      bottom: '100px',
   };

   const iconStyle: CSSProperties = {
      color: 'orange',
      fontSize: '25px',
      marginLeft: '-2px',
   };

   const mapHandModeToIconFontType = (handMode: HandMode) => {
      switch (handMode) {
         case HandMode.Right:
            return 'icon-hand_r';
         case HandMode.Left:
            return 'icon-hand_l';
         case HandMode.Double:
            return 'icon-hand_both';
      }
   };

   return (
      <div>
         <FloatButton.Group shape="circle" style={buttonGroupStyle}>
            {Object.values(HandMode)
               .filter((key) => !isNaN(Number(key)))
               .map((x) => {
                  const mode = x as HandMode;
                  return (
                     <FloatButton
                        key={mode}
                        type={mode == handMode ? 'primary' : 'default'}
                        icon={<IconFont type={mapHandModeToIconFontType(mode)} style={iconStyle} />}
                        onClick={() => {
                           setHandMode(mode);
                        }}
                     />
                  );
               })}
         </FloatButton.Group>
      </div>
   );
};
