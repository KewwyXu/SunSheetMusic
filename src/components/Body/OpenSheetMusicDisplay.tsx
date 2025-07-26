import { FC, RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay as OSMD } from 'opensheetmusicdisplay';
import { IOSMDOptions } from 'opensheetmusicdisplay/build/dist/src/OpenSheetMusicDisplay/OSMDOptions';
import { useMessages } from '../../utils/hooks/useMessages';
import { Spin } from 'antd';
import { DEFAULT_KEY_COLOR, FOCUS_KEY_COLOR } from '../../consts/colors';

export interface OpenSheetMusicDisplayProps {
   options: IOSMDOptions;
   file: string;
   enableBluetooth: boolean;
}

export const OpenSheetMusicDisplay: FC<OpenSheetMusicDisplayProps> = (props) => {
   const divRef: RefObject<HTMLDivElement> = useRef(null);
   const osmdRef: RefObject<OSMD> = useRef(null);
   const { succeedUploadingFile } = useMessages();
   const { options, file } = props;
   let { enableBluetooth } = props;
   enableBluetooth = true; //TODO to be commented
   const [isLoading, setIsLoading] = useState<boolean>(false);
   const hasProcessedSheetRef = useRef(false);
   const intervalIdRef = useRef(0);
   const [focusingPitches, setFocusingPitches] = useState<Array<number>>([]);

   const render = () => {
      if (!osmdRef.current) {
         return;
      }

      setIsLoading(true);
      osmdRef.current.render();
      setIsLoading(false);
   };

   const processSheet = useCallback(() => {
      const sheetContainer = divRef.current;
      const svg = sheetContainer?.children?.[0]?.children?.[0] as SVGElement;

      if (!svg) {
         return;
      }

      const xmlPartMeasures = parseXML();
      const staffLines = svg.getElementsByClassName('staffline');
      const parts: Array<Array<SVGGElement>> = [[], []];

      for (let i = 0; i < staffLines.length; i++) {
         const measures = Array.from(staffLines[i].getElementsByClassName('vf-measure')) as SVGGElement[];
         parts[i % 2].push(...measures);
      }

      for (let partIndex = 0; partIndex < parts.length; partIndex++) {
         const part = parts[partIndex];
         const xmlPart = xmlPartMeasures[partIndex];

         if (part.length !== xmlPart.length) {
            throw 'XML part和SVG part中的小节数量不匹配，请检查文件格式。';
         }

         let currentTick = 0;

         for (let measureIndex = 0; measureIndex < part.length; measureIndex++) {
            const measure = part[measureIndex];
            const xmlMeasure = xmlPart[measureIndex];

            const xmlNotes = xmlMeasure.getElementsByTagName('note');
            const staveNotes = Array.from(measure.getElementsByClassName('vf-stavenote')) as SVGGElement[];

            if (xmlNotes.length !== staveNotes.length) {
               throw 'XML measure和SVG measure中的音符数量不匹配，请检查文件格式。';
            }

            const stems = Array.from(measure.getElementsByClassName('vf-stem')) as SVGGElement[];

            for (let noteIndex = 0; noteIndex < staveNotes.length; noteIndex++) {
               const note = staveNotes[noteIndex];
               const xmlNote = xmlNotes[noteIndex];
               const pitches = Array.from(xmlNote.getElementsByTagName('pitch')).map((x) =>
                  Number(x.getElementsByTagName('MIDINumber')[0].innerHTML)
               );
               const duration = Number(xmlNote.getElementsByTagName('duration')[0].innerHTML);
               const stemOfNote = stems.find((x) => x.id.includes(note.id));

               note.setAttribute('data-pitches', pitches.toString());
               note.setAttribute('data-startTick', currentTick.toString());
               currentTick += duration;
               note.setAttribute('data-endTick', currentTick.toString());

               const measureBBox = measure.getBBox();
               const correspondingMeasure = parts[(partIndex + 1) % 2][measureIndex];
               const correspondingMeasureBBox = correspondingMeasure.getBBox();

               createCursors(note, measureBBox, correspondingMeasureBBox);
            }
         }
      }
   }, []);

   const createCursors = (note: SVGGElement, measureBBox: DOMRect, correspondingMeasureBBox: DOMRect) => {
      const sheetContainer = divRef.current;
      const svg = sheetContainer?.children?.[0]?.children?.[0] as SVGElement;
      const noteHeadBBox = note.getBBox();
      const cursorGroupClassName = 'custom-cursor-group';
      const cursorClassName = 'custom-cursor';
      const svgNS = 'http://www.w3.org/2000/svg';
      const cursorGroup = (svg.getElementsByClassName(cursorGroupClassName)?.[0] ??
         document.createElementNS(svgNS, 'g')) as SVGGElement;
      cursorGroup.classList.add(cursorGroupClassName);
      const cursor = document.createElementNS(svgNS, 'rect') as SVGRectElement;
      cursorGroup.appendChild(cursor);
      cursor.classList.add(cursorClassName);

      const cursorY = Math.min(measureBBox.y, correspondingMeasureBBox.y);
      const cursorHeight = measureBBox.height + correspondingMeasureBBox.height;

      cursor.setAttribute('x', noteHeadBBox.x.toString());
      cursor.setAttribute('y', cursorY.toString());
      cursor.setAttribute('width', noteHeadBBox.width.toString());
      cursor.setAttribute('height', cursorHeight.toString());
      cursor.setAttribute('fill', 'transparent');
      cursor.onclick = () => {
         const focusingCursor = (Array.from(svg.getElementsByClassName(cursorClassName)) as SVGRectElement[]).find(
            (x) => x.getAttribute('fill') === FOCUS_KEY_COLOR
         );

         focusingCursor?.setAttribute('fill', 'transparent');
         cursor.setAttribute('fill', FOCUS_KEY_COLOR);
      };

      const svgChildNodes = Array.from(svg.childNodes);
      svgChildNodes.forEach((x) => svg.removeChild(x));
      svg.append(cursorGroup, ...svgChildNodes);
   };

   const parseXML = () => {
      const xmlString = file ?? window.sessionStorage.getItem('xml');
      const xml = new DOMParser().parseFromString(xmlString, 'text/xml');

      const parts = xml.getElementsByTagName('part');
      const partMeasures: Array<Array<Element>> = [[], []];

      for (let i = 0; i < parts.length; i++) {
         const measures = Array.from(parts[i].getElementsByTagName('measure'));
         partMeasures[i % 2].push(...measures);
      }

      return partMeasures;
   };

   useEffect(() => {
      if (file) {
         osmdRef.current ??= new OSMD(divRef.current, options);
         osmdRef.current.load(file).then(async () => {
            render();
            await succeedUploadingFile();
         });
      }
   }, [options, file, succeedUploadingFile]);

   const handleResize = useCallback(() => {
      render();
      hasProcessedSheetRef.current = false;
   }, []);

   // 监听窗口 resize
   useEffect(() => {
      window.addEventListener('resize', handleResize);
      return () => {
         window.removeEventListener('resize', handleResize);
      };
   }, [handleResize]);

   useEffect(() => {
      window.sessionStorage.setItem('xml', file);
      hasProcessedSheetRef.current = false;
      window.clearInterval(intervalIdRef.current);

      intervalIdRef.current = window.setInterval(() => {
         if (divRef.current) {
            divRef.current.onchange ??= processSheet;
         }
         if (!hasProcessedSheetRef.current && enableBluetooth) {
            hasProcessedSheetRef.current = true;
            divRef.current.onchange(null);
         }
      }, 1000);
   }, [file, enableBluetooth, hasProcessedSheetRef.current]);

   if (isLoading) {
      return <Spin />;
   }

   return <div id={'sheetContainer'} ref={divRef} />;
};
