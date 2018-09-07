import _ from "lodash";

function sideEffect(fn, ...args) {
  return new Promise(resolve => resolve(fn(...args))).then(() => null);
}

function eventPreventDefault(ev) {
  return sideEffect(ev.preventDefault.bind(ev));
}

function callProp(prop, ...args) {
  return {prop, args};
}

function command(commandObject) {
  const keys = ["state", "asyncActions", "parentActions"];
  const invalidKeys = _(commandObject).keys().difference(keys);
  if (_(invalidKeys).isEmpty()) {
    return commandObject;
  } else {
    throw new Error("Invalid keys for command: " + invalidKeys.join(", "));
  }
}

function newState(state) {
  return command({state});
}

function composeActions(actions, update, state, ...args) {
  return _(actions).reduce((currentCommand, _action) => {
    const action = _(_action).isFunction() ? _action() : _action;
    const _command = update(action, currentCommand.state, ...args);

    return command({
      state: _command.state || currentCommand.state,
      asyncActions: currentCommand.asyncActions.concat(_command.asyncActions || []),
      parentActions: currentCommand.parentActions.concat(_command.parentActions || []),
    });
  }, command({state: state, asyncActions: [], parentActions: []}));
}

export { command, newState, composeActions, sideEffect, eventPreventDefault, callProp };
