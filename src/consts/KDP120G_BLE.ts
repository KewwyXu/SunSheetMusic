export const KDP120G_BLE = {
   GenericAccessServiceUUID: '00001800-0000-1000-8000-00805f9b34fb',
   GenericAttributeServiceUUID: '00001801-0000-1000-8000-00805f9b34fb',
   PianoService: {
      UUID: '03B80E5A-EDE8-4B33-A751-6CE34EC4C700'.toLowerCase(),
      characteristics: [
         {
            UUID: '7772E5DB-3868-4112-A1A9-F2669D106BF3'.toLowerCase(),
            name: 'Note',
         },
      ],
   },
};
