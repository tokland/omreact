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

/*
function composeEvents(events, update, state, ...args) {
  return _(events).reduce((currentAction, _event) => {
    const event = _(_event).isFunction() ? _event() : _event;
    const action = update(event, currentCommand.state, ...args);

    return [
      state: _command.state || currentCommand.state,
      asyncActions: currentCommand.asyncActions.concat(_command.asyncActions || []),
      parentActions: currentCommand.parentActions.concat(_command.parentActions || []),
    ],
  }, command({state: state, asyncActions: [], parentActions: []}));
}
*/

export { newState, asyncAction, parentAction, sideEffect, eventPreventDefault };
