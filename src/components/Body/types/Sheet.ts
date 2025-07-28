export interface Cursor {
   noteBoxes: NoteBox[];
   startTick: number;
}

export interface NoteBox {
   box: SVGRectElement;
   note: Note;
}

export interface Note {
   parentNote: SVGGElement;
   heads: SVGGElement[];
   stem?: SVGGElement;
   beams?: SVGGElement[];
}
