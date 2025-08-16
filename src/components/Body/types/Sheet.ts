export interface Cursor {
   noteBoxes: NoteBox[];
   startTick: number;
   staffLineGroupIndex: number;
   staffLineGroup: SVGGElement[];
}

export interface NoteBox {
   box: SVGRectElement;
   note: Note;
}

export interface Note {
   measure: Measure;
   correspondingMeasure: Measure;
   partIndex: number;
   parentNote: SVGGElement;
   heads: SVGGElement[];
   stem?: SVGGElement;
   beams?: SVGGElement[];
}

export interface Measure {
   measureNode: SVGGElement;
   staffLineIndex: number;
   staffLine: SVGGElement;
}

export interface LineForLoopMode {
   line: SVGLineElement;
   staffLineGroupIndex: number;
   nearestCursorIndexInLoop: number;
}
