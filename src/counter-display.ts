import { ShitElement, html, css } from '../src/shit-element';
import { customElement } from 'lit/decorators.js';
import "tslib";

@customElement('counter-display')
class CounterDisplay extends ShitElement {
  static get properties() {
    return {
      count: { type: Number, reflected: true }
    }
  }
  static get styles() {
    return [css`
    h1 {
      color: orange;
    }
  `]
  }

  count = 2;

  constructor() {
    super();
    this.increment = this.increment.bind(this);
  }

  increment() {
    this.count++;
  }

  render() {
    return html`
      <h1>My Count: <b>${this.count}</b></h1>
      <button @click=${this.increment}>My Count +1</button>
    `;
  }
}