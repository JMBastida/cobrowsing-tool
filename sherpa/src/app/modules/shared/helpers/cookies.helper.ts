import { get, set, remove } from 'js-cookie';

function getDomain() {
  let domain = {};
  if (document.location) {
    const { hostname } = document.location;
    const checkLocalhost = hostname === '0.0.0.0' || hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.');
    if (checkLocalhost) {
      domain = {};
    } else {
      domain = { domain: hostname };
    }
  }

  return domain;
}

export default {
  get(key: string) {
    return get(key);
  },
  set(key: string, value: any, options = {}) {
    return set(key, value, { ...options, ...getDomain() });
  },
  remove(key: string, options = {}) {
    return remove(key, { ...options, ...getDomain() });
  }
};