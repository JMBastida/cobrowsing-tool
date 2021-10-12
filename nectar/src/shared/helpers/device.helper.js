let versionSearchString;

function getDevice(navigator) {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return "TABLET";
  if (/Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return "MOBILE";
  return "DESKTOP";
}

function searchString(data) {
  for (let i = 0; i < data.length; i++) {
    const dataString = data[i].string;
    const dataProp = data[i].prop;
    versionSearchString = data[i].versionSearch || data[i].identity;
    if (dataString) {
      if (dataString.indexOf(data[i].subString) != -1) return data[i].identity;
    } else if (dataProp) return data[i].identity;
  }

  return "";
}

function searchVersion(dataString) {
  const index = dataString.indexOf(versionSearchString);
  if (index === -1) return;
  return parseFloat(dataString.substring(index + versionSearchString.length + 1));
}

function getDeviceInfo(data) {
  const { navigator, window } = data;
  const dataBrowser = [
    {
      string: navigator.userAgent,
      subString: "Chrome",
      identity: "Chrome"
    },
    {
      string: navigator.userAgent,
      subString: "OmniWeb",
      versionSearch: "OmniWeb/",
      identity: "OmniWeb"
    },
    {
      string: navigator.vendor,
      subString: "Apple",
      identity: "Safari",
      versionSearch: "Version"
    },
    {
      prop: window.opera,
      identity: "Opera",
      versionSearch: "Version"
    },
    {
      string: navigator.vendor,
      subString: "iCab",
      identity: "iCab"
    },
    {
      string: navigator.vendor,
      subString: "KDE",
      identity: "Konqueror"
    },
    {
      string: navigator.userAgent,
      subString: "Firefox",
      identity: "Firefox"
    },
    {
      string: navigator.vendor,
      subString: "Camino",
      identity: "Camino"
    },
    {
      string: navigator.userAgent,
      subString: "Netscape",
      identity: "Netscape"
    },
    {
      string: navigator.userAgent,
      subString: "MSIE",
      identity: "Explorer",
      versionSearch: "MSIE"
    },
    {
      string: navigator.userAgent,
      subString: "Gecko",
      identity: "Mozilla",
      versionSearch: "rv"
    },
    {
      string: navigator.userAgent,
      subString: "Mozilla",
      identity: "Netscape",
      versionSearch: "Mozilla"
    }
  ];
  const dataOS = [
    {
      string: navigator.platform,
      subString: "Win",
      identity: "Windows"
    },
    {
      string: navigator.platform,
      subString: "Mac",
      identity: "Mac"
    },
    {
      string: navigator.userAgent,
      subString: "iPhone",
      identity: "iPhone/iPod"
    },
    {
      string: navigator.platform,
      subString: "Linux",
      identity: "Linux"
    }
  ];
  const browser = searchString(dataBrowser).toUpperCase();
  const version = searchVersion(navigator.userAgent) || searchVersion(navigator.appVersion);
  const os = searchString(dataOS).toUpperCase();
  const device = getDevice(navigator);
  return {
    os,
    device,
    browser,
    version,
  };
}

module.exports = {
  getDeviceInfo,
};