import React from "react";
import {Button} from "../helpers";
import {component, newState, asyncAction} from "omreact";

const getPromiseRandomNumber = (min, max) => {
  return fetch("https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint16")
    .then(res => res.json())
    .then(json => (json.data[0] % (max - min + 1)) + min);
};

const events = {
  add: value => ({type: "add", value}),
  fetchRandom: () => ({type: "fetchRandom"}),
};

const init = newState({value: 0});

const update = (event, state, _props) => {
  switch (event.type) {
  case "add":
    return newState({value: state.value + event.value});
  case "fetchRandom":
    return asyncAction(getPromiseRandomNumber(1, 10).then(events.add));
  default:
    throw new Error(`Event not implemented: ${JSON.stringify(event)}`);
  }
};

const render = (state, _props) => (
  <div>
    <Button $onClick={events.fetchRandom}>+ASYNC_RANDOM(1..10)</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterSideEffects", {init, render, update});
