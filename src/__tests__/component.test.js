import React from 'react';
//import Hello from './Hello';
import {shallow} from 'enzyme';
//import {component} from '..'

it('renders', () => {
  const wrapper = shallow(<div>Hello</div>);
  expect(wrapper.find('div').text()).toEqual('Hello');
});
