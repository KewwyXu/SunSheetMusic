import * as im from 'immutable';
import _ from 'lodash';

export const parseXML = (file: string) => {
   const xmlString = file ?? window.sessionStorage.getItem('xml');
   const xml = new DOMParser().parseFromString(xmlString, 'text/xml');
   const parts = xml.getElementsByTagName('part');
   const partMeasures: Array<Array<Element>> = [[], []];

   for (let i = 0; i < parts.length; i++) {
      const measures = Array.from(parts[i].getElementsByTagName('measure'));
      partMeasures[i % 2].push(...measures);
   }

   const measures = partMeasures.flatMap((x) => x);
   groupNotesByDefaultX(measures);

   return partMeasures;
};

const groupNotesByDefaultX = (measures: Element[]) => {
   measures.forEach((measure) => {
      const notes = Array.from(measure.getElementsByTagName('note'));
      const noteByDefaultXMap = im.Map<number, Element>().asMutable();

      notes.forEach((note) => {
         const defaultXStr = note.getAttribute('default-x');
         const defaultX = Number(defaultXStr);

         if (_.isNull(defaultXStr) || _.isEmpty(defaultXStr) || isNaN(defaultX)) {
            return;
         }

         const existingNote = noteByDefaultXMap.get(defaultX);

         if (existingNote) {
            measure.removeChild(note);
            const pitches = Array.from(note.getElementsByTagName('pitch'));
            existingNote.append(...pitches);
         } else {
            noteByDefaultXMap.set(defaultX, note);
         }
      });
   });
};
