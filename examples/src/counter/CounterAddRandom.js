import React from "react";
import {Button} from "../helpers";
import {component, command} from "omreact";

const getPromiseRandomNumber = (min, max) => {
  return fetch("https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint16")
    .then(res => res.json())
    .then(json => (json.data[0] % (max - min + 1)) + min);
};

const actions = {
  add: value => ({type: "add", value}),
  fetchRandom: () => ({type: "fetchRandom"}),
};

const init = command({state: {value: 0}});

const update = (action, state, _props) => {
  switch (action.type) {
  case "add":
    return command({state: {value: state.value + action.value}});
  case "fetchRandom":
    return command({asyncActions: [getPromiseRandomNumber(1, 10).then(actions.add)]});
  default:
    throw new Error(`Action not implemented: ${JSON.stringify(action)}`);
  }
};

const render = (state, _props) => (
  <div>
    <Button $onClick={actions.fetchRandom}>+ASYNC_RANDOM(1..10)</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterSideEffects", {init, render, update});
