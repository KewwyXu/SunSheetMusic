import { ItemType } from 'antd/es/menu/interface';
import { useContext, useState } from 'react';
import { App } from 'antd';
import { KDP120G_BLE } from '../../../consts/KDP120G_BLE';
import { AppContext } from '../../../contexts/AppContext';

export interface UseBluetoothProps {}

export const useBluetooth = (props: UseBluetoothProps) => {
   const { message } = App.useApp();
   const [isConnecting, setIsConnecting] = useState(false);
   const [server, setServer] = useState<BluetoothRemoteGATTServer>(null);
   const bluetooth = navigator.bluetooth;
   const { setEnableBluetooth, setRingingPitches } = useContext(AppContext);

   const onCharacteristicValueChanged = (e) => {
      const value = (e.currentTarget as BluetoothRemoteGATTCharacteristic).value;
      const pitch = value.getInt8(3);
      const eventNumber = value.getInt8(2);

      console.log(`${Date.now()} : ${pitch}`);

      switch (eventNumber) {
         case -128:
            // note off
            setRingingPitches((oldRingingPitches) => {
               const newRingingPitches = new Set(oldRingingPitches);
               newRingingPitches.delete(pitch);
               return newRingingPitches;
            });
            break;
         case -112:
            // note on
            setRingingPitches((oldRingingPitches) => {
               const newRingingPitches = new Set(oldRingingPitches);
               newRingingPitches.add(pitch);
               return newRingingPitches;
            });
            break;
         default:
            throw `Unknown eventNumber: ${eventNumber}`;
      }
   };

   const connectBluetoothOnClick = async () => {
      setIsConnecting(true);
      if (!((await bluetooth?.getAvailability()) ?? false)) {
         setIsConnecting(false);
         message.error('蓝牙不可用，请检查设备设置', 3);
         return;
      }

      try {
         const device = await bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [KDP120G_BLE.PianoService.UUID],
         });
         const server = await device.gatt.connect();
         const pianoService = await server.getPrimaryService(KDP120G_BLE.PianoService.UUID);
         const characteristic = await pianoService.getCharacteristic(KDP120G_BLE.PianoService.characteristics[0].UUID);
         await characteristic.startNotifications();
         characteristic.oncharacteristicvaluechanged = onCharacteristicValueChanged;

         setServer(server);
         setEnableBluetooth(true);
         message.success(`已连接到设备: ${device.name}`, 1);
      } catch (error) {
         message.error(`连接失败: ${error.message}`, 3);
      } finally {
         setIsConnecting(false);
      }
   };

   const disconnectBluetoothOnClick = async () => {
      if (server) {
         server.disconnect();
         setEnableBluetooth(false);
         setServer(null);
         message.success('已断开蓝牙设备连接', 3);
      } else {
         message.warning('没有连接的蓝牙设备', 3);
      }
   };

   const bluetoothMenuItem: ItemType = {
      label: '蓝牙',
      key: 'Bluetooth',
      children: [],
   };

   if (server) {
      bluetoothMenuItem.children.push(
         {
            key: 'ConnectedBluetoothServer',
            label: `${server.device.name} 连接中...`,
         },
         {
            key: 'DisconnectBluetooth',
            label: '断开连接',
            onClick: disconnectBluetoothOnClick,
         }
      );
   } else {
      bluetoothMenuItem.children.push({
         key: 'ConnectBluetooth',
         label: '连接钢琴蓝牙',
         onClick: connectBluetoothOnClick,
      });
   }

   return {
      bluetoothMenuItem,
      isConnecting,
   };
};
