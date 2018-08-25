import React from 'react';
import Button from '../Button';
import {component, command, newState, sideEffect, composeActions} from 'omreact';
import memoize from 'memoize-weak';

const init = command({state: {value: 0}});

const actions = {
  add: memoize(value => state => newState({value: state.value + value})),
  increment: state => newState({value: state.value + 1}),
  addThree: composeActions(() => [actions.add(1), actions.add(2)]),
  addMouseButton: ev => actions.add(ev.button + 1),
  cancelEvent: ev => state => command({asyncActions: [sideEffect(ev.preventDefault.bind(ev))]}),
};

const render = (state, props) => (
  <div>
    <Button $$onClick={actions.add(-1)}>-1</Button>
    <Button $$onClick={actions.add(+1)}>+1</Button>
    <Button $$onClick={actions.increment}>INC</Button>
    <Button $$onClick={actions.addThree}>+3</Button>
    <Button $onMouseUp={actions.addMouseButton} $onContextMenu={actions.cancelEvent}>+BUTTON</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterActionsOnly", {init, render});
