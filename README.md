> Purely functional React components with local state

`OmReact` is a thin abstraction layer over React so you can write purely functional components with local state. While React.js is mostly a functional framework, it still promotes imperative code since `this.setState`, the component state updater, works by performing side-effects.

The idea is similar to the [Elm architecture](https://guide.elm-lang.org/architecture/) but applied to components: define a **single update** function that takes **actions** and returns **commands** (new state + async actions + parent actions). On render, instead of functions with side effects, event props (i.e. onClick) take pure values instead, either action constructors or plain values.

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

##  OnReact component

### Component overview

![Diagram](https://github.com/tokland/omreact/blob/master/OmReact.png)

```
component: (
  name: string,
  options: {
    init: Command | Props => Command,
    update: (action, state, props) => Command,
    render: (state, props => React.Element,
    lifecycles?: Record<string, action>,
    propTypes?: Object,
    defaultProps?: Object,
  }) => React.Component;

type Command = {
  state: State,
  asyncActions: Array<Promise<Action>>,
  parentActions: Array<ParentAction>,
}
```

Options:

- `init`: This replaces `this.state =` in a React component constructor and async and props calling in `componentDidMount`.

- `update`: Take an action and current `state`/`props` and return a command to perform.

- `render` with `$eventProp={action | args => action}`: Like a React `render` function except that event props must be $-prefixed. An action can be either a plain value or a pure function. `$` is being used for convenience, it's a valid character for a variable name so there is no need to use a custom JSX babel transform. `@onClick={...}` would be probably nicer, though.

- `lifecycles`: More on the lifecyle section.

- `propTypes`/`defaultProps`. Standard React keys, will be passed down to the component.

### Commands

A *command* returned by `init` or `update` is an object containing any of those three keys: `state`, `asyncActions` and `parentActions`.

#### Update state (`state`)

Return the new state of the component. This should be the new full state, not partial state like `this.setState` takes. Since it's typical for a reducer to only change the state, a function `newState: newStateValue => command` is provided.

#### Side-effects (`asyncActions`)

In `OmReact` components, you don't have access to `setState`, to write asynchronous code (timers, requests), you return instead a command containing asynchronous actions (`asyncActions`), an array of promises that resolve into some other action. An example:

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

React components report to their parents through props. While there is nothing preventing you from directly calling a prop in an `OmReact` component like you do in React, you should keep it purely functional by returning a command with `parentActions`, which contains an array of `callProp` entries. Example:

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

`OmReact` implements those React lifecycles:

* `newProps: (prevProps) => action`. Called any time props change.

Example:

```
const actions = {
  newProps: prevProps => ({type: "newProps", prevProps}),
}

const update = (action, state, props) => (
  switch (action.type) {
    case "newProps":
      return command({state: {value: action.prevProps.value}});
    // other actions
  }
);

### Actions

#### Typical action signatures

A typical way of defining actions is to have *constructor arguments* (optional, should be memoized), *event arguments* (should not be memoized), or both. A typical `actions` object may look like this:

```js
import {memoize} from 'omreact';

const actions = {
  increment: {type: "increment"},
  add: memoize(value => ({type: "add", value})),
  addMouseButton: ev => ({type: "addMouseButton", ev}),
  addValueAndMouseButton: memoize(value => ev => ({type: "add", value, ev})),
}
```

Use like this on the event props of rendered elements:

- `actions.increment`: An _object_, use it when you need no arguments. Example `$onClick={actions.increment}`. The dispatcher will see that it's not a function and won't call it with the event arguments.
- `actions.add`: A _1-time callable function_ that takes only action constructor arguments. Example: `$onClick={actions.add(1)}`. This function should be memoized.
- `actions.addMouseButton`: A _1-time callable function_ that takes only event arguments: Example: `$onClick={actions.addMouseButton}`. This function should not be memoized.
- `actions.addValueAndMouseButton`: A _2-time callable function_ that takes both constructor and event arguments: `$onClick={actions.addValueAndMouseButton(1)}`. The first function should be memoized.

#### Memoize actions

It's well known  that you should never pass newly created values as props, otherwise a React component will think those props changed and will issue an unnecessary re-render. This applies to arrays, objects or arrow functions (no problem with strings, `===` works fine on them).  Extract prop values to `const` values to avoid this problem. Also, use memoization (the library already provides a helper for that: `memoize`) in action constructors. Example:

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
