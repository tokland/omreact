import _ from 'lodash';
import memoize from 'memoize-weak';

function command(commandObject) {
  return commandObject;
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

function actionMatch(reducers) {
  const reducer = reducers[this.type];

  if (reducer) {
    return reducer(...this.args);
  } else {
    throw new Error("Action type not defined in the update function: " + this.type);
  }
};

const action = memoize((type, ...args) => {
  return {
    type: type,
    args: args,
    match: actionMatch,
    withArgs: (...eventArgs) => ({
      type: type,
      args: args.concat(eventArgs),
      match: actionMatch,
    }),
  };
});

export { command, newState, action, composeActions };
