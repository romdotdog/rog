import type { Token, Tokens } from "marked";
import { JSX, lazy, Suspense } from "solid-js";

const BlockMath = lazy(() => import("./KaTeX").then(d => ({ default: d.BlockMath })));
const InlineMath = lazy(() => import("./KaTeX").then(d => ({ default: d.InlineMath })));

export function parse(tokens: Token[]): JSX.Element {
    return tokens.map(token => {
        switch (token.type) {
            case "space": {
                return null;
            }

            case "heading": {
                const level = token.depth;
                const content = parseInline(token.tokens);
                switch (level) {
                    case 1:
                        return <h1>{content}</h1>;
                    case 2:
                        return <h2>{content}</h2>;
                    case 3:
                        return <h3>{content}</h3>;
                    case 4:
                        return <h4>{content}</h4>;
                    case 5:
                        return <h5>{content}</h5>;
                    case 6:
                        return <h6>{content}</h6>;
                    default:
                        throw new Error("invalid heading level");
                }
            }

            case "paragraph": {
                return <p>{parseInline(token.tokens)}</p>;
            }

            case "text": {
                const textToken = token as Tokens.Text;
                return textToken.tokens ? parseInline(textToken.tokens) : token.text;
            }

            case "blockquote": {
                const blockquoteToken = token as Tokens.Blockquote;
                const quote = parse(blockquoteToken.tokens);
                return <blockquote>{quote}</blockquote>;
            }

            case "list": {
                const listToken = token as Tokens.List;

                const children = listToken.items.map(item => {
                    const listItemChildren = [];

                    if (item.task) {
                        listItemChildren.push(<input type="checkbox" checked={item.checked ?? false} disabled />);
                    }

                    listItemChildren.push(parse(item.tokens));

                    return <li>{listItemChildren}</li>;
                });

                if (token.ordered) {
                    return <ol>{children}</ol>;
                } else {
                    return <ul>{children}</ul>;
                }
            }

            case "code": {
                return (
                    <pre>
                        <code class={token.lang}>{token.text}</code>
                    </pre>
                );
            }

            case "blockKatex": {
                return <BlockMath value={token.text} />;
            }

            case "html": {
                return token.text;
            }

            case "table": {
                const tableToken = token as Tokens.Table;
                const headerCells = tableToken.header.map((cell, index) => {
                    // align={token.align[index]}
                    return <th>{parseInline(cell.tokens)}</th>;
                });

                const headerRow = <tr>{headerCells}</tr>;
                const header = <thead>{headerRow}</thead>;

                const bodyChildren = tableToken.rows.map(row => {
                    const rowChildren = row.map((cell, index) => {
                        // align={token.align[index]}
                        return <td>{parseInline(cell.tokens)}</td>;
                    });

                    return <tr>{rowChildren}</tr>;
                });

                const body = <tbody>{bodyChildren}</tbody>;

                return (
                    <table>
                        {header}
                        {body}
                    </table>
                );
            }

            case "hr": {
                return <hr />;
            }

            default: {
                console.warn(`Token with "${token.type}" type was not found`); // eslint-disable-line no-console
                return null;
            }
        }
    });
}

export function parseInline(tokens: Token[] = []): JSX.Element {
    return tokens.map(token => {
        switch (token.type) {
            case "text": {
                return unescape(token.text);
            }

            case "strong": {
                return <strong>{parseInline(token.tokens)}</strong>;
            }

            case "em": {
                return <em>{parseInline(token.tokens)}</em>;
            }

            case "del": {
                return <del>{parseInline(token.tokens)}</del>;
            }

            case "codespan": {
                return <code>{unescape(token.text)}</code>;
            }

            case "inlineKatex": {
                return <InlineMath value={unescape(token.text)} />;
            }

            case "link": {
                return <a href={token.href}>{parseInline(token.tokens)}</a>;
            }

            case "image": {
                return (
                    <img
                        src={`//wsrv.nl/?url=${encodeURIComponent(token.href)}&n=-1`}
                        alt={unescape(token.text)}
                        title={unescape(token.title)}
                    />
                );
            }

            case "escape":
            case "html": {
                return token.text;
            }

            case "br": {
                return <br />;
            }

            default: {
                console.warn(`Token with "${token.type}" type was not found`); // eslint-disable-line no-console
                return null;
            }
        }
    });
}

const htmlUnescapes: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
};

/** Used to match HTML entities and HTML characters. */
const reEscapedHtml = /&(?:amp|lt|gt|quot|#(?:0+)?39);/g;
const reHasEscapedHtml = RegExp(reEscapedHtml.source);

export const unescape = (str = "") => {
    return reHasEscapedHtml.test(str) ? str.replace(reEscapedHtml, entity => htmlUnescapes[entity] || "'") : str;
};

function join(path: string, base?: string) {
    if (!base) {
        return path;
    }

    try {
        return new URL(path, base).href;
    } catch {
        return path;
    }
}
