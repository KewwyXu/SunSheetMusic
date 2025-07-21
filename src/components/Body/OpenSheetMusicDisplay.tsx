import React, { RefObject, useEffect, useRef } from 'react';
import { OpenSheetMusicDisplay as OSMD } from 'opensheetmusicdisplay';
import { IOSMDOptions } from 'opensheetmusicdisplay/build/dist/src/OpenSheetMusicDisplay/OSMDOptions';
import { useMessages } from '../../utils/hooks/useMessages';

export interface OpenSheetMusicDisplayProps {
   options: IOSMDOptions;
   file: string | Document;
}

export const OpenSheetMusicDisplay: React.FC<OpenSheetMusicDisplayProps> = (props) => {
   const divRef: React.RefObject<HTMLDivElement> = useRef(null);
   const osmdRef: RefObject<OSMD> = useRef(null);
   const { succeedUploadingFile } = useMessages();

   const { options, file } = props;

   // 初始化和更新 OSMD
   useEffect(() => {
      if (file) {
         if (!osmdRef.current) {
            osmdRef.current = new OSMD(divRef.current, options);
         }
         osmdRef.current.load(file).then(async () => {
            osmdRef.current.render();
            await succeedUploadingFile();
         });
      }
   }, [options, file, succeedUploadingFile]);

   // 监听窗口 resize
   useEffect(() => {
      const handleResize = () => {
         // 这里可以根据需要调用 osmdRef.current.render() 或 forceUpdate
         if (osmdRef.current) {
            osmdRef.current.render();
         }
      };
      window.addEventListener('resize', handleResize);
      return () => {
         window.removeEventListener('resize', handleResize);
      };
   }, []);

   return <div ref={divRef} />;
};
