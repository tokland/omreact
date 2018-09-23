import React from "react";
import {mount} from "enzyme";
import {component, newState, asyncAction, parentAction, memoize} from "..";
import PropTypes from "prop-types";

function onNextTick(done, expectation) {
  return setTimeout(() => {
    expectation();
    done();
  }, 1);
}

const buildEvent = (type, ...args) => ({match: (obj) => obj[type](...args)});

function getCounter({setProps, mergeProps} = {}) {
  const init = props => newState({value: props.initialValue});

  const events = {
    decrement: () => buildEvent("decrement"),
    add: memoize(value => buildEvent("add", value)),
    addButton: ev => buildEvent("add", ev.button),
    set10And5FromProm: () => buildEvent("set10And5FromProm"),
    callOnFinish: () => buildEvent("callOnFinish"),
    newProps: (prevProps) => buildEvent("newProps", prevProps),
  };

  const update = (event, state, props) => event.match({
    decrement: () =>
      newState({value: state.value - 1}),
    add: value =>
      newState({value: state.value + value}),
    set10And5FromProm: () =>
      [newState({value: 10}), asyncAction(Promise.resolve(events.add(5)))],
    callOnFinish: () =>
      parentAction(props.onFinish, state.value),
    newProps: (prevProps) =>
      parentAction(props.onPropChange, prevProps.initialValue, props.initialValue),
  });

  const render = (state, _props) => (
    <div>
      <button className="decrement" $onClick={events.decrement}>-1</button>
      <button className="increment" $onClick={events.add(+1)}>+1</button>
      <button className="addButton" $onClick={events.addButton}>+BUTTON</button>
      <button className="set10And5FromProm" $onClick={events.set10And5FromProm}>+5_FROM_PROMISE</button>
      <button className="callOnFinish" $onClick={events.callOnFinish}>CALL_ON_FINISH</button>

      <div className="value">{state.value}</div>
    </div>
  );

  const Component = component("Counter", {
    init,
    render,
    update,
    lifecycles: {newProps: events.newProps},
    propTypes: {
      initialValue: PropTypes.number,
      onFinish: PropTypes.func.isRequired,
      onPropChange: PropTypes.func.isRequired,
    },
    defaultProps: {
      initialValue: 0,
    }
  });

  const finalProps = setProps || {
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

    it("renders with name", () => {
      expect(counter.name()).toEqual("Counter");
    });

    it("renders value", () => {
      expect(counter.find(".value").text()).toEqual("0");
    });
  });

  describe("with missing prop", () => {
    it("throws error", () => {
      expect(() => getCounter({mergeProps: {onFinish: 1}}))
        .toThrow("Warning: Failed prop type: Invalid prop " +
          "`onFinish` of type `number` supplied to `Counter`, expected `function`.");
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

    it("increments state value by the button value", () => {
      expect(counter.find(".value").text()).toEqual("3");
    });
  });

  describe("when button <set10And5FromProm> clicked", () => {
    beforeEach(() => {
      counter = getCounter();
      counter.find(".set10And5FromProm").simulate("click");
    });

    it("sets state value to 10+5 = 15", (done) => {
      onNextTick(done, () => expect(counter.find(".value").text()).toEqual("15"));
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
