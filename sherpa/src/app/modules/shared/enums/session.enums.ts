export const SESSION_STATUS = {
  NEW: 'NEW',
  REJECTED: 'REJECTED',
  VALIDATED: 'VALIDATED',
};

export const BASIC_PROPERTIES: any[] = [
  'id',
  'role',
  'email',
  'phone',
  'language',
  'isPaying',
  'fullName',
  'planLevel',
  'creationDate',
];

export enum SeverityRange {
  DANGER = 'danger',
  WARN = 'warning',
  INFO = 'info',
  NONE = 'none',
}

export enum IconSelect {
  smartLink,
  pin,
  helpBtn,
  customTrigger,
}
