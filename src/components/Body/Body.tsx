import React, { Dispatch, useMemo } from 'react';
import { OpenSheetMusicDisplay } from './OpenSheetMusicDisplay';
import { InboxOutlined } from '@ant-design/icons';
import { Content } from 'antd/es/layout/layout';
import { Spin, theme } from 'antd';
import Dragger from 'antd/es/upload/Dragger';
import { useBody } from './useBody';

export interface BodyProps {
   xml: string;
   setXml: Dispatch<React.SetStateAction<string>>;
   isLoading: boolean;
   setIsLoading: Dispatch<React.SetStateAction<boolean>>;
}

export const Body: React.FC<BodyProps> = (props) => {
   const {
      token: { colorBgContainer, borderRadiusLG },
   } = theme.useToken();

   const { xml, isLoading } = props;
   const { uploadProps } = useBody(props);

   const options = useMemo(() => {
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
            {!xml && (
               <Dragger {...uploadProps}>
                  <p className="ant-upload-drag-icon">
                     <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽MIDI文件到这里</p>
               </Dragger>
            )}

            <OpenSheetMusicDisplay file={xml} options={options} />
         </div>
      </Content>
   );
};
