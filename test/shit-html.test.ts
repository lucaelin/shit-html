import chai from 'chai';
const expect = chai.expect;

//import {html, render} from 'lit';
import { html, render } from '../src/shit';

import gwt from './gwt';
const it = gwt(givenAll);
function givenAll() {
  this.target = document.createElement('div');
}

describe('shit-html', function () {
  it('should render plain content',
    function given() { },
    function when() {
      render(html`<h1>yay</h1>`, this.target);
    },
    function then() {
      const h1 = this.target.querySelector('h1');
      expect(h1).to.exist;
      expect(h1.innerText).to.contain('yay');
    },
  );
  it('should render plain attributes',
    function given() { },
    function when() {
      render(html`<h1 id="bla">yay</h1>`, this.target);
    },
    function then() {
      const h1 = this.target.querySelector('#bla');
      expect(h1).to.exist;
    },
  );
  it('should render templated attributes',
    function given() {
      this.text = "some...";
    },
    function when() {
      render(html`<h1 bla=${this.text}></h1>`, this.target);
    },
    function then() {
      const h1 = this.target.querySelector('h1');
      expect(h1.getAttribute('bla')).to.contain(this.text);
    },
  );
  it('should set properties',
    function given() {
      this.text = "some...";
    },
    function when() {
      render(html`<h1 .bla=${this.text}></h1>`, this.target);
    },
    function then() {
      const h1 = this.target.querySelector('h1');
      expect(h1.bla).to.equal(this.text);
    },
  );
  it('should set event listeners',
    function given() {
      this.callbackCalled = false;
      this.callback = () => {
        this.callbackCalled = true;
      };
    },
    function when() {
      render(html`<h1 @click=${this.callback}></h1>`, this.target);
      const h1 = this.target.querySelector('h1');
      h1.click();
    },
    function then() {
      expect(this.callbackCalled).to.be.true;
    },
  );
  it('should set boolean attributes',
    function given() { },
    function when() {
      render(html`<h1 ?true=${true} ?false=${false} ></h1>`, this.target);
    },
    function then() {
      this.h1 = this.target.querySelector('h1');
      expect(this.h1.hasAttribute('true')).to.be.true;
      expect(this.h1.hasAttribute('false')).to.be.false;
    },
  );
  it('should render templated content',
    function given() {
      this.text = 'some...';
    },
    function when() {
      render(html`<h1>${this.text}</h1>`, this.target);
      console.log('aaaaaaaaa',this.target.innerHTML);
    },
    function then() {
      const h1 = this.target.querySelector('h1');
      expect(h1.textContent).to.contain(this.text);
    },
  );
  it('should update templated content',
    function given() {
      this.text1 = 'some...';
      this.text2 = '...body';
      this.renderText = (text)=>html`<h1>${text}</h1>`
    },
    function when() {
      render(this.renderText(this.text1), this.target);
      render(this.renderText(this.text2), this.target);
    },
    function then() {
      const h1 = this.target.querySelector('h1');
      expect(h1.textContent).to.contain(this.text2);
    },
  );
  it('should render nested templates',
    function given() { },
    function when() {
      render(html`<p>${html`<b>nested</b>`} content</p>`, this.target);
    },
    function then() {
      console.log(this.target.innerHTML);
      const p = this.target.querySelector('p');
      const b = this.target.querySelector('b');
      expect(b).to.exist;
      expect(p.textContent).to.equal("nested content");
      expect(b.textContent).to.equal("nested");
    },
  );
  it('should render siblings',
    function given() {
    },
    function when() {
      render(html`<h1>Hello</h1> <h2>${"World!"}</h2>`, this.target);
    },
    function then() {
      const h1 = this.target.querySelector('h1');
      const h2 = this.target.querySelector('h2');
      expect(h1.textContent).to.equal('Hello');
      expect(h2.textContent).to.equal('World!');
    },
  );
  it('should render nested siblings',
    function given() {
    },
    function when() {
      render(html`<header>${html`<h1>Hello</h1> <h2>World!</h2>`}</header>`, this.target);
    },
    function then() {
      expect(this.target.textContent).to.equal('Hello World!');
    },
  );
  it('should reuse non-primitive dom elements', 
    function given() {
      this.foo1 = 'bar';
      this.foo2 = 'baz';
      this.component = class MyComponent extends HTMLElement {constructor() {super(); console.log('new')}}
      customElements.define('my-component', this.component);
      this.createTemplate = function(foo) {
        return html`<my-component><p foo=${foo}>${foo}</p></my-component>`
      }
    },
    function when() {
      render(this.createTemplate(this.foo1), this.target);
      this.component1 = this.target.querySelector('my-component');
      render(this.createTemplate(this.foo2), this.target);
      this.component2 = this.target.querySelector('my-component');
    },
    function then() {
      expect(this.component1).to.exist;
      expect(this.component2).to.exist;
      expect(this.component1 === this.component2).to.be.true;
    },
  );
})