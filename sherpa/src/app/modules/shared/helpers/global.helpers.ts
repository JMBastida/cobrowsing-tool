export function copyToClippboard(string: string) {
  const selBox = document.createElement('textarea');
  selBox.style.position = 'fixed';
  selBox.style.left = '0';
  selBox.style.top = '0';
  selBox.style.opacity = '0';
  selBox.value = string;
  document.body.appendChild(selBox);
  selBox.focus();
  selBox.select();
  document.execCommand('copy');
  document.body.removeChild(selBox);
};

export function allowEdition(event: any) {
  if (!event || !event.target) return;
  event.target.removeAttribute('readonly');
}

export function avoidEdition(event: any) {
  if (!event || !event.target) return;
  event.target.setAttribute('readonly', '');
}
