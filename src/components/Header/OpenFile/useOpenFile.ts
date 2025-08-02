import React, { Dispatch, useRef } from 'react';
import { ItemType } from 'antd/es/menu/interface';
import { useParseMIDIToXML } from '../../../utils/hooks/useParseMIDIToXML';

export type UseOpenMIDIFileProps = {
   setXml: Dispatch<React.SetStateAction<string>>;
   setIsLoading: Dispatch<React.SetStateAction<boolean>>;
};

export const useOpenFile = (props: UseOpenMIDIFileProps) => {
   const inputRef = useRef<HTMLInputElement>(null);
   const { setXml, setIsLoading } = props;
   const { parseMIDIToXML } = useParseMIDIToXML();

   const handleOpenFolder = () => {
      inputRef.current?.click();
   };

   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      setIsLoading(true);

      const file = e.target.files[0];

      if (file) {
         if (file.name.endsWith('.xml')) {
            setXml(await file.text());
         } else if (file.name.endsWith('.midi') || file.name.endsWith('.mid')) {
            await parseMIDIToXML(file, setXml);
         }
      }

      setIsLoading(false);
   };

   const OpenFileMenuItem: ItemType = {
      label: '文件',
      key: 'File',
      children: [
         {
            key: 'OpenFile',
            label: '打开 MIDI 或 MusicXML 文件',
            onClick: handleOpenFolder,
         },
         // {
         //    key: 'SaveMusicSheet',
         //    label: '保存五线谱',
         // },
      ],
   };

   return {
      inputRef,
      handleFileChange,
      handleOpenFolder,
      OpenFileMenuItem,
   };
};
