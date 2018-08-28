import React from 'react';
import {Button, getRandomNumber} from '../helpers';
import {component, command, newState, composeActions, memoize} from 'omreact';
import {eventPreventDefault, callProp} from 'omreact/commands';

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

const init = command({state: {value: 0}});

const update = (_action, state, props) => _action.match({
  decrement: () =>
    update(action("add", -1), state, props),
  add: value =>
    newState({value: state.value + value}),
  addOnePlusTwo: () =>
    composeActions([action("add", 1), action("add", 2)], update, state, props),
  fetchRandom: () =>
    command({asyncActions: [getRandomNumber(1, 10).then(action("add").withArgs)]}),
  addValueAndMouseButton: (value, ev) =>
    update(action("add", ev.button + value), state, props),
  cancelEvent: ev =>
    command({asyncActions: [eventPreventDefault(ev)]}),
  notifyParent: () =>
    command({parentActions: [callProp(props.onFinish, state.value)]}),
});

const render = (state, props) => (
  <div>
    <Button $onClick={action("decrement")}>DEC</Button>
    <Button $onClick={action("add", +1)}>+1</Button>
    <Button $onClick={action("addOnePlusTwo")}>+1+2</Button>
    <Button $onClick={action("fetchRandom")}>+ASYNC_RANDOM(1..10)</Button>
    <Button $onMouseUp={action("addValueAndMouseButton", +1).withArgs}
            $onContextMenu={action("cancelEvent").withArgs}>+BUTTON</Button>
    <Button $onClick={action("notifyParent")}>Notify parent</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterUsingActionFunctionCreator", {init, render, update});
