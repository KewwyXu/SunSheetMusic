import { App } from 'antd';
import { useCallback } from 'react';

export const useMessages = () => {
   const { message } = App.useApp();

   const succeedUploadingFile = useCallback(async () => {
      await message.success({
         content: 'MIDI文件解析成功',
         duration: 3,
      });
   }, [message]);

   const failUploadingOrParsingFile = useCallback(
      async (content?: string) => {
         await message.error({
            content: content ?? 'MIDI文件解析失败',
            duration: 3,
         });
      },
      [message]
   );

   return {
      succeedUploadingFile,
      failUploadingOrParsingFile,
   };
};
