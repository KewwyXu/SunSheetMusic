import { BodyProps } from './Body';
import { useParseMIDIToXML } from '../../utils/hooks/useParseMIDIToXML';
import type { UploadProps } from 'antd';
import { useContext } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { ALLOWED_FILE_EXTENSIONS_TO_PARSE } from '../../consts/common';

export const useBody = (props: BodyProps) => {
   const { setXml, setIsLoading } = useContext(AppContext);
   const { parseMIDIToXML } = useParseMIDIToXML();

   const handleFileChange = async (file: File) => {
      setIsLoading(true);
      if (file.name.endsWith('.xml')) {
         setXml(await file.text());
      } else if (file.name.endsWith('.midi') || file.name.endsWith('.mid')) {
         await parseMIDIToXML(file, setXml);
      }
      setIsLoading(false);
   };

   const uploadProps: UploadProps = {
      name: 'file',
      multiple: false,
      accept: ALLOWED_FILE_EXTENSIONS_TO_PARSE,
      onChange(info) {
         handleFileChange(info.file.originFileObj);
      },
      onDrop(e) {
         handleFileChange(e.dataTransfer.files[0]);
      },
   };

   return {
      uploadProps,
   };
};
