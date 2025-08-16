import { FC, RefObject, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay as OSMD } from 'opensheetmusicdisplay';
import { IOSMDOptions } from 'opensheetmusicdisplay/build/dist/src/OpenSheetMusicDisplay/OSMDOptions';
import { useMessages } from '../../utils/hooks/useMessages';
import { App, Skeleton, Spin } from 'antd';
import { CORRECT_KEY_COLOR, FOCUS_KEY_COLOR, WRONG_KEY_COLOR } from '../../consts/colors';
import * as im from 'immutable';
import { Cursor, LineForLoopMode, Measure, NoteBox } from './types/Sheet';
import { AppContext } from '../../contexts/AppContext';
import { CORRECT_PITCH_HIGHLIGHT_TIME, PROCESS_SHEET_TIME_INTERVAL_TIME } from '../../consts/times';
import { HandMode } from '../../enums/HandMode';
import { getMIDINumber } from '../../utils/getMIDINumber';
import { NoteStep } from '../../types/NoteStep';
import { parseXML } from '../../utils/parseXML';
import { PlayMode } from '../../enums/PlayMode';
import {
   addCursors,
   drawLine,
   handleHandModeChange,
   highlightLoopedStaffLines,
   isNoteOutOfLoopedStaffLines,
   removeHighlightedStaffLines,
} from './helpers/sheetHelper';

export interface OpenSheetMusicDisplayProps {
   options: IOSMDOptions;
   file: string;
   handMode: HandMode;
   playMode: PlayMode;
}

