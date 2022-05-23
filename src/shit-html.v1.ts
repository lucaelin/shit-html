export function html(strParts: TemplateStringsArray, ...exprResults: unknown[]) {
  return String.raw(strParts, ...exprResults)
}

export function css(strParts: TemplateStringsArray, ...exprResults: unknown[]) {
  const str = String.raw(strParts, ...exprResults);
  const style = new CSSStyleSheet();
  (style as any).replaceSync(str);
  return style;
}

export function render(template: string, target: Element | ShadowRoot) {
  target.innerHTML = template;
}
