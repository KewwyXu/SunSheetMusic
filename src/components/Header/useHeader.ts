import { useOpenFile } from './OpenFile/useOpenFile';
import { useBluetooth } from './Bluetooth/useBluetooth';
import { GenericItemType } from '../../global';
import { HeaderProps } from './Header';
import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';

export const useHeader = (props: HeaderProps) => {
   const { setXml, setIsLoading } = useContext(AppContext);
   const openFile = useOpenFile({ setXml, setIsLoading });
   const bluetooth = useBluetooth({});

   const menuItems: GenericItemType[] = [
      openFile.OpenFileMenuItem,
      // {
      //    label: '历史文件',
      //    key: 2,
      // },
      // {
      //    label: '批量导入MIDI file',
      //    key: 3,
      // },
      // {
      //    label: '批量导入Music xml',
      //    key: 4,
      // },
      bluetooth.bluetoothMenuItem,
   ];

   return {
      openFile,
      bluetooth,
      menuItems,
   };
};
