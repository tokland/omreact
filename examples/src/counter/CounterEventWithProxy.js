import React from "react";
import {Button} from "../helpers";
import {component, newState, memoize} from "omreact";

function eventMatch(reducers) {
  return reducers[this.type](...this.args);
}

const events = new Proxy({}, {
  get: memoize(function(obj, prop) {
    return memoize((...args) => {
      const fn = (...eventArgs) => ({
        type: prop,
        args: args.concat(eventArgs),
        match: eventMatch,
      });

      return Object.assign(fn, {
        type: prop,
        args: args,
        match: eventMatch,
      });
    });
  }),
});

const init = newState({value: 0});

const update = (event, state, _props) => event.match({
  decrement: () => newState({value: state.value - 1}),
  add: value => newState({value: state.value + value}),
  addValueAndMouseButton: (value, ev) => newState({value: state.value + value + ev.button}),
});

const render = (state, _props) => (
  <div>
    <Button $onClick={events.decrement()}>-1</Button>
    <Button $onClick={events.add(+1)}>+1</Button>
    <Button $onMouseUp={events.addValueAndMouseButton(+1)}>+BUTTON</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterUsingEventProxyCreator", {init, render, update});
