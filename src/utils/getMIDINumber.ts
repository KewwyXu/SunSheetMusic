import { NoteStep } from '../types/NoteStep';

export const getMIDINumber = (step: NoteStep, octave: number, alter: number = 0): number => {
   // 定义基准音符C4的MIDI编号为60
   const C4_MIDI_NUMBER = 60;

   // 音名到MIDI值的偏移量
   const stepToOffset: { [key: string]: number } = {
      C: 0,
      D: 2,
      E: 4,
      F: 5,
      G: 7,
      A: 9,
      B: 11,
   };

   // 计算相对于C4的偏移量
   const offsetFromC4 = (octave - 4) * 12 + stepToOffset[step] + alter;

   // 返回MIDI音符编号
   return C4_MIDI_NUMBER + offsetFromC4;
};
