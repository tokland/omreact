export function sideEffect(fn, ...args) {
  return new Promise(resolve => resolve(fn(...args))).then(() => null);
};

export function eventPreventDefault(ev) {
  return sideEffect(ev.preventDefault.bind(ev));
}

export function callProp(prop, ...args) {
  return {prop, args};
}
