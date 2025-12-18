export const generateSimpleHash = () =>
  (Number(new Date()) + Math.random() * 100000).toString(36);
