export interface Cursor {
   noteBoxes: NoteBox[];
   startTick: number;
}

export interface NoteBox {
   box: SVGRectElement;
   note: Note;
}

export interface Note {
   partIndex: number;
   parentNote: SVGGElement;
   heads: SVGGElement[];
   stem?: SVGGElement;
   beams?: SVGGElement[];
}
