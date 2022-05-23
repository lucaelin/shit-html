import chai from 'chai';
const expect = chai.expect;
import gwt from './gwt';

//import {html, render, css} from 'lit';
//import {LitElement as ShitElement} from 'lit';
import { customElement } from 'lit/decorators.js';
import { ShitElement, html, css } from '../src/shit-element.v1';


function givenAll() { }
const it = gwt(givenAll);

describe('shit-element', function () {
  it('should render plain content',
    function given() {
      const name = 'my-element-1';

      @customElement(name)
      class MyElement extends ShitElement {
        value = 'yay';

        render() {
          return html`<h1>${this.value}</h1>`;
        }
      }

      this.target = document.createElement(name);
      document.body.replaceChildren(this.target);

      this.targetShadow = this.target.shadowRoot;
    },
    function when() { },
    function then() {
      const h1 = this.targetShadow.querySelector('h1');
      expect(h1).to.exist;
      expect(h1.innerText).to.contain('yay');
    },
  );
  it('should render styles',
    function given() {
      const name = 'my-element-2';

      @customElement(name)
      class MyElement extends ShitElement {
        static get styles() {
          return [css`
          h1 {
            --some-variable: green;
          }
        `]
        }

        value = 'yay';

        render() {
          return html`<h1>${this.value}</h1>`;
        }
      }

      this.target = document.createElement(name);
      document.body.replaceChildren(this.target);
      this.targetShadow = this.target.shadowRoot;

      this.control = document.createElement('h1');
      document.body.appendChild(this.control);
    },
    async function when() { },
    function then() {
      const h1 = this.targetShadow.querySelector('h1');
      expect(h1).to.exist;
      const style = getComputedStyle(h1);
      expect(style.getPropertyValue('--some-variable')).to.equal('green');
      const controlStyle = getComputedStyle(this.control);
      expect(controlStyle.getPropertyValue('--some-variable')).to.not.equal('green');
    },
  );
  it('should update properties',
    function given() {
      const name = 'my-element-3';

      @customElement(name)
      class MyElement extends ShitElement {
        static get properties() {
          return {
            value: {
              type: String,
            }
          }
        }
        value = 'yay';

        render() {
          return html`<h1>${this.value}</h1>`;
        }
      }

      this.target = document.createElement(name);
      document.body.replaceChildren(this.target);

      this.targetShadow = this.target.shadowRoot;
    },
    async function when() {
      this.target.value = 'ney';
      await this.target.updatePending;
    },
    function then() {
      const h1 = this.targetShadow.querySelector('h1');
      expect(h1).to.exist;
      expect(h1.innerText).to.contain('ney');
    },
  );
})