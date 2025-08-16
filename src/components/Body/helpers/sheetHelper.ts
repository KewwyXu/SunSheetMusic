import { Cursor, LineForLoopMode, Measure, NoteBox } from '../types/Sheet';
import { LOOP_LINE_X_OFFSET_RATE, LOOP_LINE_Y_OFFSET_RATE, svgNS } from '../../../consts/sheet';
import * as im from 'immutable';
import { HandMode } from '../../../enums/HandMode';
import { FOCUS_KEY_COLOR } from '../../../consts/colors';

const boxGroupClassName = 'custom-box-group';
const partBoxGroupClassName = 'custom-part-box-group';
const boxClassName = 'custom-box';
const highlightRectClassName = 'highlight-rect';

export const isNoteOutOfLoopedStaffLines = (
   newNoteBoxes: NoteBox[],
   startLine: LineForLoopMode,
   endLine: LineForLoopMode
): boolean => {
   const noteBox1BBox = newNoteBoxes[0].box.getBBox();
   const startLineBBox = startLine.line.getBBox();
   const endLineBBox = endLine.line.getBBox();
   const noteBoxStaffLineGroupIndex = Math.floor(newNoteBoxes[0].note.measure.staffLineIndex / 2);

   return (
      noteBoxStaffLineGroupIndex < startLine.staffLineGroupIndex ||
      noteBoxStaffLineGroupIndex > endLine.staffLineGroupIndex ||
      (noteBoxStaffLineGroupIndex == startLine.staffLineGroupIndex && noteBox1BBox.x < startLineBBox.x) ||
      (noteBoxStaffLineGroupIndex == endLine.staffLineGroupIndex && noteBox1BBox.x > endLineBBox.x)
   );
};

export const removeHighlightedStaffLines = () => {
   const highlightRects = Array.from(document.getElementsByClassName(highlightRectClassName));
   highlightRects.forEach((rect) => {
      rect.remove();
   });
};

export const highlightLoopedStaffLines = (
   staffLines: SVGGElement[],
   startLine: LineForLoopMode,
   endLine: LineForLoopMode
) => {
   const startLineBBox = startLine.line.getBBox();
   const endLineBBox = endLine.line.getBBox();

   for (let i = startLine.staffLineGroupIndex; i <= endLine.staffLineGroupIndex; i++) {
      const staffLine1BBox = staffLines[i * 2].getBBox();
      const staffLine2BBox = staffLines[i * 2 + 1].getBBox();

      let highlightPartX = staffLine1BBox.x;
      let highlightPartWidth = staffLine1BBox.width;
      const highlightPartY = Math.min(staffLine1BBox.y, staffLine2BBox.y);
      const highlightHeight = staffLine2BBox.y + staffLine2BBox.height - highlightPartY;

      if (i == startLine.staffLineGroupIndex) {
         highlightPartX = startLineBBox.x;
      }

      if (i == endLine.staffLineGroupIndex) {
         highlightPartWidth = endLineBBox.x - highlightPartX;
      }

      const highlightRect = document.createElementNS(svgNS, 'rect');
      highlightRect.setAttribute('x', highlightPartX.toString());
      highlightRect.setAttribute('y', highlightPartY.toString());
      highlightRect.setAttribute('width', highlightPartWidth.toString());
      highlightRect.setAttribute('height', highlightHeight.toString());
      highlightRect.setAttribute('fill', 'rgba(255, 165, 0, 0.2)');
      highlightRect.id = `highlightRect-${i}`;
      highlightRect.classList.add(highlightRectClassName);

      const customBoxGroup = document.getElementsByClassName(boxGroupClassName)[0] as SVGGElement;
      const customBoxGroupChildNodes = Array.from(customBoxGroup.childNodes);
      customBoxGroupChildNodes.forEach((x) => x.remove());
      customBoxGroup.append(highlightRect, ...customBoxGroupChildNodes);
   }
};

export const drawLine = (noteBoxes: NoteBox[], lineType: 'start' | 'end', parentNode: Element) => {
   const upNotebox = noteBoxes.find((x) => x.note.partIndex % 2 == 0);
   const downNotebox = noteBoxes.find((x) => x.note.partIndex % 2 == 1);
   const upBBox = upNotebox?.box.getBBox();
   const downBBox = downNotebox?.box.getBBox();
   const upStaffLineBBox =
      upNotebox?.note.measure.staffLine.getBBox() ?? downNotebox.note.correspondingMeasure.staffLine.getBBox();
   const downStaffLineBBox =
      downNotebox?.note.measure.staffLine.getBBox() ?? upNotebox.note.correspondingMeasure.staffLine.getBBox();

   const bBoxes = [upBBox, downBBox].filter((x) => x);
   let x = 0;

   if (lineType == 'start') {
      x = Math.min(...bBoxes.map((x) => x.x)) * (1 - LOOP_LINE_X_OFFSET_RATE);
   } else {
      x = Math.max(...bBoxes.map((x) => x.x + x.width)) * (1 + LOOP_LINE_X_OFFSET_RATE);
   }

   const y1 = upStaffLineBBox.y * (1 - LOOP_LINE_Y_OFFSET_RATE);
   const y2 = (downStaffLineBBox.y + downStaffLineBBox.height) * (1 + LOOP_LINE_Y_OFFSET_RATE);

   const line = document.createElementNS(svgNS, 'line');
   parentNode.appendChild(line);
   line.setAttribute('x1', x.toString());
   line.setAttribute('y1', y1.toString());
   line.setAttribute('x2', x.toString());
   line.setAttribute('y2', y2.toString());
   line.setAttribute('stroke', 'orange');
   line.setAttribute('stroke-width', '2');
   line.id = `${lineType}-line`;

   return line;
};

export const drawNoteBox = (box: SVGRectElement, x: number, y: number, height: number, width: number) => {
   box.setAttribute('x', x.toString());
   box.setAttribute('y', y.toString());
   box.setAttribute('width', width.toString());
   box.setAttribute('height', height.toString());
   box.setAttribute('fill', 'transparent');
};

export const addCursors = (
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
   correspondingMeasure: Measure,
   staffLines: SVGGElement[],
   boxOnClick: (startTick: number, noteBoxByStartTickMap: im.Map<number, NoteBox[]>, staffLines: SVGGElement[]) => void
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
      height = Math.max(noteBBox.y + noteBBox.height, stemBBox.y + stemBBox.height) - Math.min(noteBBox.y, stemBBox.y);
   } else {
      x = noteBBox.x;
      y = noteBBox.y;
      width = noteBBox.width;
      height = noteBBox.height;
   }

   drawNoteBox(box, x, y, height, width);

   const noteBox: NoteBox = {
      box: box,
      note: {
         measure: measure,
         correspondingMeasure: correspondingMeasure,
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

export const handleHandModeChange = (handMode: HandMode, svg: SVGElement, cursor: Cursor) => {
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
};
