import { useMessages } from './useMessages';
import { API_HOST } from '../../consts/common';
import axios from 'axios';

export const useParseMIDIToXML = () => {
   const { failUploadingOrParsingFile } = useMessages();

   async function parseMIDIToXML(file: File, successCallback?: (xml: string) => void) {
      const formData = new FormData();
      formData.append('midiFile', file);

      try {
         const response = await axios.post(`${API_HOST}parseMIDIToXML`, formData, {
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
