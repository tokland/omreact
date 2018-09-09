import React from "react";
import _ from "lodash";

import {Button} from "../helpers";
import {component, newState, memoize, eventPreventDefault} from "omreact";

function buildEvents(eventsObj) {
  const getEvent = (eventName, argNames, args) => ({
    ..._(argNames).zip(args).fromPairs().value(),
    _match: matchObject => matchObject[eventName](...args),
  });

  return _.mapValues(eventsObj, (argNames, eventName) => {
    if (argNames.length === 0) {
      return getEvent(eventName, [], []);
    } else {
      return memoize((...args) => {
        if (args.length < argNames.length) {
          return (...eventArgs) => getEvent(eventName, argNames, args.concat(eventArgs));
        } else {
          return getEvent(eventName, argNames, args);
        }
      });
    }
  });
}

const init = newState({value: 0});

const events = buildEvents({
  decrement: [],
  add: ["value"],
  addValuePlusMouseButton: ["value", "ev"],
  cancelEvent: ["ev"],
});

const update = (event, state, props) => event._match({
  decrement: () =>
    newState({value: state.value - 1}),
  add: value =>
    newState({value: state.value + value}),
  addValuePlusMouseButton: (value, ev) =>
    update(events.add(ev.button + value), state, props),
  cancelEvent: ev =>
    ({asyncEvents: [eventPreventDefault(ev)]}),
});

const render = (state, _props) => (
  <div>
    <Button $onClick={events.decrement}>DEC</Button>
    <Button $onClick={events.add(+1)}>+1</Button>
    <Button $onMouseUp={events.addValuePlusMouseButton(1)}
      $onContextMenu={events.cancelEvent}>+BUTTON</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterSimpleEventsWithAdt", {init, render, update});
