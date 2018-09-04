import React from 'react';
import {shallow, mount} from 'enzyme';
import {component, command, newState, memoize} from '..'

function onNextTick(done, expectation) {
  return setImmediate(() => {
    expectation();
    done();
  });
}

function getCounter() {
  const init = command({
    state: {value: 0},
  });

  const action = (type, ...args) => ({match: (obj) => obj[type](...args)});

  const actions = {
    decrement: () => action("decrement"),
    add: memoize(value => action("add", value)),
    addButton: ev => action("add", ev.button),
    addFiveFromPromise: () => action("addFiveFromPromise"),
  };

  const update = (_action, state, props) => _action.match({
    decrement: () => newState({value: state.value - 1}),
    add: value => newState({value: state.value + value}),
    addFiveFromPromise: value => command({asyncActions: [Promise.resolve(actions.add(5))]})
  });

  const render = (state, props) => (
    <div>
      <button className="decrement" $onClick={actions.decrement}>-1</button>
      <button className="increment" $onClick={actions.add(+1)}>+1</button>
      <button className="addButton" $onClick={actions.addButton}>+BUTTON</button>
      <button className="addFiveFromPromise" $onClick={actions.addFiveFromPromise}>+5_FROM_PROMISE</button>

      <div className="value">{state.value}</div>
    </div>
  );

  const Component = component("Counter", {init, render, update});

  return mount(<Component />);
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
});
