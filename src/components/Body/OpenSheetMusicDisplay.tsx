import { FC, RefObject, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay as OSMD } from 'opensheetmusicdisplay';
import { IOSMDOptions } from 'opensheetmusicdisplay/build/dist/src/OpenSheetMusicDisplay/OSMDOptions';
import { useMessages } from '../../utils/hooks/useMessages';
import { App, Skeleton, Spin } from 'antd';
import { CORRECT_KEY_COLOR, FOCUS_KEY_COLOR, WRONG_KEY_COLOR } from '../../consts/colors';
import * as im from 'immutable';
import { Cursor, NoteBox } from './types/Sheet';
import { AppContext } from '../../contexts/AppContext';
import { CORRECT_PITCH_HIGHLIGHT_TIME } from '../../consts/times';

export interface OpenSheetMusicDisplayProps {
   options: IOSMDOptions;
   file: string;
}

export const OpenSheetMusicDisplay: FC<OpenSheetMusicDisplayProps> = (props) => {
   const divRef: RefObject<HTMLDivElement> = useRef(null);
   const skeletonRef: RefObject<HTMLDivElement> = useRef(null);
   const osmdRef: RefObject<OSMD> = useRef(null);
   const { succeedUploadingFile } = useMessages();
   const { message } = App.useApp();
   const { options, file } = props;
   const { enableBluetooth, cursor, setCursor, ringingPitches } = useContext(AppContext);
   const [isLoading, setIsLoading] = useState<boolean>(false);
   const hasProcessedSheetRef = useRef(false);
   const intervalIdRef = useRef(0);
   const previousCursorRef = useRef<Cursor>(null);
   const allCursorsRef = useRef<Cursor[]>(null);
   const highlightTimeOutsRef = useRef<number[]>(null);

   const render = () => {
      if (!osmdRef.current) {
         return;
      }

      setIsLoading(true);
      osmdRef.current.render();
      setIsLoading(false);
   };

   const hideCursor = (cursor: Cursor) => {
      cursor?.noteBoxes.forEach((x) => {
         x.box.setAttribute('fill', 'transparent');
      });
   };

   const boxOnClick = useCallback(
      (startTick: number, noteBoxByStartTickMap: im.Map<number, NoteBox[]>) => {
         hideCursor(previousCursorRef.current);

         const newNoteBoxes = noteBoxByStartTickMap.get(startTick);

         const newCursor = {
            noteBoxes: newNoteBoxes,
            startTick: startTick,
         };

         console.log(newNoteBoxes.map((x) => x.note.parentNote.getAttribute('data-pitches')));

         setCursor(newCursor);
         previousCursorRef.current = newCursor;
      },
      [setCursor]
   );

   useEffect(() => {
      cursor?.noteBoxes.forEach((x) => {
         x.box.setAttribute('fill', FOCUS_KEY_COLOR);
      });
   }, [cursor]);

   useEffect(() => {
      if (ringingPitches && cursor) {
         highlightTimeOutsRef.current?.forEach(window.clearTimeout);

         const wrongPitches = new Set<number>();
         const notesCorrection: boolean[] = [];

         for (const noteBox of cursor.noteBoxes) {
            let hasWrongPitch = false;
            const pitches = noteBox.note.parentNote
               .getAttribute('data-pitches')
               .split(',')
               .map((x) => Number(x));

            for (const pitch of pitches) {
               if (!ringingPitches.has(pitch)) {
                  hasWrongPitch = true;
                  wrongPitches.add(pitch);
               }
            }

            notesCorrection.push(!hasWrongPitch);
         }

         //move to next cursor
         if (wrongPitches.size === 0) {
            const cursorIndex = allCursorsRef.current.findIndex((x) => x.startTick === cursor.startTick);

            //finish
            if (cursorIndex >= allCursorsRef.current.length - 1) {
               message.success('恭喜你，演奏结束！');
            }

            const newCursor = allCursorsRef.current[cursorIndex + 1];
            setCursor(newCursor);
            previousCursorRef.current = newCursor;
            hideCursor(cursor);
         } else {
            highlightTimeOutsRef.current = [];
            cursor.noteBoxes.forEach((noteBox, index) => {
               noteBox.box.setAttribute('fill', notesCorrection[index] ? CORRECT_KEY_COLOR : WRONG_KEY_COLOR);
               highlightTimeOutsRef.current.push(
                  window.setTimeout(() => {
                     noteBox.box.setAttribute('fill', FOCUS_KEY_COLOR);
                  }, CORRECT_PITCH_HIGHLIGHT_TIME)
               );
            });
         }
      }
   }, [ringingPitches, setCursor, message]);

   const processSheet = useCallback(() => {
      const sheetContainer = divRef.current;
      const svg = sheetContainer?.children?.[0]?.children?.[0] as SVGElement;

      if (!svg) {
         return;
      }

      skeletonRef.current.style.display = null;
      divRef.current.setAttribute('opacity', '0');

      const xmlPartMeasures = parseXML();
      const staffLines = svg.getElementsByClassName('staffline');
      const parts: Array<Array<SVGGElement>> = [[], []];
      const noteBoxByStartTickMap = im.Map<number, NoteBox[]>().asMutable();

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
               const childNote = note.getElementsByClassName('vf-note')[0] as SVGGElement;
               const noteHeads = Array.from(childNote.getElementsByClassName('vf-notehead')) as SVGGElement[];
               const xmlNote = xmlNotes[noteIndex];
               const pitches = Array.from(xmlNote.getElementsByTagName('pitch')).map((x) =>
                  Number(x.getElementsByTagName('MIDINumber')[0].innerHTML)
               );
               const duration = Number(xmlNote.getElementsByTagName('duration')[0].innerHTML);
               const startTick = currentTick;

               note.setAttribute('data-pitches', pitches.toString());
               note.setAttribute('data-startTick', startTick.toString());
               currentTick += duration;
               note.setAttribute('data-endTick', currentTick.toString());

               const stem = (childNote.getElementsByClassName('vf-stem')?.[0] ??
                  stems.find((x) => x.id.includes(note.id))) as SVGGElement;

               if (pitches.length === 0) {
                  continue;
               }

               const svgNS = 'http://www.w3.org/2000/svg';
               const boxGroupClassName = 'custom-box-group';
               const boxClassName = 'custom-box';
               let boxGroup = svg.getElementsByClassName(boxGroupClassName)?.[0] as SVGGElement;

               if (!boxGroup) {
                  boxGroup = document.createElementNS(svgNS, 'g') as SVGGElement;
                  const svgChildNodes = Array.from(svg.childNodes);
                  svgChildNodes.forEach((x) => svg.removeChild(x));
                  svg.append(boxGroup, ...svgChildNodes);
               }

               const box = document.createElementNS(svgNS, 'rect') as SVGRectElement;
               box.classList.add(boxClassName);
               boxGroup.classList.add(boxGroupClassName);
               boxGroup.append(box);

               const noteBBox = note.getBBox();
               const stemBBox = stem.getBBox();

               box.setAttribute('x', Math.min(noteBBox.x, stemBBox.x).toString());
               box.setAttribute('y', Math.min(noteBBox.y, stemBBox.y).toString());
               box.setAttribute('width', Math.max(noteBBox.width, stemBBox.width).toString());
               box.setAttribute(
                  'height',
                  (
                     Math.max(noteBBox.y + noteBBox.height, stemBBox.y + stemBBox.height) -
                     Math.min(noteBBox.y, stemBBox.y)
                  ).toString()
               );
               box.setAttribute('fill', 'transparent');

               const noteBox: NoteBox = {
                  box: box,
                  note: {
                     parentNote: note,
                     heads: noteHeads,
                     stem: stem,
                  },
               };

               noteBoxByStartTickMap.update(startTick, (arr) => [noteBox].concat(arr ?? []));

               const onClick = () => boxOnClick(startTick, noteBoxByStartTickMap);
               box.onclick = onClick;
               note.onclick = onClick;
               stem.onclick = onClick;
            }
         }
      }

      allCursorsRef.current = [];
      for (const entry of noteBoxByStartTickMap) {
         allCursorsRef.current.push({
            startTick: entry[0],
            noteBoxes: entry[1],
         });
      }
      allCursorsRef.current.sort((a, b) => a.startTick - b.startTick);

      skeletonRef.current.style.display = 'none';
      divRef.current.setAttribute('opacity', '1');
   }, [boxOnClick]);

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

            if (!hasProcessedSheetRef.current && enableBluetooth) {
               hasProcessedSheetRef.current = true;
               divRef.current.onchange(null);
            }
         }
      }, 1000);
   }, [file, enableBluetooth, hasProcessedSheetRef.current]);

   if (isLoading) {
      return <Spin />;
   }

   return (
      <div>
         <div ref={skeletonRef} style={{ display: 'none' }}>
            <Skeleton active={true} loading={true} />
         </div>

         <div id={'sheetContainer'} ref={divRef} />
      </div>
   );
};
