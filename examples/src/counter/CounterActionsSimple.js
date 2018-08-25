import React from 'react';
import {Button} from '../helpers';
import {component, command, newState, composeActions, action     } from 'omreact';
import {eventPreventDefault, callProp} from 'omreact/commands';

const getRandomNumber = (min, max) => {
  return fetch("https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint16")
    .then(res => res.json())
    .then(json => (json.data[0] % (max - min + 1)) + min);
};

const init = command({state: {value: 0}});

const update = (updateAction, state, props) => updateAction.match({
  decrement: () =>
    update(action("add", -1), state, props),
  add: value =>
    newState({value: state.value + value}),
  addOnePlusTwo: () =>
    composeActions([action("add", 1), action("add", 2)], update, state, props),
  fetchRandom: () =>
    command({asyncActions: [getRandomNumber(1, 10).then(action("add").withArgs)]}),
  addValueAndMouseButton: (value, ev) =>
    update(action("add", ev.button + value), state, props),
  cancelEvent: ev =>
    command({asyncActions: [eventPreventDefault(ev)]}),
  notifyParent: () =>
    command({parentActions: [callProp(props.onFinish, state.value)]}),
});

const render = (state, props) => (
  <div>
    <Button $$onClick={action("decrement")}>DEC</Button>
    <Button $$onClick={action("add", +1)}>+1</Button>
    <Button $$onClick={action("addOnePlusTwo")}>+1+2</Button>
    <Button $$onClick={action("fetchRandom")}>+ASYNC_RANDOM(1..10)</Button>
    <Button $onMouseUp={action("addValueAndMouseButton", +1).withArgs}
            $onContextMenu={action("cancelEvent").withArgs}>+BUTTON</Button>
    <Button $$onClick={action("notifyParent")}>Notify parent</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterFunctionActions", {init, render, update});
