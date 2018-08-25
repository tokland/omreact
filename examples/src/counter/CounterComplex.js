import React from 'react';
import {Button, getRandomNumber} from '../helpers';
import {component, command, memoize} from 'omreact';

const init = command({
  state: {value: 0, message: ""},
});

const actions = {
  increment: {type: "increment"},
  decrement: {type: "decrement"},
  add: memoize(value => ({type: "add", value})),
  fetchRandom: {type: "fetchRandom"},
  showError: error => ({type: "showError", error}),
};

const update = (action, state, props) => {
  switch (action.type) {
    case "increment":
      return command({state: {...state, value: state.value + 1}});
    case "decrement":
      return command({state: {...state, value: state.value - 1}});
    case "fetchRandom":
      return command({
        state: {...state, message: "Fetch random number from QRNG..."},
        asyncActions: [getRandomNumber(1, 10).then(actions.add).catch(actions.showError)],
      });
    case "add":
      return command({
        state: {...state, value: state.value + action.value, message: `Added ${action.value}`},
      });
    case "showError":
      return command({state: {...state, message: `Error: ${action.error}`}});
    default:
      throw new Error(`[update] Unknown action: ${action}`);
  }
};

const render = (state, props) => (
  <div>
    <Button $onClick={actions.decrement}>-1</Button>
    <Button $onClick={actions.increment}>+1</Button>
    <Button $onClick={actions.fetchRandom}>+RANDOM</Button>
    <div>{state.value}</div>
    <div>{state.message}</div>
  </div>
);

export default component("CounterComplex", {init, render, update});
