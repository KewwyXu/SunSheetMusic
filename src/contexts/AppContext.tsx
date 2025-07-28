import React, { createContext, Dispatch } from 'react';
import { Cursor } from '../components/Body/types/Sheet';

export interface AppContextProps {
   xml: string;
   setXml: Dispatch<React.SetStateAction<string>>;
   isLoading: boolean;
   setIsLoading: Dispatch<React.SetStateAction<boolean>>;
   enableBluetooth: boolean;
   setEnableBluetooth: Dispatch<React.SetStateAction<boolean>>;
   cursor: Cursor;
   setCursor: Dispatch<React.SetStateAction<Cursor>>;
   ringingPitches: Set<number>;
   setRingingPitches: Dispatch<React.SetStateAction<Set<number>>>;
}

export const AppContext = createContext<AppContextProps>(undefined);
