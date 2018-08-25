import React from 'react';
import {Button} from '../helpers';
import {component, command, memoize} from 'omreact';

const actions = {
  decrement: {type: "decrement"},
  add: memoize(value => ({type: "add", value})),
};

const init = command({state: {value: 0}});

const update = (action, state, props) => {
  switch (action.type) {
    case "decrement":
      return command({state: {value: state.value - 1}});
    case "add":
      return command({state: {value: state.value + action.value}});
    default:
      throw new Error(`[update] Action to implemented: ${JSON.stringify(action)}`);
  }
};

const render = (state, props) => (
  <div>
    <Button $$onClick={actions.decrement}>-1</Button>
    <Button $$onClick={actions.add(1)}>+1</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterWithArgs", {init, render, update});
