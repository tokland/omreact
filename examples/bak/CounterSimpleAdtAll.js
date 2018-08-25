import React from 'react';
import {component, command, buildActions} from 'omreact';
import daggy from 'daggy';

const State = daggy.tagged("State", ["value"]);

Object.assign(State.prototype, {
  add(value) {
    return new State(this.value + value);
  },
});

const actions = buildActions({
  increment: [],
  decrement: [],
});

const init = command({
  state: new State(0),
});

const update = (action, state, props) => (
  action.cata({
    increment: () => command({state: state.add(+1)}),
    decrement: () => command({state: state.add(-1)}),
  })
);

const render = (state, props) => (
  <div>
    <button $onClick={actions.decrement}>-1</button>
    <button $onClick={actions.increment}>+1</button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterSimpleAdt", {init, render, update});
