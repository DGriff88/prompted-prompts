
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // The result is a data URL like "data:image/jpeg;base64,..."
      // We need to strip the prefix "data:[mime-type];base64," to get just the base64 string
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Failed to convert file to base64: result was empty."));
      }
    };
    reader.onerror = (error) => reject(new Error(`File could not be read: ${error}`));
  });
};
