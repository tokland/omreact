import React from 'react';
import PropTypes from 'prop-types';
import {Button} from '../helpers';
import {component, command} from 'omreact';
import {callProp} from 'omreact/commands';

const actions = {
  increment: ev => ({type: "increment"}),
  notifyParent: ev => ({type: "notifyParent"}),
  propsChanged: prevProps => ({type: "propsChanged", prevProps}),
};

const init = props => command({state: {value: props.initialValue || 0}});

const update = (action, state, props) => {
  switch (action.type) {
    case "increment":
      return command({state: {value: state.value + 1}});
    case "notifyParent":
      return command({parentActions: [callProp(props.onFinish, state.value)]});
    case "propsChanged":
      return command({state: {value: props.initialValue}});
    default:
      throw new Error(`Action not implemented: ${JSON.stringify(action)}`);
  }
};

const render = (state, props) => (
  <div>
    <Button $onClick={actions.increment}>+1</Button>
    <Button $onClick={actions.notifyParent}>Notify parent</Button>
    <div>{state.value}</div>
  </div>
);

const lifecycles = {propsChanged: actions.propsChanged};
const propTypes = {initialValue: PropTypes.number};

export default component("CounterParentNotificationsAndLifeCycles", {init, render, update, lifecycles, propTypes});
