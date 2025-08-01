import { FC, RefObject, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay as OSMD } from 'opensheetmusicdisplay';
import { IOSMDOptions } from 'opensheetmusicdisplay/build/dist/src/OpenSheetMusicDisplay/OSMDOptions';
import { useMessages } from '../../utils/hooks/useMessages';
import { App, Skeleton, Spin } from 'antd';
import { CORRECT_KEY_COLOR, FOCUS_KEY_COLOR, WRONG_KEY_COLOR } from '../../consts/colors';
import * as im from 'immutable';
import { Cursor, Measure, NoteBox } from './types/Sheet';
import { AppContext } from '../../contexts/AppContext';
import { CORRECT_PITCH_HIGHLIGHT_TIME, PROCESS_SHEET_TIME_INTERVAL_TIME } from '../../consts/times';
import { HandMode } from '../../enums/HandMode';
import { getMIDINumber } from '../../utils/getMIDINumber';
import { NoteStep } from '../../types/NoteStep';
import { parseXML } from '../../utils/parseXML';

export interface OpenSheetMusicDisplayProps {
   options: IOSMDOptions;
   file: string;
   handMode: HandMode;
}

export const OpenSheetMusicDisplay: FC<OpenSheetMusicDisplayProps> = (props) => {
   const divRef: RefObject<HTMLDivElement> = useRef(null);
   const skeletonRef: RefObject<HTMLDivElement> = useRef(null);
   const osmdRef: RefObject<OSMD> = useRef(null);
   const { succeedUploadingFile } = useMessages();
   const { message } = App.useApp();
   const { options, file, handMode } = props;
   const { enableBluetooth, cursor, setCursor, ringingPitches } = useContext(AppContext);
   const [isLoading, setIsLoading] = useState<boolean>(false);
   const hasProcessedSheetRef = useRef(false);
   const intervalIdRef = useRef(0);
   const previousCursorRef = useRef<Cursor>(null);
   const allCursorsRef = useRef<Cursor[]>(null);
   const highlightTimeOutsRef = useRef<number[]>(null);

   const svgNS = 'http://www.w3.org/2000/svg';
   const boxGroupClassName = 'custom-box-group';
   const partBoxGroupClassName = 'custom-part-box-group';
   const boxClassName = 'custom-box';

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
      (startTick: number, noteBoxByStartTickMap: im.Map<number, NoteBox[]>, staffLines: SVGGElement[]) => {
         hideCursor(previousCursorRef.current);

         const newNoteBoxes = noteBoxByStartTickMap.get(startTick);
         const staffLineGroupIndex = newNoteBoxes[0].note.measure.staffLineIndex / 2;

         const newCursor: Cursor = {
            noteBoxes: newNoteBoxes,
            startTick: startTick,
            staffLineGroupIndex: staffLineGroupIndex,
            staffLineGroup: [staffLines[staffLineGroupIndex * 2], staffLines[staffLineGroupIndex * 2 + 1]],
         };

         console.log(newNoteBoxes.map((x) => x.note.parentNote.getAttribute('data-pitches')));

         setCursor(newCursor);
         previousCursorRef.current = newCursor;
      },
      [setCursor]
   );

   useEffect(() => {
      if (!cursor) {
         return;
      }

      let validNoteBoxes: NoteBox[] = cursor.noteBoxes;

      if (handMode == HandMode.Right) {
         validNoteBoxes = cursor.noteBoxes.filter((x) => x.note.partIndex == 0);
      }

      if (handMode == HandMode.Left) {
         validNoteBoxes = cursor.noteBoxes.filter((x) => x.note.partIndex == 1);
      }

      validNoteBoxes.forEach((x) => {
         x.box.setAttribute('fill', FOCUS_KEY_COLOR);
      });
   }, [cursor]);

   //process bluetooth note event
   useEffect(() => {
      if (ringingPitches && cursor) {
         highlightTimeOutsRef.current?.forEach(window.clearTimeout);

         const wrongPitches = new Set<number>();
         const notesCorrection: boolean[] = [];
         const validNoteBoxes = cursor.noteBoxes.filter((x) => x.box.getAttribute('fill') === FOCUS_KEY_COLOR);

         for (const noteBox of validNoteBoxes) {
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

            if (newCursor.staffLineGroupIndex > cursor.staffLineGroupIndex) {
               newCursor.staffLineGroup[0].scrollIntoView({
                  behavior: 'smooth', // 平滑滚动
                  block: 'center', // 垂直居中
                  inline: 'nearest', // 水平方向保持原样
               });
            }

            setCursor(newCursor);
            previousCursorRef.current = newCursor;
            hideCursor(cursor);
         } else {
            highlightTimeOutsRef.current = [];
            validNoteBoxes.forEach((noteBox, index) => {
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

   //process handMode change
   useEffect(() => {
      setIsLoading(true);

      const sheetContainer = divRef.current;
      const svg = sheetContainer?.children?.[0]?.children?.[0] as SVGElement;

      if (!svg) {
         return;
      }

      const staffLines = Array.from(svg.getElementsByClassName('staffline')) as SVGGElement[];
      const partBoxGroups = Array.from(svg.getElementsByClassName(partBoxGroupClassName)) as SVGGElement[];

      for (let i = 0; i < staffLines.length; i++) {
         if ((handMode == HandMode.Right && i % 2 == 1) || (handMode == HandMode.Left && i % 2 == 0)) {
            staffLines[i].setAttribute('opacity', '0.5');
            staffLines[i].setAttribute('disabled', 'true');
            partBoxGroups[i % 2].setAttribute('pointer-events', 'none');
            cursor?.noteBoxes.forEach((noteBox) => {
               if (noteBox.note.partIndex === i % 2) {
                  noteBox.box.setAttribute('fill', 'transparent');
               }
            });
         } else {
            staffLines[i].removeAttribute('opacity');
            staffLines[i].removeAttribute('disabled');
            partBoxGroups[i % 2].removeAttribute('pointer-events');
            cursor?.noteBoxes.forEach((noteBox) => {
               if (noteBox.note.partIndex === i % 2) {
                  noteBox.box.setAttribute('fill', FOCUS_KEY_COLOR);
               }
            });
         }
      }

      setIsLoading(false);
   }, [handMode]);

   const addCursors = (
      svg: SVGElement,
      note: SVGGElement,
      childNote: SVGGElement,
      stems: SVGGElement[],
      noteHeads: SVGGElement[],
      noteBoxByStartTickMap: im.Map<number, NoteBox[]>,
      startTick: number,
      partCount: number,
      partIndex: number,
      measure: Measure,
      staffLines: SVGGElement[]
   ) => {
      let boxGroup = svg.getElementsByClassName(boxGroupClassName)?.[0] as SVGGElement;
      const partBoxGroups = Array.from(svg.getElementsByClassName(partBoxGroupClassName)) as SVGGElement[];

      if (!boxGroup) {
         boxGroup = document.createElementNS(svgNS, 'g') as SVGGElement;
         const svgChildNodes = Array.from(svg.childNodes);
         svgChildNodes.forEach((x) => svg.removeChild(x));
         svg.append(boxGroup, ...svgChildNodes);

         for (let i = 0; i < partCount; i++) {
            const partBoxGroup = document.createElementNS(svgNS, 'g') as SVGGElement;
            partBoxGroup.id = `custom-part-${i}`;
            partBoxGroup.classList.add(partBoxGroupClassName);
            partBoxGroups.push(partBoxGroup);
            boxGroup.append(partBoxGroup);
         }
      }

      const box = document.createElementNS(svgNS, 'rect') as SVGRectElement;
      box.classList.add(boxClassName);
      boxGroup.classList.add(boxGroupClassName);
      partBoxGroups[partIndex].append(box);

      const stem = (childNote.getElementsByClassName('vf-stem')?.[0] ??
         stems.find((x) => x.id.includes(note.id))) as SVGGElement;
      const noteBBox = note.getBBox();
      let x = 0,
         y = 0,
         height = 0,
         width = 0;

      if (stem) {
         const stemBBox = stem.getBBox();
         x = Math.min(noteBBox.x, stemBBox.x);
         y = Math.min(noteBBox.y, stemBBox.y);
         width = Math.max(noteBBox.width, stemBBox.width);
         height =
            Math.max(noteBBox.y + noteBBox.height, stemBBox.y + stemBBox.height) - Math.min(noteBBox.y, stemBBox.y);
      } else {
         x = noteBBox.x;
         y = noteBBox.y;
         width = noteBBox.width;
         height = noteBBox.height;
      }

      initNoteBox(box, x, y, height, width);

      const noteBox: NoteBox = {
         box: box,
         note: {
            measure: measure,
            partIndex: partIndex,
            parentNote: note,
            heads: noteHeads,
            stem: stem,
         },
      };

      noteBoxByStartTickMap.update(startTick, (arr) => [noteBox].concat(arr ?? []));

      const onClick = () => boxOnClick(startTick, noteBoxByStartTickMap, staffLines);
      box.onclick = onClick;
      note.onclick = onClick;
      if (stem) {
         stem.onclick = onClick;
      }
   };

   const initNoteBox = (box: SVGRectElement, x: number, y: number, height: number, width: number) => {
      box.setAttribute('x', x.toString());
      box.setAttribute('y', y.toString());
      box.setAttribute('width', width.toString());
      box.setAttribute('height', height.toString());
      box.setAttribute('fill', 'transparent');
   };

   const processSheet = useCallback(() => {
      const sheetContainer = divRef.current;
      const svg = sheetContainer?.children?.[0]?.children?.[0] as SVGElement;

      if (!svg) {
         return;
      }

      skeletonRef.current.style.display = null;
      divRef.current.setAttribute('opacity', '0');

      const xmlPartMeasures = parseXML(file);
      const staffLines = Array.from(svg?.getElementsByClassName('staffline') ?? []) as SVGGElement[];
      const parts: Array<Array<Measure>> = [[], []];
      const noteBoxByStartTickMap = im.Map<number, NoteBox[]>().asMutable();

      for (let i = 0; i < staffLines.length; i++) {
         const measures = Array.from(staffLines[i].getElementsByClassName('vf-measure')) as SVGGElement[];
         parts[i % 2].push(
            ...measures.map((x) => {
               return {
                  measureNode: x,
                  staffLineIndex: i,
               } as Measure;
            })
         );
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
            const staveNotes = Array.from(measure.measureNode.getElementsByClassName('vf-stavenote')) as SVGGElement[];

            if (xmlNotes.length !== staveNotes.length) {
               throw 'XML measure和SVG measure中的音符数量不匹配，请检查文件格式。';
            }

            const stems = Array.from(measure.measureNode.getElementsByClassName('vf-stem')) as SVGGElement[];

            for (let noteIndex = 0; noteIndex < staveNotes.length; noteIndex++) {
               const note = staveNotes[noteIndex];
               const childNote = note.getElementsByClassName('vf-note')[0] as SVGGElement;
               const noteHeads = Array.from(childNote.getElementsByClassName('vf-notehead')) as SVGGElement[];
               const xmlNote = xmlNotes[noteIndex];
               const pitches = Array.from(xmlNote.getElementsByTagName('pitch')).map((x) =>
                  getMIDINumber(
                     x.getElementsByTagName('step')[0].innerHTML as NoteStep,
                     Number(x.getElementsByTagName('octave')[0].innerHTML),
                     Number(x.getElementsByTagName('alter')?.[0]?.innerHTML ?? 0)
                  )
               );
               const duration = Number(xmlNote.getElementsByTagName('duration')[0].innerHTML);
               const startTick = currentTick;

               note.setAttribute('data-pitches', pitches.toString());
               note.setAttribute('data-startTick', startTick.toString());
               currentTick += duration;
               note.setAttribute('data-endTick', currentTick.toString());

               if (pitches.length === 0) {
                  continue;
               }

               addCursors(
                  svg,
                  note,
                  childNote,
                  stems,
                  noteHeads,
                  noteBoxByStartTickMap,
                  startTick,
                  parts.length,
                  partIndex,
                  measure,
                  staffLines
               );
            }
         }
      }

      allCursorsRef.current = [];
      for (const entry of noteBoxByStartTickMap) {
         const staffLineGroupIndex = entry[1][0].note.measure.staffLineIndex / 2;
         allCursorsRef.current.push({
            startTick: entry[0],
            noteBoxes: entry[1],
            staffLineGroupIndex: staffLineGroupIndex,
            staffLineGroup: [staffLines[staffLineGroupIndex * 2], staffLines[staffLineGroupIndex * 2 + 1]],
         });
      }
      allCursorsRef.current.sort((a, b) => a.startTick - b.startTick);

      skeletonRef.current.style.display = 'none';
      divRef.current.setAttribute('opacity', '1');
   }, []);

   useEffect(() => {
      if (file) {
         osmdRef.current ??= new OSMD(divRef.current, options);
         osmdRef.current.load(file).then(async () => {
            render();
            await succeedUploadingFile();
         });
      }
   }, [options, file]);

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
      }, PROCESS_SHEET_TIME_INTERVAL_TIME);
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
