import { FloatButton } from 'antd';
import { CSSProperties, FC } from 'react';
import { PlayMode } from '../../enums/PlayMode';
import { IconFont } from '../Icons/IconFont';

export interface PlayModeFloatSwitcherProps {
   playMode: PlayMode;
   setPlayMode: React.Dispatch<React.SetStateAction<PlayMode>>;
}

export const PlayModeFloatSwitcher: FC<PlayModeFloatSwitcherProps> = (props) => {
   const { playMode, setPlayMode } = props;

   const buttonGroupStyle: CSSProperties = {
      insetInlineEnd: 10,
      position: 'fixed',
      right: '1980px',
      bottom: '300px',
   };

   const iconStyle: CSSProperties = {
      color: 'orange',
      fontSize: '25px',
      marginLeft: '-2px',
   };

   return (
      <div>
         <FloatButton.Group shape="circle" style={buttonGroupStyle}>
            <FloatButton
               type={PlayMode.Loop == playMode ? 'primary' : 'default'}
               icon={<IconFont type="icon-xunhuan" style={iconStyle} />}
               onClick={() => {
                  setPlayMode(playMode == PlayMode.Normal ? PlayMode.Loop : PlayMode.Normal);
               }}
            />
         </FloatButton.Group>
      </div>
   );
};
