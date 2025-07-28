import React, { useState } from 'react';
import { App as AntdApp, ConfigProvider, Layout } from 'antd';
import { useApp } from './useApp';
import { Body } from './components/Body/Body';
import { Header } from './components/Header/Header';
import { Cursor } from './components/Body/types/Sheet';
import { AppContext } from './contexts/AppContext';

export const App: React.FC = () => {
   const { Footer } = Layout;
   const { xml, setXml, isLoading, setIsLoading } = useApp();
   const [enableBluetooth, setEnableBluetooth] = useState(false);
   const [cursor, setCursor] = useState<Cursor>();
   const [ringingPitches, setRingingPitches] = useState<Set<number>>();

   return (
      <ConfigProvider
         theme={{
            token: {
               // Seed Token，影响范围大
               colorPrimary: '#bf470f',
               borderRadius: 2,

               // 派生变量，影响范围小
               colorBgContainer: '#f6ffed',
            },
         }}
      >
         <AntdApp>
            <AppContext
               value={{
                  xml,
                  setXml,
                  isLoading,
                  setIsLoading,
                  enableBluetooth,
                  setEnableBluetooth,
                  cursor,
                  setCursor,
                  ringingPitches,
                  setRingingPitches,
               }}
            >
               <Layout>
                  <Header />
                  <Body />
                  <Footer style={{ textAlign: 'center' }}>
                     Sun Sheet Music ©{new Date().getFullYear()} Created by Kewwy Xu. A gift to my sun.
                  </Footer>
               </Layout>
            </AppContext>
         </AntdApp>
      </ConfigProvider>
   );
};
