// matches if end of string is inside a tag, finds the current attribute we are in and any comment that is in front of the tag
const findContext = /(<!--(?<comment>shit-[^>]*)-->)?<[^>]* (?<attribute>[^>=]*=("|')?)$/

const generateMarker = ()=>('shit-'+Math.random().toString(16).split('.').pop());

const templateStore = new WeakMap<TemplateStringsArray, ShitTemplate>();
function lazyPreRender(strings: TemplateStringsArray) {
  if (templateStore.has(strings)) return templateStore.get(strings);
  const template = preRender(strings);
  templateStore.set(strings, template);
  return template;
}
function preRender(strParts: TemplateStringsArray) {
  const store = new Map<string, Map<number, string>>();
  const addToStore = function (marker: string, attribute: string, value: number) {
    if(!store.has(marker)) store.set(marker, new Map());
    const attributeStore = store.get(marker);
    attributeStore.set(value, attribute);
  };

  const domString = strParts.reduce((previous, next, index) => {
    const matches = findContext.exec(previous);
    if (matches) {
      // we are inside a tag
      const { 0: match, groups: { comment, attribute } } = matches;

      const marker = comment ? comment : generateMarker()
      if (!comment) {
        // we have not yet commented this tag
        previous = previous.slice(0, previous.length - match.length) 
          + '<!--' + marker + '-->' 
          + match;
      }
 
      // we have a marker
      addToStore(marker, attribute, index-1);

      return previous/*.slice(0,previous.length-attribute.length)*/ 
        + /*next.startsWith('"') || next.startsWith("'") ? next.slice(1) :*/ next;
    } 
    // we are outside a tag

    const marker = generateMarker();
    addToStore(marker, '#', index-1);
    return previous 
      + '<!--' + marker + '-->' 
      + '<!-- /' + marker + '-->' 
      + next;
  });

  const template = document.createElement('template');
  template.innerHTML = domString;
  //console.log(domString, store, template.content);

  return {
    is: "shit-template",
    template: template,
    store: store,
    domString: domString,
    strings: strParts,
  };
}
type ShitTemplate = ReturnType<typeof preRender>;

export function html(strParts: TemplateStringsArray, ...exprResults: unknown[]) {
  return {
    ...lazyPreRender(strParts),
    strings: strParts,
    values: exprResults,
  };
}
type ShitTemplateValues = ReturnType<typeof html>;


const currentTemplate = Symbol();
export function render(template: ShitTemplateValues, target: HTMLElement | ShadowRoot) {
  console.log('rendering', template, 'into', target);

  // check if dom in target violates the template
  if (target[currentTemplate]?.strings !== template.strings) {
    // inject the dom into target
    target.replaceChildren(template.template.content.cloneNode(true));
    target[currentTemplate] = template;
  }

  // update values in target
  updateValues(template.store, template.values, [...target.childNodes]);
}

function getDomAfterComment(comment: Comment) {
  const targets: Node[] = [];
  let target: Node = comment.nextSibling;
  while (target && !(target as Comment).data?.includes(comment.data)) {
    targets.push(target);
    target = target.nextSibling;
  }
  return targets;
}

function findCommentNodes(target: Node[]): Comment[] {
  return target.flatMap((node: Node) => {
    if (node.nodeName === '#comment') return node as Comment;
    return findCommentNodes([...node.childNodes]);
  })
}
function updateValues(store, values: unknown[], target: Node[]) {
  const commentNodes = findCommentNodes(target);
  //console.log('commentNodes', commentNodes);
  commentNodes.forEach((c: Comment) => {
    const indices = store.get(c.data) || [];
    [...indices.entries()].forEach(([i,attr])=>{
      const value = values[i];
      //console.log('setting', i, value, 'on', c.data, c.nextSibling, 'attr', attr);
      
      setValue(c, attr, value);
    })
  })
}
function setTemplateValue(c: Comment, template: ShitTemplateValues, targets: Node[]) {
  // check if dom between comments violates the template
  if (c[currentTemplate]?.strings !== template.strings) {
    // remove existing dom
    targets.forEach(t=>t.parentElement.removeChild(t));
    // place template dom
    c.after(template.template.content.cloneNode(true));
    c[currentTemplate] = template;
  }
  // update value
  updateValues(template.store, template.values, getDomAfterComment(c));
}

const eventListenerStore = Symbol();
function setValue(c: Comment, attr: string, value: unknown) {
  const cleanattr = attr.replaceAll(/[^a-zA-Z0-9-]/g, '');
  const target = c.nextElementSibling;
  if (attr==='#') {
    const targets = getDomAfterComment(c);
    if ((value as ShitTemplateValues).is === "shit-template") {
      setTemplateValue(c, value as ShitTemplateValues, targets)
    } else {
      console.log('placing', value, 'after', c, 'into', targets);
      const node = new Text((value as string|number|boolean).toString());
      targets.forEach(t=>t.parentElement.removeChild(t));
      c.after(node);
    }
  } else if (attr.startsWith('.')) {
    target[cleanattr] = value;
  } else if (attr.startsWith('?')) {
    if (value) target.setAttribute(cleanattr, cleanattr);
    else target.removeAttribute(cleanattr);
  } else if (attr.startsWith('@')) {
    if (!target[eventListenerStore]) target[eventListenerStore] = new Map<string, EventListenerOrEventListenerObject>() 
    const listenerStore = target[eventListenerStore];
    if (listenerStore.get(cleanattr) !== value) {
      target.removeEventListener(cleanattr, listenerStore.get(cleanattr))
      target.addEventListener(cleanattr, value as any); 
      listenerStore.set(cleanattr, value)
    }
    
  } else {
    target.setAttribute(cleanattr, value.toString());
  }
}

export function css(strParts: TemplateStringsArray, ...exprResults: unknown[]) {
  const str = String.raw(strParts, ...exprResults);
  const style = new CSSStyleSheet();
  (style as any).replaceSync(str);
  return style;
}