export const OpenSheetMusicDisplay: FC<OpenSheetMusicDisplayProps> = (props) => {
   const divRef: RefObject<HTMLDivElement> = useRef(null);
   const skeletonRef: RefObject<HTMLDivElement> = useRef(null);
   const osmdRef: RefObject<OSMD> = useRef(null);
   const { succeedUploadingFile } = useMessages();
   const { message } = App.useApp();
   const { options, file, handMode, playMode } = props;
   let { enableBluetooth, cursor, setCursor, ringingPitches } = useContext(AppContext);
   enableBluetooth = true;
   const [isLoading, setIsLoading] = useState<boolean>(false);
   const hasProcessedSheetRef = useRef(false);
   const intervalIdRef = useRef(0);
   const previousCursorRef = useRef<Cursor>(null);
   const allCursorsRef = useRef<Cursor[]>(null);
   const highlightTimeOutsRef = useRef<number[]>(null);

   /*
     Loop play mode
      */
   const startLineRef = useRef<LineForLoopMode>(null);
   const endLineRef = useRef<LineForLoopMode>(null);
   const clickStartNoteMessageId = 'clickStartNoteMessage';
   const clickEndNoteMessageId = 'clickEndNoteMessage';

   const render = () => {
      if (!osmdRef.current) {
         return;
      }

      setIsLoading(true);
      osmdRef.current.render();
      setIsLoading(false);
   };

   /*
     process playMode change
      */
   useEffect(() => {
      window.sessionStorage.setItem('playMode', playMode.toString());
      if (playMode == PlayMode.Loop) {
         message.info({
            key: clickStartNoteMessageId,
            content: '请点击开始音符',
            duration: 0,
            style: {
               marginTop: '20vh',
            },
         });
         setCursor(undefined);
         hideCursor(cursor);
         previousCursorRef.current = undefined;
      } else {
         message.destroy(clickStartNoteMessageId);
         message.destroy(clickEndNoteMessageId);
         startLineRef.current?.line.remove();
         endLineRef.current?.line.remove();
         removeHighlightedStaffLines();
         startLineRef.current = undefined;
         endLineRef.current = undefined;
      }
   }, [playMode]);

   const hideCursor = (cursor: Cursor) => {
      cursor?.noteBoxes.forEach((x) => {
         x.box.setAttribute('fill', 'transparent');
      });
   };

   const boxOnClick = useCallback(
      (startTick: number, noteBoxByStartTickMap: im.Map<number, NoteBox[]>, staffLines: SVGGElement[]) => {
         hideCursor(previousCursorRef.current);
         const newNoteBoxes = noteBoxByStartTickMap.get(startTick);
         const svg = divRef.current.children[0].children[0] as SVGElement;
         const playMode = window.sessionStorage.getItem('playMode') as PlayMode;
         const staffLineGroupIndex = Math.floor(newNoteBoxes[0].note.measure.staffLineIndex / 2);

         console.log(newNoteBoxes.map((x) => x.note.parentNote.getAttribute('data-pitches')));

         if (playMode == PlayMode.Normal || (startLineRef.current && endLineRef.current)) {
            if (
               playMode == PlayMode.Loop &&
               isNoteOutOfLoopedStaffLines(newNoteBoxes, startLineRef.current, endLineRef.current)
            ) {
               message.info('音符不在循环范围内，请重新选择音符', 1);
               return;
            }

            const newCursor: Cursor = {
               noteBoxes: newNoteBoxes,
               startTick: startTick,
               staffLineGroupIndex: staffLineGroupIndex,
               staffLineGroup: [staffLines[staffLineGroupIndex * 2], staffLines[staffLineGroupIndex * 2 + 1]],
            };

            setCursor(newCursor);
            previousCursorRef.current = newCursor;
         } else {
            const nearestCursorIndexInLoop = allCursorsRef.current.findIndex((x) => x.startTick == startTick);

            if (!startLineRef.current) {
               startLineRef.current = {
                  line: drawLine(newNoteBoxes, 'start', svg),
                  staffLineGroupIndex: staffLineGroupIndex,
                  nearestCursorIndexInLoop: nearestCursorIndexInLoop,
               };
               message.destroy(clickStartNoteMessageId);
               message.info({
                  key: clickEndNoteMessageId,
                  content: '请点击结束音符',
                  duration: 0,
                  style: {
                     marginTop: '20vh',
                  },
               });
            } else {
               endLineRef.current = {
                  line: drawLine(newNoteBoxes, 'end', svg),
                  staffLineGroupIndex: staffLineGroupIndex,
                  nearestCursorIndexInLoop: nearestCursorIndexInLoop,
               };
               highlightLoopedStaffLines(staffLines, startLineRef.current, endLineRef.current);
               message.destroy(clickEndNoteMessageId);
            }
         }
      },
      [setCursor, message]
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
            let newCursor: Cursor;

            //finish
            if (playMode == PlayMode.Normal) {
               if (cursorIndex >= allCursorsRef.current.length - 1) {
                  message.success('恭喜你，演奏结束！');
                  return;
               } else {
                  newCursor = allCursorsRef.current[cursorIndex + 1];
               }
            } else if (playMode == PlayMode.Loop) {
               if (cursorIndex == endLineRef.current.nearestCursorIndexInLoop) {
                  newCursor = allCursorsRef.current[startLineRef.current.nearestCursorIndexInLoop];
               } else {
                  newCursor = allCursorsRef.current[cursorIndex + 1];
               }
            }

            if (newCursor.staffLineGroupIndex != cursor.staffLineGroupIndex) {
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

      handleHandModeChange(handMode, svg, cursor);
      setIsLoading(false);
   }, [handMode]);

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
                  staffLine: staffLines[i],
               } as Measure;
            })
         );
      }

      for (let partIndex = 0; partIndex < parts.length; partIndex++) {
         const part = parts[partIndex];
         const correspondingPart = parts[(partIndex + 1) % parts.length];
         const xmlPart = xmlPartMeasures[partIndex];

         if (part.length !== xmlPart.length) {
            throw 'XML part和SVG part中的小节数量不匹配，请检查文件格式。';
         }

         let currentTick = 0;

         for (let measureIndex = 0; measureIndex < part.length; measureIndex++) {
            const measure = part[measureIndex];
            const correspondingMeasure = correspondingPart[measureIndex];
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
                  correspondingMeasure,
                  staffLines,
                  boxOnClick
               );
            }
         }
      }

      allCursorsRef.current = [];
      for (const entry of noteBoxByStartTickMap) {
         const staffLineGroupIndex = Math.floor(entry[1][0].note.measure.staffLineIndex / 2);
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
   }, [file, boxOnClick]);

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
