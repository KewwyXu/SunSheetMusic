import React, { useContext, useMemo, useState } from 'react';
import { OpenSheetMusicDisplay } from './OpenSheetMusicDisplay';
import { InboxOutlined } from '@ant-design/icons';
import { Content } from 'antd/es/layout/layout';
import { Spin, theme } from 'antd';
import Dragger from 'antd/es/upload/Dragger';
import { useBody } from './useBody';
import { IOSMDOptions } from 'opensheetmusicdisplay';
import { AppContext } from '../../contexts/AppContext';
import { HandModeFloatSwitcher } from './HandModeFloatSwitcher';
import { HandMode } from '../../enums/HandMode';

export interface BodyProps {}

export const Body: React.FC<BodyProps> = (props) => {
   const {
      token: { colorBgContainer, borderRadiusLG },
   } = theme.useToken();

   const { xml, isLoading } = useContext(AppContext);
   const { uploadProps } = useBody(props);
   const [handMode, setHandMode] = useState(HandMode.Double);

   const options: IOSMDOptions = useMemo(() => {
      return {
         autoResize: true,
         drawTitle: true,
         drawLyrics: true,
         autoBeam: true,
      };
   }, []);

   if (isLoading) {
      return <Spin size="large" />;
   }

   return (
      <Content style={{ padding: '' }}>
         <div
            style={{
               background: colorBgContainer,
               minHeight: 900,
               padding: 24,
               borderRadius: borderRadiusLG,
            }}
         >
            {!xml ? (
               <Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon" style={{ marginTop: '300px' }}>
                     <InboxOutlined />
                  </p>
                  <p className="ant-upload-text font-bold%" style={{ height: '400px', fontSize: '50px' }}>
                     点击或拖拽 MIDI 或 MusicXML 文件到这里
                  </p>
               </Dragger>
            ) : (
               <div>
                  <OpenSheetMusicDisplay file={xml} options={options} handMode={handMode} />
                  <HandModeFloatSwitcher handMode={handMode} setHandMode={setHandMode} />
               </div>
            )}
         </div>
      </Content>
   );
};
