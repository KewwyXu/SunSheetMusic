import { useOpenMIDIFile } from './OpenMIDIFile/useOpenMIDIFile';
import { useBluetooth } from './Bluetooth/useBluetooth';
import { GenericItemType } from '../../global';
import { HeaderProps } from './Header';

export const useHeader = (props: HeaderProps) => {
   const { setXml, setIsLoading, setEnableBluetooth } = props;
   const openMIDIFile = useOpenMIDIFile({ setXml, setIsLoading });
   const bluetooth = useBluetooth({
      setEnableBluetooth: props.setEnableBluetooth,
   });

   const menuItems: GenericItemType[] = [
      openMIDIFile.OpenMIDIFileMenuItem,
      {
         label: '历史文件',
         key: 2,
      },
      {
         label: '批量导入MIDI file',
         key: 3,
      },
      {
         label: '批量导入Music xml',
         key: 4,
      },
      bluetooth.bluetoothMenuItem,
   ];

   return {
      openMIDIFile,
      bluetooth,
      menuItems,
   };
};
