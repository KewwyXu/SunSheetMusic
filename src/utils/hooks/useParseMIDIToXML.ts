import { useMessages } from './useMessages';
import { AxiosClient } from '../../AxiosClient';

export const useParseMIDIToXML = () => {
   const { failUploadingOrParsingFile } = useMessages();

   async function parseMIDIToXML(file: File, successCallback?: (xml: string) => void) {
      const formData = new FormData();
      formData.append('midiFile', file);

      try {
         const response = await AxiosClient.post(`parseMIDIToXML`, formData, {
            headers: {
               'Content-Type': 'multipart/form-data',
            },
         });

         if (response.status === 200 && response.data.xml) {
            successCallback(response.data.xml);
         } else {
            throw response.data.error;
         }
      } catch (error) {
         await failUploadingOrParsingFile(`MIDI文件解析失败: ${error}`);
      }
   }

   return {
      parseMIDIToXML,
   };
};
