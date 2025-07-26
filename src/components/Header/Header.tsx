import { Layout, Menu } from 'antd';
import React from 'react';
import { useHeader } from './useHeader';

export interface HeaderProps {
   setXml: (xml: string) => void;
   setIsLoading: (isLoading: boolean) => void;
   setEnableBluetooth: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header: React.FC<HeaderProps> = (props) => {
   const { Header: AntdHeader } = Layout;
   const { openMIDIFile, menuItems } = useHeader(props);

   return (
      <AntdHeader
         style={{
            display: 'flex',
            alignItems: 'center',
            background: '#123456',
         }}
      >
         <div className="demo-logo" />
         <Menu theme="dark" mode="horizontal" items={menuItems} style={{ flex: 1, minWidth: 0 }} />
         <input
            type="file"
            ref={openMIDIFile.inputRef}
            style={{ display: 'none' }}
            onChange={openMIDIFile.handleFileChange}
         />
      </AntdHeader>
   );
};
