module.exports = `
  @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap');
  @-webkit-keyframes blink-2 {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.2;
    }
    100% {
      opacity: 1;
    }
  }
  @keyframes blink-2 {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.2;
    }
    100% {
      opacity: 1;
    }
  }

  #shr-border-top,
  #shr-border-left,
  #shr-border-right,
  #shr-border-bottom {
    position: fixed;
    z-index: 2147483647;
    background-color: #00CD8E;
  }

  #shr-border-top {
    top: 0;
    left: 0;
    height: 3px;
    width: 100vw;
  }

  #shr-border-left {
    top: 0;
    left: 0;
    width: 3px;
    height: 100vh;
  }

  #shr-border-right {
    top: 0;
    right: 0;
    width: 3px;
    height: 100vh;
  }

  #shr-border-bottom {
    left: 0;
    bottom: 0;
    height: 3px;
    width: 100vw;
  }

  #shr-co-browsing-advise {
    top: 0;
    width: 230px;
    display: flex;
    position: fixed;
    padding: 6px 12px;
    font-weight: bold;
    z-index: 2147483647;
    align-items: center;
    left: calc(50vw - 115px);
    border-radius: 0 0 10px 10px;
    justify-content: space-between;
    background-color: rgb(0 205 142);
  }

  #shr-end-call-button {
    top: 4px;
    width: 30px;
    height: 30px;
    padding: 8px;
    border: none;
    font: revert;
    cursor: pointer;
    position: fixed;
    border-radius: 24px;
    z-index: 2147483647;
    box-sizing: border-box;
    right: calc(50vw + 104px);
    background-color: #FF0000;
  }

  #shr-end-call-button:hover {
    background-color: #C7031E;
  }

  #shr-co-browsing-advise .shr-close-icon {
    cursor: pointer;
  }

  #shr-co-browsing-advise .shr-close-icon svg {
    width: 1em;
    height: 1em;
    fill: #FF0000;
    overflow: hidden;
    vertical-align: middle;
  }
  
  #shr-co-browsing-advise .shr-text {
    color: #FFFFFF;
    margin: 0 auto;
    font-size: 14px;
    font-family: 'Open Sans', sans-serif;
  }

  #shr-co-browsing-advise .shr-logo-miniature svg {
    left: 1px;
    bottom: 1px;
    padding: 5px;
    position: fixed;
    background: #00cd8e;
    border-radius: 0 6px 0 0;
  }

  #shr-permission-advise {
    top: 25%;
    padding: 12px;
    position: fixed;
    text-align: center;
    z-index: 2147483647;
    box-sizing: border-box;
    left: calc(50vw - 150px);
    background-color: #FFFFFF;
    width: 390px;
    box-shadow: 0px 10px 40px rgba(4, 39, 45, 0.21);
    border-radius: 18px;
    font-family: 'Open Sans', sans-serif;
  }

  #shr-permission-advise .shr-permission-advise-text {
    color: #04272D;
    font-weight: 600;
    font-size: 16px;
    line-height: 19px;
    text-align: center;
  }

  #shr-permission-advise .shr-permission-advise-wrapper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 10px;
    margin: 5px 15px;
  }

  #shr-permission-advise .shr-permission-advise-wrapper .shr-permission-advise-wrapper-item {
    color: rgba(0, 0, 0, 0.55);
    font-weight: 400;
    font-size: 12px;
    place-self: start;
  }

  #shr-permission-advise .shr-permission-button-content {
    display: flex;
    flex-flow: wrap column;
    align-items: center;
    margin: 15px auto;
    justify-content: space-evenly;
    height: 100px;
  }

  #shr-permission-advise .shr-permission-button-content .shr-permission-button {
    cursor: pointer;
    padding: 6px 3px;
    border-radius: 1px;
    width: calc(60% - 6px);
    box-sizing: border-box;
  }

  #shr-permission-advise .shr-permission-button-content .shr-permission-button-accept {
    color: #FFFFFF;
    background-color: #00CD8E;
    border: 1px solid #00CD8E;
    border-radius: 6px;
    font-weight: 600;
  }

  #shr-permission-advise .shr-permission-button-content .shr-permission-button-accept:hover {
    border-color: #00A775;
    background-color: #00A775;
  }

  #shr-permission-advise .shr-permission-button-content .shr-permission-button-reject {
    color: #04272D;
    background-color: #FFFFFF;
    border: 1px solid #04272D;
    border-radius: 6px;
    font-weight: 600;
  }

  #shr-permission-advise .shr-permission-button-content .shr-permission-button-reject:hover {
    color: #676B72;
    border-color: #83888F;
  }

  #shr-permission-advise .shr-powered-by {
    margin-top: 12px;
    display: flex;
    flex-flow: wrap row;
    width: 100%;
    justify-content: center;
    align-items: center;
  }
  
  #shr-permission-advise .shr-powered-by .shr-powered-by-text {
    color: #04272D;
    font-size: 12px;
    font-weight: 600;
  }

  #shr-permission-advise .shr-powered-by .shr-powered-by-logo {
    padding-top: 5px;
  }

  #shr-help-pin-advise,
  #shr-smart-link-advise,
  #shr-agent-busy-advise,
  #shr-call-request-advise,
  #shr-co-browsing-end-advise {
    top: 25%;
    width: 250px;
    padding: 12px;
    position: fixed;
    border-radius: 6px;
    text-align: center;
    z-index: 2147483647;
    box-sizing: border-box;
    left: calc(50vw - 150px);
    background-color: #FFFFFF;
    box-shadow: 0px 10px 40px rgb(41 50 65 / 50%);
  }

  #shr-help-pin-advise .shr-help-pin-advise-text,
  #shr-smart-link-advise .shr-smart-link-advise-text,
  #shr-agent-busy-advise .shr-smart-link-advise-text,
  #shr-call-request-advise .shr-call-request-advise-text,
  #shr-co-browsing-end-advise .shr-co-browsing-end-advise-text {
    color: #04272D;
    font-size: 16px;
    font-family: 'Open Sans', sans-serif;
  }

  #shr-help-pin-advise .shr-help-pin-advise-text {
    padding: 0 20px;
  }

  #shr-help-pin-advise .shr-help-pin {
    margin: 6px 0;
    letter-spacing: 6px;
  }

  #shr-help-pin-advise .shr-help-pin-button-content,
  #shr-smart-link-advise .shr-smart-link-button-content,
  #shr-agent-busy-advise .shr-smart-link-button-content,
  #shr-call-request-advise .shr-call-request-button-content,
  #shr-co-browsing-end-advise .shr-co-browsing-end-button-content {
    display: flex;
    margin-top: 12px;
    justify-content: center;
  }

  #shr-help-pin-advise .shr-help-pin-button-content .shr-help-pin-button,
  #shr-smart-link-advise .shr-smart-link-button-content .shr-smart-link-button,
  #shr-agent-busy-advise .shr-smart-link-button-content .shr-smart-link-button,
  #shr-call-request-advise .shr-call-request-button-content .shr-call-request-button,
  #shr-co-browsing-end-advise .shr-co-browsing-end-button-content .shr-co-browsing-end-button {
    cursor: pointer;
    padding: 6px 3px;
    border-radius: 1px;
    width: calc(50% - 6px);
    box-sizing: border-box;
  }

  #shr-help-pin-advise .shr-help-pin-button-content .shr-help-pin-button-close,
  #shr-smart-link-advise .shr-smart-link-button-content .shr-smart-link-button-close,
  #shr-agent-busy-advise .shr-agent-busy-button-content .shr-agent-busy-button-close,
  #shr-co-browsing-end-advise .shr-co-browsing-end-button-content .shr-co-browsing-end-button-close {
    color: #FFFFFF;
    background-color: #00CD8E;
    border: 1px solid #00CD8E;
  }
  
  #shr-call-request-advise .shr-call-request-button-content .shr-call-request-button-close {
    color: #676B72;
    border-color: #83888F;
    border: 1px solid #83888F;
  }
  
  #shr-call-request-advise .shr-call-request-button-content .shr-call-request-button-accept {
    color: #FFFFFF;
    background-color: #00CD8E;
    border: 1px solid #00CD8E;
  }

  #shr-call-request-advise .shr-call-request-button-content .shr-call-request-button-accept:hover {
    border-color: #00A775;
    background-color: #00A775;
  }

  #shr-help-pin-advise .shr-help-pin-button-content .shr-help-pin-button-close:hover,
  #shr-smart-link-advise .shr-smart-link-button-content .shr-smart-link-button-close:hover,
  #shr-agent-busy-advise .shr-agent-busy-button-content .shr-agent-busy-button-close:hover,
  #shr-co-browsing-end-advise .shr-co-browsing-end-button-content .shr-co-browsing-end-button-close:hover {
    border-color: #00A775;
    background-color: #00A775;
  }

  #shr-call-request-advise .shr-call-request-button-content .shr-call-request-button-close:hover {
    color: #FFFFFF;
    background-color: #CCCCCC;
  }

  #shr-help-pin-advise .shr-powered-by,
  #shr-smart-link-advise .shr-powered-by,
  #shr-agent-busy-advise .shr-powered-by,
  #shr-call-request-advise .shr-powered-by,
  #shr-co-browsing-end-advise .shr-powered-by {
    margin-top: 12px;
  }

  #shr-help-pin-advise .shr-powered-by .shr-powered-by-text,
  #shr-smart-link-advise .shr-powered-by .shr-powered-by-text,
  #shr-agent-busy-advise .shr-powered-by .shr-powered-by-text,
  #shr-call-request-advise .shr-powered-by .shr-powered-by-text
  #shr-co-browsing-end-advise .shr-powered-by .shr-powered-by-text {
    color: #04272D;
    font-size: 12px;
  }

  .shr-cursor {
    direction: rtl;
    position: fixed;
    white-space: nowrap;
    z-index: 2147483647;
  }

  .shr-cursor .shr-agent-name {
    cursor: default;
    font-size: 11px;
    color: #FFFFFF;
    padding: 3px 6px;
    border-radius: 12px;
    background-color: #00CD8E;
    border: 1px solid #FFFFFF;
  }

  .shr-cursor.shr-cursor-limit-left {
    direction: ltr;
  }

  .shr-cursor.shr-cursor-limit-left svg {
    transform: rotateY(180deg);
  }

  .shr-viewport-active:before, .shr-viewport-active:after {
    left: 0;
    right: 0;
    height: 3px;
    content: "";
    position: fixed;
    z-index: 2147483646;
    background: #00CD8E;
  }

  .shr-viewport-active:before {
    top: 0;
  }

  .shr-viewport-active:after {
    bottom: 0;
  }

  .shr-viewport-active {
    z-index: 2147483646;
    border-left: 3px solid #00CD8E;
    border-right: 3px solid #00CD8E;  
  }

  #shr-help-bubble-button {
    left: 40px;
    bottom: 40px;
    display: flex;
    color: #FFFFFF;
    cursor: pointer;
    position: fixed;
    border-radius: 5px;
    text-align: center;
    z-index: 2147483646;
    align-items: center;
    box-sizing: content-box;
    justify-content: center;
    border: 1px solid #00CD8E;
    background-color: #FFFFFF;
    box-shadow: 0px 4px 17px rgb(0 0 0 / 25%);
  }

  #shr-help-bubble-button .shr-logo-miniature {
    line-height: 1;
    padding: 6px 16px;
    background-color: #00CD8E;
  }

  #shr-help-bubble-button .shr-logo-miniature svg {
    width: 20px;
  }

  #shr-help-bubble-button .shr-bubble-text {
    color: #04272D;
    font-size: 13px;
    padding: 0 24px;
    font-weight: bold;
    font-family: 'Open Sans', sans-serif;
  }
`;
