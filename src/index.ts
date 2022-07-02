import { html, render } from './shit';
import './counter-display';

let value = 0;
(function update() {
  value++;

  render(html`
    <h1>Count: <b>${value}<b></h1>
    <button @click=${update}>counter++</button>
  `, document.querySelector('#shithtml') as HTMLElement)

  document.querySelector('#shitelement').setAttribute('count', value.toString());
  // document.querySelector('#shitelement').count = value;
})();
