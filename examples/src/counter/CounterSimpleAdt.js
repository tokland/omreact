import React from "react";
import _ from "lodash";

import {Button} from "../helpers";
import {component, newState, memoize} from "omreact";
import {eventPreventDefault} from "omreact/commands";

function buildActions(actionsObj) {
  const getAction = (actionName, argNames, args) => ({
    ..._(argNames).zip(args).fromPairs().value(),
    _match: matchObject => matchObject[actionName](...args),
  });

  return _.mapValues(actionsObj, (argNames, actionName) => {
    if (argNames.length === 0) {
      return getAction(actionName, [], []);
    } else {
      return memoize((...args) => {
        if (args.length < argNames.length) {
          return (...eventArgs) => getAction(actionName, argNames, args.concat(eventArgs));
        } else {
          return getAction(actionName, argNames, args);
        }
      });
    }
  });
}

const init = {state: {value: 0}};

const actions = buildActions({
  decrement: [],
  add: ["value"],
  addValuePlusMouseButton: ["value", "ev"],
  cancelEvent: ["ev"],
});

const update = (action, state, props) => action._match({
  decrement: () =>
    newState({value: state.value - 1}),
  add: value =>
    newState({value: state.value + value}),
  addValuePlusMouseButton: (value, ev) =>
    update(actions.add(ev.button + value), state, props),
  cancelEvent: ev =>
    ({asyncActions: [eventPreventDefault(ev)]}),
});

const render = (state, _props) => (
  <div>
    <Button $onClick={actions.decrement}>DEC</Button>
    <Button $onClick={actions.add(+1)}>+1</Button>
    <Button $onMouseUp={actions.addValuePlusMouseButton(1)}
      $onContextMenu={actions.cancelEvent}>+BUTTON</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterSimpleActionsWithAdt", {init, render, update});
