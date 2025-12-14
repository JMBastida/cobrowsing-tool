/* eslint-disable no-undef */
var d = document;
var w = window;
function insertScript() {
  var script = d.createElement('script');
  script.async = true;
  script.type = 'text/javascript';
  script.src = 'https://api.nombreapiadefinir.io/p/ENTITY_CODE_HERE';
  var firstScript = d.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) firstScript.parentNode.insertBefore(script, firstScript);
  else d.head.appendChild(script);
}

if (d.readyState === 'complete') insertScript();
else w.addEventListener('load', insertScript, false);
