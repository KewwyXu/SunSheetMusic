import { useState } from 'react';

export const useApp = () => {
   const [xml, setXml] = useState<string>();
   const [isLoading, setIsLoading] = useState<boolean>(false);

   return {
      xml,
      setXml,
      isLoading,
      setIsLoading,
   };
};
