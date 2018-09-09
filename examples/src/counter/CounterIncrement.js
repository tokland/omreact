import React from "react";
import {Button} from "../helpers";
import {component, newState, memoize} from "omreact";

const events = {
  decrement: {type: "decrement"},
  add: memoize(value => ({type: "add", value})),
};

const init = newState({value: 0});

const update = (event, state, _props) => {
  switch (event.type) {
  case "decrement":
    return newState({value: state.value - 1});
  case "add":
    return newState({value: state.value + event.value});
  default:
    throw new Error(`Event not implemented: ${JSON.stringify(event)}`);
  }
};

const render = (state, _props) => (
  <div>
    <Button $onClick={events.decrement}>-1</Button>
    <Button $onClick={events.add(1)}>+1</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterWithEventConstructorArgs", {init, render, update});
