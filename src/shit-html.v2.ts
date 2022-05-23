export function html(strParts: TemplateStringsArray, ...exprResults: unknown[]) {
  const domString = strParts.reduce((previous, next, index) => {
    const exprResult = exprResults[index - 1];
    if (exprResult instanceof HTMLTemplateElement) {
      return previous + exprResult.innerHTML + next;
    }
    return previous + exprResult + next;
  });
  const template = document.createElement('template');
  template.innerHTML = domString;
  return template;
}

export function css(strParts: TemplateStringsArray, ...exprResults: unknown[]) {
  const str = String.raw(strParts, ...exprResults);
  const style = new CSSStyleSheet();
  (style as any).replaceSync(str);
  return style;
}

export function render(template: ReturnType<typeof html>, target: Element) {
  target.replaceChildren(template.content);
}
