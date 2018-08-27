import React from 'react';
import {Button} from '../helpers';
import {component, command, memoize} from 'omreact';
import {eventPreventDefault} from 'omreact/commands';

const actions = {
  add: memoize(value => ({type: "add", value})),
  reset: {type: "reset"},
  addMouseButton: ev => ({type: "addMouseButton", value: ev.button + 1}),
  cancelEvent: ev => ({type: "cancelEvent", ev}),
};

const init = command({state: {value: 0}});

const update = (action, state, props) => {
  switch (action.type) {
    case "add":
      return command({state: {value: state.value + action.value}});
    case "reset":
      return command(state.value === 0 ? {} : {state: {value: 0}});
    case "addMouseButton":
      return command({state: {value: state.value + action.value}});
    case "cancelEvent":
      return command({asyncActions: [eventPreventDefault(action.ev)]});
    default:
      throw new Error(`Action not implemented: ${JSON.stringify(action)}`);
  }
};

const render = (state, props) => (
  <div>
    <Button $onClick={actions.add(-1)}>-1</Button>
    <Button $onClick={actions.add(+1)}>+1</Button>
    <Button $onClick={actions.reset}>RESET</Button>
    <Button $onMouseUp={actions.addMouseButton}
            $onContextMenu={actions.cancelEvent}>+BUTTON</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterWithActionsEventArguments", {init, render, update});
