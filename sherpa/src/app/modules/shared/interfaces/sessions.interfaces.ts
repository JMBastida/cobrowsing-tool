export interface SessionItemModel {
    _id: string;
    creationDate: Date | string;
    geolocation: Geolocation;
    locations: string[];
    isInTab: boolean;
    modificationDate?: Date | string;
    ip?: string;
    pin?: string;
    coBrowsingInfo?: any;
    isHelpRequest?: boolean;
    userCode?: string;
    isCustomFlowTriggered?: boolean;
    metadata?: any;
    deviceInfo?: any;
    isCobrowsing?: boolean;
  }
  
  interface Geolocation {
    asn?: string;
    city?: string;
    continent_code?: string;
    country?: string;
    country_area?: number;
    country_calling_code?: string;
    country_capital?: string;
    country_code?: string;
    country_code_iso3?: string;
    country_name?: string;
    country_population?: number;
    country_tld?: string;
    currency?: string;
    currency_name?: string;
    in_eu?: boolean;
    ip?: string;
    languages?: string;
    latitude?: number;
    longitude?: number;
    org?: string;
    postal?: string;
    region?: string;
    region_code?: string;
    timezone?: string;
    utc_offset?: string;
    version?: string;
    creationDate?: Date;
    modificationDate?: Date;
  }
  