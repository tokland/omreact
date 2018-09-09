import React from "react";
import {Button, getRandomNumber} from "../helpers";
import {component, newState, asyncAction, parentAction, composeEvents, memoize, eventPreventDefault} from "omreact";

function eventMatch(reducers) {
  const reducer = reducers[this.type];

  if (reducer) {
    return reducer(...this.args);
  } else {
    throw new Error("Event type not defined in the update function: " + this.type);
  }
}

const event = memoize((type, ...args) => {
  return {
    type: type,
    args: args,
    match: eventMatch,
    withArgs: (...eventArgs) => ({
      type: type,
      args: args.concat(eventArgs),
      match: eventMatch,
    }),
  };
});

const init = newState({value: 0});

const update = (_event, state, props) => _event.match({
  decrement: () =>
    update(event("add", -1), state, props),
  add: value =>
    newState({value: state.value + value}),
  addOnePlusTwo: () =>
    composeEvents([event("add", 1), event("add", 2)], update, state, props),
  fetchRandom: () =>
    asyncAction(getRandomNumber(1, 10).then(event("add").withArgs)),
  addValueAndMouseButton: (value, ev) =>
    update(event("add", ev.button + value), state, props),
  cancelEvent: ev =>
    asyncAction(eventPreventDefault(ev)),
  notifyParent: () =>
    parentAction(props.onFinish, state.value),
});

const render = (state, _props) => (
  <div>
    <Button $onClick={event("decrement")}>DEC</Button>
    <Button $onClick={event("add", +1)}>+1</Button>
    <Button $onClick={event("addOnePlusTwo")}>+1+2</Button>
    <Button $onClick={event("fetchRandom")}>+ASYNC_RANDOM(1..10)</Button>
    <Button $onMouseUp={event("addValueAndMouseButton", +1).withArgs}
      $onContextMenu={event("cancelEvent").withArgs}>+BUTTON</Button>
    <Button $onClick={event("notifyParent")}>Notify parent</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterUsingEventFunctionCreator", {init, render, update});
