import { Layout, Menu } from 'antd';
import React from 'react';
import { useHeader } from './useHeader';
import { ALLOWED_FILE_EXTENSIONS_TO_PARSE } from '../../consts/common';

export interface HeaderProps {}

export const Header: React.FC<HeaderProps> = (props) => {
   const { Header: AntdHeader } = Layout;
   const { openFile, menuItems } = useHeader(props);

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
            ref={openFile.inputRef}
            style={{ display: 'none' }}
            onChange={openFile.handleFileChange}
            accept={ALLOWED_FILE_EXTENSIONS_TO_PARSE}
         />
      </AntdHeader>
   );
};
