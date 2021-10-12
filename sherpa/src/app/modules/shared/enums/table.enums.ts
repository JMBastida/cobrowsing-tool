const limitOptions = [
  { label: '10', value: 10 },
  { label: '25', value: 25 },
  { label: '50', value: 50 },
  { label: '100', value: 100 },
];

export function getLimitOptions(value: number) {
  let options = limitOptions;
  options = limitOptions.filter(o => o.value < value);
  if (value < 100) options.push({ label: value.toString(), value });
  return options;
};
