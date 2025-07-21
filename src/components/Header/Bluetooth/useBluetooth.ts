import { ItemType } from 'antd/es/menu/interface';
import { useState } from 'react';
import { App } from 'antd';
import { KDP120G_BLE } from '../../../consts/KDP120G_BLE';

export const useBluetooth = () => {
   const { message } = App.useApp();
   const [isConnecting, setIsConnecting] = useState(false);
   const [server, setServer] = useState<BluetoothRemoteGATTServer>(null);
   const bluetooth = navigator.bluetooth;

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
         const unknownService = await server.getPrimaryService(KDP120G_BLE.PianoService.UUID);
         const characteristic = await unknownService.getCharacteristic(
            KDP120G_BLE.PianoService.characteristics[0].UUID
         );

         await characteristic.startNotifications();

         characteristic.addEventListener('characteristicvaluechanged', (e) => {
            const value = (e.currentTarget as BluetoothRemoteGATTCharacteristic).value;
            const pitch = value.getInt8(3);
            console.log(pitch);
         });

         setServer(server);
         message.success(`已连接到设备: ${device.name}`, 3);
      } catch (error) {
         message.error(`连接失败: ${error.message}`, 3);
      } finally {
         setIsConnecting(false);
      }
   };
   const disconnectBluetoothOnClick = async () => {
      if (server) {
         server.disconnect();
         setServer(null);
         message.success('已断开蓝牙设备连接', 3);
      } else {
         message.warning('没有连接的蓝牙设备', 3);
      }
   };

   const bluetoothMenuItem: ItemType = {
      label: '蓝牙',
      key: 'Bluetooth',
      children: [
         {
            key: 'ConnectBluetooth',
            label: '连接钢琴蓝牙',
            onClick: connectBluetoothOnClick,
            disabled: isConnecting || !!server,
         },
         {
            key: 'ConnectedBluetoothServer',
            label: `${server.device.name} 连接中...`,
            disabled: !server,
         },
         {
            key: 'DisconnectBluetooth',
            label: '断开连接',
            onClick: disconnectBluetoothOnClick,
            disabled: !server,
         },
      ],
   };

   return {
      bluetoothMenuItem,
      isConnecting,
   };
};
