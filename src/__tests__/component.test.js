import React from 'react';
import {shallow, mount} from 'enzyme';
import {component, command, newState, memoize, callProp} from '..'

function onNextTick(done, expectation) {
  return setImmediate(() => {
    expectation();
    done();
  });
}

function getCounter() {
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
  };

  const update = (action, state, props) => action.match({
    decrement: () => newState({value: state.value - 1}),
    add: value => newState({value: state.value + value}),
    addFiveFromPromise: value => command({asyncActions: [Promise.resolve(actions.add(5))]}),
    callOnFinish: () => command({parentActions: [callProp(props.onFinish, state.value)]}),
  });

  const render = (state, props) => (
    <div>
      <button className="decrement" $onClick={actions.decrement}>-1</button>
      <button className="increment" $onClick={actions.add(+1)}>+1</button>
      <button className="addButton" $onClick={actions.addButton}>+BUTTON</button>
      <button className="addFiveFromPromise" $onClick={actions.addFiveFromPromise}>+5_FROM_PROMISE</button>
      <button className="callOnFinish" $onClick={actions.callOnFinish}>CALL_ON_FINISH</button>

      <div className="value">{state.value}</div>
    </div>
  );

  const Component = component("Counter", {init, render, update});

  const onFinish = jest.fn();

  return mount(<Component initialValue={0} onFinish={onFinish} />);
}

let counter;

describe("Counter component", () => {
  describe("on initial state", () => {
    beforeEach(() => counter = getCounter());

    it('renders component with correct name', () => {
      expect(counter.name()).toEqual("Counter");
    });

    it('renders value', () => {
      expect(counter.find('.value').text()).toEqual("0");
    });
  });

  describe("when button <decrement> clicked", () => {
    beforeEach(() => counter = getCounter());

    it("decrements state value by 1", () => {
      counter.find('.decrement').simulate("click");
      expect(counter.find('.value').text()).toEqual("-1");
    });
  });

  describe("when button <increment> clicked", () => {
    beforeEach(() => counter = getCounter());

    it("increments state value by 1", () => {
      counter.find('.increment').simulate("click");
      expect(counter.find('.value').text()).toEqual("1");
    });
  });

  describe("when button <addButton> clicked", () => {
    beforeEach(() => counter = getCounter());

    it("increments state value by button value", () => {
      counter.find('.addButton').simulate("click", {button: 3});
      expect(counter.find('.value').text()).toEqual("3");
    });
  });

  describe("when button <addFiveFromPromise> clicked", () => {
    beforeEach(() => counter = getCounter());

    it("increments state value by 5", (done) => {
      counter.find('.addFiveFromPromise').simulate("click");
      onNextTick(done, () => expect(counter.find('.value').text()).toEqual("5"));
    });
  });

  describe("when button <callOnFinish> clicked", () => {
    beforeEach(() => counter = getCounter());

    it("calls parent prop onFinish with current state value", () => {
      counter.find('.callOnFinish').simulate("click");
      expect(counter.props().onFinish)
        .toBeCalledTimes(1)
        .toBeCalledWith(0);
    });
  });
});
