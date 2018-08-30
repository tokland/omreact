> Purely functional React components with local state

React is mostly a functional framework, but it still promotes imperative code since the component updater (`this.setState`) works by performing side-effects. `OmReact` is a thin abstraction layer over React to write purely functional components that hold local state.

`OmReact` applies the [Elm architecture](https://guide.elm-lang.org/architecture/) to React components by defining a **single update** function that takes **actions** and returns **commands** (state + async actions).

## Install

```sh
$ yarn add omreact
```

## Example: a counter

```js
import React from 'react';
import {component, newState} from 'omreact';

const init = newState({value: 0});

const update = (action, state, props) => {
  switch (action) {
    case "decrement":
      return newState({value: state.value - 1});
    case "increment":
      return newState({value: state.value + 1});
    default:
      throw new Error(`Unknown action: ${action}`);
  }
};

const render = (state, props) => (
  <div>
    <button $onClick="decrement">-1</button>
    <button $onClick="increment">+1</button>
    <div>{state.value}</div>
  </div>
);

export default component("MyCounterSimple", {init, render, update});
```

The same component, using `React.Component`: [ImperativeCounter.js](examples/src/counter/ImperativeCounter.js)

##  OnReact component

### Component overview

![Diagram](https://github.com/tokland/omreact/blob/master/OmReact.png)

> component(name, {init, update, render, [lifecycles]})

Options:

- `init: command | state => command`: This replaces `this.state =` in a React component constructor and async and props calling in `componentDidMount`.

- `update(action, state, props): command`: Take an action and current `state`/`props` and return a command to perform.

- `render(state, props): React.element` with `$eventProp={action | args => action}`: Like a React `render` function except that event props are $-prefixed. An action can be either a plain value or a pure function. `$` is a valid JS character for variable names, this way we don't need to use a custom JSX babel transform. `@onClick={...}` would be probably nicer, though.

- `lifecycles: {[key: lifeCycleName]: action}`: More on the lifecyle section.

### Commands

A *command* returned by `init` or `update` may have any of those three keys: `state`, `asyncActions` and `parentActions`.

#### Update state (`state`)

Return the new state of the component. This should be the new full state, not partial state like `this.setState` takes. Since it's quite typical for a reducer to only change the internal component state, a function `newState(newStateValue): command` is exported.

#### Side-effects (`asyncActions`)

When creating an `OmReact` component, you don't have access to `setState`. To write asynchronous code (timers, requests), you return instead a command containing asynchronous actions (`asyncActions`), an array of promises that resolve into some other action. An example:

```js
import React from 'react';
import {Button} from '../helpers';
import {component, command, newState} from 'omreact';

const getRandomNumber = (min, max) => {
  return fetch("https://qrng.anu.edu.au/API/jsonI.php?length=1&type=uint16")
    .then(res => res.json())
    .then(json => (json.data[0] % (max - min + 1)) + min);
};

const actions = {
  add: value => ({type: "add", value}),
  fetchRandom: {type: "fetchRandom"},
};

const init = newState({value: 0});

const update = (action, state, props) => {
  switch (action.type) {
    case "add":
      return newState({value: state.value + action.value});
    case "fetchRandom":
      return command({asyncActions: [getRandomNumber(1, 10).then(actions.add)]});
    default:
      throw new Error(`Unknown action: ${JSON.stringify(action)}`);
  }
};

const render = (state, props) => (
  <div>
    <Button $onClick={actions.fetchRandom}>+ASYNC_RANDOM(1..10)</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterWithSideEffects", {init, render, update});
```

#### Notify the parent component (`parentActions`)

React components report to their parents using props. While there is nothing preventing you from directly calling a prop in an `OmReact` component, you can keep it purely functional returning a command with `parentActions` containing an array of `callProp` entries. Example:

```js
import React from 'react';
import {Button} from '../helpers';
import {component, command} from 'omreact';
import {callProp} from 'omreact/commands';

const actions = {
  increment: ev => ({type: "increment"}),
  notifyParent: ev => ({type: "notifyParent"}),
};

const init = command({state: {value: 0}});

const update = (action, state, props) => {
  switch (action.type) {
    case "increment":
      return command({state: {value: state.value + 1}});
    case "notifyParent":
      return command({parentActions: [callProp(props.onFinish, state.value)]});
    default:
      throw new Error(`Unknown action: ${JSON.stringify(action)}`);
  }
};

const render = (state, props) => (
  <div>
    <Button $onClick={actions.increment}>+1</Button>
    <Button $onClick={actions.notifyParent}>Notify parent</Button>
    <div>{state.value}</div>
  </div>
);

export default component("CounterParentNotifications", {init, render, update});
```

### Component Lifecycle

Implemented lifecycle values:

* `propsChanged: (prevProps) => action`. Called any time props change.

### Actions

#### Typical action signatures

An action can have no arguments, *constructor arguments*, *event arguments*, or both. A typical actions object may look like this:

```js
import {memoize} from 'omreact';

const actions = {
  increment: {type: "increment"},
  add: memoize(value => ({type: "add", value})),
  addMouseButton: ev => ({type: "addMouseButton", ev}),
  addValueAndMouseButton: memoize(value => ev => ({type: "add", value, addValueAndMouseButton})),
}
```

Use like this on event props:

- `actions.increment`: An _object_, use it when you need no arguments. Example `$onClick={actions.increment}`. The dispatcher will see that it's not a function and won't call it with the event arguments.
- `actions.add`: A _1-time callable function_ that takes only action constructor arguments. Example: `$onClick={actions.add(1)}`. This function should be memoized.
- `actions.addMouseButton`: A _1-time callable function_ that takes only event arguments: Example: `$onClick={actions.addMouseButton}`. This function should not be memoized.
- `actions.addValueAndMouseButton`: A _2-time callable function_ that takes both constructor and event arguments: `$onClick={actions.addValueAndMouseButton(1)}`. The first function should be memoized.

#### Memoize actions

It's a well known caveat that you should never pass newly created values as props, otherwise a React component will think those props changed and will issue an unnecessary re-render. This applies to arrays, objects or arrow functions (no problem with strings, `===` works fine on them).  Extract prop values to `const` values to avoid this problem. Also, use memoization (the library already provides a helper for that: `memoize`) in action constructors. Example:

```js
import {component, memoize} from 'omreact';

const actions = {
  increment: ev => {type: "increment"},
  add: memoize(value => ({type: "increment"})),
};
```

#### Actions are agnostic

An action can be any any object or function (if it has constructor/event arguments). Create your own abstractions using actions as strings, arrays, objects, [proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy), whatever works for you.

Check the [examples](examples/src) to see some alternative ways:

- Using a [function](https://github.com/tokland/omreact/blob/master/examples/src/counter/CounterActionsSimple.js) that builds actions from a string and constructor arguments.

- Using pre-defined [ADT constructors](https://github.com/tokland/omreact/blob/master/examples/src/counter/CounterSimpleAdt.js).

- Using on-the-fly [proxy constructors](https://github.com/tokland/omreact/blob/master/examples/src/counter/CounterActionsWithProxy.js).

#### Actions are composable

```
import {component, newState, composeActions, memoize} from 'omreact';

// ...

const update = (action, state, props) => action.match({
  add: value =>
    newState({value: state.value + value}),
  addOnePlusTwo: () =>
    composeActions([actions.add(1), actions.add(2)], update, state, props),
});

// ...
```

## Examples page

```sh
$ cd examples
$ yarn install
$ yarn start
```

Check the [examples](examples/src) directory in the repository.
