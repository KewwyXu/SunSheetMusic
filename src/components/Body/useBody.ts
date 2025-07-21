import { BodyProps } from './Body';
import { useParseMIDIToXML } from '../../utils/hooks/useParseMIDIToXML';
import type { UploadProps } from 'antd';

export const useBody = (props: BodyProps) => {
   const { setXml, setIsLoading } = props;
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
