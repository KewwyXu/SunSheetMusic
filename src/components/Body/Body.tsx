import React, { useContext, useMemo } from 'react';
import { OpenSheetMusicDisplay } from './OpenSheetMusicDisplay';
import { InboxOutlined } from '@ant-design/icons';
import { Content } from 'antd/es/layout/layout';
import { Spin, theme } from 'antd';
import Dragger from 'antd/es/upload/Dragger';
import { useBody } from './useBody';
import { CursorType, IOSMDOptions } from 'opensheetmusicdisplay';
import { AppContext } from '../../contexts/AppContext';

export interface BodyProps {}

export const Body: React.FC<BodyProps> = (props) => {
   const {
      token: { colorBgContainer, borderRadiusLG },
   } = theme.useToken();

   const { xml, isLoading } = useContext(AppContext);
   const { uploadProps } = useBody(props);

   const options: IOSMDOptions = useMemo(() => {
      return {
         autoResize: true,
         drawTitle: true,
         drawLyrics: true,
         autoBeam: true,
         followCursor: true,
         disableCursor: false,
         cursorsOptions: [
            {
               follow: true,
               type: CursorType.Standard,
               alpha: 0.5,
               color: 'blue',
            },
         ],
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
            {!xml && (
               <Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon" style={{ marginTop: '300px' }}>
                     <InboxOutlined />
                  </p>
                  <p className="ant-upload-text font-bold%" style={{ height: '400px', fontSize: '50px' }}>
                     点击或拖拽MIDI文件到这里
                  </p>
               </Dragger>
            )}

            <OpenSheetMusicDisplay file={xml} options={options} />
         </div>
      </Content>
   );
};
