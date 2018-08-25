import React from 'react';
import {component, command} from 'omreact';

const actions = {
  decrement: ev => ({type: "decrement"}),
  increment: ev => ({type: "increment"}),
};

const init = command({state: {value: 0}});

const update = (action, state, props) => {
  switch (action.type) {
    case "decrement":
      return command({state: {value: state.value - 1}});
    case "increment":
      return command({state: {value: state.value + 1}});
    default:
      throw new Error(`[update] Action to implemented: ${JSON.stringify(action)}`);
  }
};

const render = (state, props) => (
  <div>
    <button $onClick={actions.decrement}>-1</button>
    <button $onClick={actions.increment}>+1</button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterSimple", {init, render, update});