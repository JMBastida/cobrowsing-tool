export interface Geolocation {
  city: string;
  ip: string;
}

export interface DeviceInfo {
  browser: string;
  device: string;
  os: string;
  userAgent: string;
}

export interface SessionItemModel {
  _id: string;
  clientName: string;
  entityId: string;
  userCode: string;
  isHelpRequest: boolean;
  isCustomFlowTriggered: boolean;
  startDate: Date;
  endDate: Date;
  callUrl: string;
  isTabClosed: boolean;
  isInTab: boolean;
  metadata: any;
  geolocation: Geolocation;
  deviceInfo: DeviceInfo;
  coBrowsingInfo: any[];
}

export interface Customer {
  uid: string;
  firstConnectionDate: Date;
  name: string;
  city: string;
}

export interface ClientData {
  customer: Customer;
  sessions: SessionItemModel[];
}
