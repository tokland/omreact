import _ from "lodash";

function sideEffect(fn, ...args) {
  return new Promise(resolve => resolve(fn(...args))).then(() => null);
}

function eventPreventDefault(ev) {
  return sideEffect(ev.preventDefault.bind(ev));
}

function newState(state) {
  return {type: "newState", state};
}

function asyncAction(promise) {
  return {type: "asyncAction", promise};
}

function parentAction(prop, ...args) {
  return {type: "parentAction", prop, args};
}

function composeEvents(events, update, ...args) {
  return _(events).flatMap(event => update(event, ...args)).value();
}

export { newState, asyncAction, parentAction, sideEffect, eventPreventDefault, composeEvents };
