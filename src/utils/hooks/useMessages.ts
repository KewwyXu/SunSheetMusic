import { App } from 'antd';
import { useCallback } from 'react';
import { PARSE_MIDI_FAIL_MESSAGE_EXISTS_TIME, PARSE_MIDI_SUCCESS_MESSAGE_EXISTS_TIME } from '../../consts/times';

export const useMessages = () => {
   const { message } = App.useApp();

   const succeedUploadingFile = useCallback(async () => {
      await message.success({
         content: 'MIDI文件解析成功',
         duration: PARSE_MIDI_SUCCESS_MESSAGE_EXISTS_TIME,
      });
   }, [message]);

   const failUploadingOrParsingFile = useCallback(
      async (content?: string) => {
         await message.error({
            content: content ?? 'MIDI文件解析失败',
            duration: PARSE_MIDI_FAIL_MESSAGE_EXISTS_TIME,
         });
      },
      [message]
   );

   return {
      succeedUploadingFile,
      failUploadingOrParsingFile,
   };
};
