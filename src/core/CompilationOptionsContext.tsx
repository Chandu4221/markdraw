import { createContext, useContext, Dispatch, SetStateAction } from 'react';
import { CompilationOptions } from './types';

export interface CompilationOptionsContextType {
  options: Required<CompilationOptions>;
  setOptions: Dispatch<SetStateAction<Required<CompilationOptions>>>;
}

export const CompilationOptionsContext = createContext<CompilationOptionsContextType | null>(null);

export function useCompilationOptions(): CompilationOptionsContextType | null {
  return useContext(CompilationOptionsContext);
}
