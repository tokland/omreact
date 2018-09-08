import React from "react";
import {mount} from "enzyme";
import {component, command, newState, memoize, callProp} from "..";
import PropTypes from "prop-types";

function onNextTick(done, expectation) {
  return setTimeout(() => {
    expectation();
    done();
  }, 1);
}

function getCounter({setProps, mergeProps} = {}) {
  const init = props => command({
    state: {value: props.initialValue},
  });

  const buildAction = (type, ...args) => ({match: (obj) => obj[type](...args)});

  const actions = {
    decrement: () => buildAction("decrement"),
    add: memoize(value => buildAction("add", value)),
    addButton: ev => buildAction("add", ev.button),
    addFiveFromPromise: () => buildAction("addFiveFromPromise"),
    callOnFinish: () => buildAction("callOnFinish"),
    newProps: (prevProps) => buildAction("newProps", prevProps),
  };

  const update = (action, state, props) => action.match({
    decrement: () =>
      newState({value: state.value - 1}),
    add: value =>
      newState({value: state.value + value}),
    addFiveFromPromise: () =>
      command({asyncActions: [Promise.resolve(actions.add(5))]}),
    callOnFinish: () =>
      command({parentActions: [callProp(props.onFinish, state.value)]}),
    newProps: (prevProps) =>
      command({parentActions: [callProp(props.onPropChange, prevProps.initialValue, props.initialValue)]}),
  });

  const render = (state, _props) => (
    <div>
      <button className="decrement" $onClick={actions.decrement}>-1</button>
      <button className="increment" $onClick={actions.add(+1)}>+1</button>
      <button className="addButton" $onClick={actions.addButton}>+BUTTON</button>
      <button className="addFiveFromPromise" $onClick={actions.addFiveFromPromise}>+5_FROM_PROMISE</button>
      <button className="callOnFinish" $onClick={actions.callOnFinish}>CALL_ON_FINISH</button>

      <div className="value">{state.value}</div>
    </div>
  );

  const Component = component("Counter", {
    init,
    render,
    update,
    lifecycles: {newProps: actions.newProps},
    propTypes: {
      onFinish: PropTypes.func.isRequired,
      onPropChange: PropTypes.func.isRequired,
    }
  });

  const finalProps = setProps || {
    initialValue: 0,
    onFinish: jest.fn(),
    onPropChange: jest.fn(),
    ...mergeProps,
  };

  return mount(React.createElement(Component, finalProps));
}

let counter;

describe("Counter component", () => {
  describe("on initial state", () => {
    beforeEach(() => {
      counter = getCounter();
    });

    it("renders component with correct name", () => {
      expect(counter.name()).toEqual("Counter");
    });

    it("renders value", () => {
      expect(counter.find(".value").text()).toEqual("0");
    });
  });

  describe("with missing prop", () => {
    it("throws error", () => {
      expect(() => getCounter({mergeProps: {onFinish: 1}}))
        .toThrow("Warning: Failed prop type: Invalid prop `onFinish` of type `number` supplied to `Counter`, expected `function`.");
    });
  });

  describe("when button <decrement> clicked", () => {
    beforeEach(() => {
      counter = getCounter();
      counter.find(".decrement").simulate("click");
    });

    it("decrements state value by 1", () => {
      expect(counter.find(".value").text()).toEqual("-1");
    });
  });

  describe("when button <increment> clicked", () => {
    beforeEach(() => {
      counter = getCounter();
      counter.find(".increment").simulate("click");
    });

    it("increments state value by 1", () => {
      expect(counter.find(".value").text()).toEqual("1");
    });
  });

  describe("when button <addButton> clicked", () => {
    beforeEach(() => {
      counter = getCounter();
      counter.find(".addButton").simulate("click", {button: 3});
    });

    it("increments state value by button value", () => {
      expect(counter.find(".value").text()).toEqual("3");
    });
  });

  describe("when button <addFiveFromPromise> clicked", () => {
    beforeEach(() => {
      counter = getCounter();
      counter.find(".addFiveFromPromise").simulate("click");
    });

    it("increments state value by 5", (done) => {
      onNextTick(done, () => expect(counter.find(".value").text()).toEqual("5"));
    });
  });

  describe("when button <callOnFinish> clicked", () => {
    beforeEach(() => {
      counter = getCounter();
      counter.find(".callOnFinish").simulate("click");
    });

    it("calls parent prop onFinish with current state value", () => {
      expect(counter.props().onFinish)
        .toBeCalledTimes(1)
        .toBeCalledWith(0);
    });
  });

  describe("when initialProp prop is changed", () => {
    beforeEach(() => {
      counter = getCounter();
      counter.setProps({initialValue: 10});
    });

    it("calls prop onFinish with previous and new prop values", () => {
      expect(counter.props().onPropChange)
        .toBeCalledTimes(1)
        .toBeCalledWith(0, 10);
    });
  });
});
