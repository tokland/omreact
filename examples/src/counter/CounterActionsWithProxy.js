import React from 'react';
import {Button, getRandomNumber} from '../helpers';
import {component, command, newState, memoize} from 'omreact';

function actionMatch(reducers) {
  return reducers[this.type](...this.args);
};

const actions = new Proxy({}, {
  get: memoize(function(obj, prop) {
    return memoize((...args) => {
      const fn = (...eventArgs) => ({
        type: prop,
        args: args.concat(eventArgs),
        match: actionMatch,
      });

      return Object.assign(fn, {
        type: prop,
        args: args,
        match: actionMatch,
      });
    });
  }),
});

const init = newState({value: 0});

const update = (updateAction, state, props) => updateAction.match({
  decrement: () => newState({value: state.value - 1}),
  add: value => newState({value: state.value + value}),
  addValueAndMouseButton: (value, ev) => newState({value: state.value + value + ev.button}),
});

const render = (state, props) => (
  <div>
    <Button $onClick={actions.decrement()}>-1</Button>
    <Button $onClick={actions.add(+1)}>+1</Button>
    <Button $onMouseUp={actions.addValueAndMouseButton(+1)}>+BUTTON</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterUsingActionProxyCreator", {init, render, update});
