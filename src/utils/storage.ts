const filePathSeparator = '|';
const maxFilePathCount = 20;

export const saveFilePath = (filePath: string) => {
   if (!filePath) {
      return;
   }

   const filePaths = window.localStorage.getItem('filePaths');

   if (!filePaths) {
      window.localStorage.setItem('filePaths', filePath);
   } else {
      if (!filePaths.includes(filePath)) {
         const newFilePathsArr = `${filePath}${filePathSeparator}${filePaths}`
            .split(filePathSeparator)
            .slice(0, maxFilePathCount);
         window.localStorage.setItem('filePaths', newFilePathsArr.join(filePathSeparator));
      }
   }
};
