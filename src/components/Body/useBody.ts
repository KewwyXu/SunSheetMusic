import { BodyProps } from './Body';
import { useParseMIDIToXML } from '../../utils/hooks/useParseMIDIToXML';
import type { UploadProps } from 'antd';
import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';

export const useBody = (props: BodyProps) => {
   const { setXml, setIsLoading } = useContext(AppContext);
   const { parseMIDIToXML } = useParseMIDIToXML();

   const handleFileChange = async (file: File) => {
      setIsLoading(true);
      parseMIDIToXML(file, setXml);
      setIsLoading(false);
   };

   const uploadProps: UploadProps = {
      name: 'file',
      multiple: false,
      onChange(info) {
         handleFileChange(info.file.originFileObj);
      },
      onDrop(e) {
         parseMIDIToXML(e.dataTransfer.files[0]);
      },
   };

   return {
      uploadProps,
   };
};
