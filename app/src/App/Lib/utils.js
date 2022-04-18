export const fileFilter = [{ name: 'piggy data', extensions: ['piggy'] }];

export const insertIf = (cond, ...elements) => (cond ? elements : []);

export const sortIntArray = (ints) => ints.sort((a, b) => a - b);
