import keywords from "./keywords.js";
import delimiter from "./delimiter.js";
import operators from "./operators.js";

function* lexer(input) {
  let i = 0;
  const length = input.length;

  function tokenize(type, value) {
    return { type, value };
  }

  function isWhiteSpaceChar() {
    const whiteSpaceChars = [" ", "\t", "\r", "\n", "\f", "\v"];
    return whiteSpaceChars.includes(input[i]);
  }

  function skipWhitespace() {
    while (i < length && isWhiteSpaceChar()) {
      i++;
    }
  }

  function isIdentifierStart() {
    const char = input[i];
    return (
      (char >= "a" && char <= "z") ||
      (char >= "A" && char <= "Z") ||
      char === "_" ||
      char === "$"
    );
  }

  function parseIdentifier() {
    let result = input[i++];
    let char = input[i];
    while (
      (char >= "a" && char <= "z") ||
      (char >= "A" && char <= "Z") ||
      (char >= "0" && char <= "9") ||
      char === "_" ||
      char === "$"
    ) {
      result += char;
      char = input[++i];
    }

    if (keywords.includes(result)) return tokenize("keyword", result);
    else if (["typeof", "delete", "in", "instanceof"].includes(result))
      return tokenize("operator", result);
    return tokenize("identifier", result);
  }

  function isNumberStart() {
    return (input[i] === "-" && isDigit(input[i + 1])) || isDigit(input[i]);
  }

  function isDigit(char) {
    return char >= "0" && char <= "9";
  }

  function expectDigit() {
    if (!isDigit(input[i])) {
      printAndThrowError(`Digit expected at position ${i} ${input[i]}`);
    }
  }

  function parseNumber() {
    const start = i;
    if (input[i] === "-") i++;
    if (input[i] === "0") i++;
    else if (input[i] >= "1" && input[i] <= "9") {
      i++;
      while (isDigit(input[i])) i++;
    }
    if (input[i] === ".") {
      i++;
      expectDigit();
      while (isDigit(input[i])) i++;
    }
    if (input[i] === "e" || input[i] === "E") {
      i++;
      if (input[i] === "-" || input[i] === "+") i++;
      expectDigit();
      while (isDigit(input[i])) i++;
    }

    return tokenize("numericLiteral", Number(input.slice(start, i)));
  }

  function isQuote() {
    return input[i] === '"' || input[i] === "'" || input[i] === "`";
  }

  function parseString() {
    // TODO add templateLiteral parsing logic
    const quote = input[i];
    let result = "";
    i++;

    while (i < length && input[i] !== quote) {
      if (input[i] === "\\") {
        i++;
        if (i < length) {
          const escapeChars = {
            '"': '"',
            "'": "'",
            "`": "`",
            "\\": "\\",
            n: "\n",
            r: "\r",
            t: "\t",
            b: "\b",
            f: "\f",
            u: handleUnicodeEscape,
            "{": handleExtendedUnicodeEscape,
          };

          const char = input[i];
          if (escapeChars.hasOwnProperty(char)) {
            result +=
              typeof escapeChars[char] === "string"
                ? escapeChars[char]
                : escapeChars[char]();
          } else {
            printAndThrowError(`Invalid escape sequence at position ${i}`);
          }
        }
      } else {
        result += input[i];
      }
      i++;
    }

    if (input[i] === quote) {
      i++;
    } else {
      printAndThrowError(`Unterminated string literal at position ${i}`);
    }

    if (quote === "`") return tokenize("templateLiteral", result);
    return tokenize("stringLiteral", result);
  }

  function handleUnicodeEscape() {
    const hexCode = input.substr(i + 1, 4);
    const unicodeChar = String.fromCharCode(parseInt(hexCode, 16));
    i += 4;
    return unicodeChar;
  }

  function handleExtendedUnicodeEscape() {
    let hexCode = "";
    let bracesCount = 0;
    while (input[i] && (input[i] !== "}" || bracesCount > 0)) {
      hexCode += input[i];
      if (input[i] === "{") bracesCount++;
      if (input[i] === "}") bracesCount--;
      i++;
    }
    if (input[i] === "}") {
      const unicodeChar = String.fromCodePoint(parseInt(hexCode, 16));
      return unicodeChar;
    } else {
      printAndThrowError(
        `Invalid extended Unicode escape sequence at position ${i}`
      );
    }
  }

  function isOperator() {
    return operators.includes(input[i]);
  }

  function parseOperator() {
    let result = input[i++];
    // ... is special case, need to peek one extra character
    while (
      i < length &&
      (operators.includes(result + input[i]) ||
        (i + 1 < length &&
          operators.includes(result + input[i] + input[i + 1])))
    )
      result += input[i++];
    return tokenize("operator", result);
  }

  function isDelimiter() {
    return delimiter.includes(input[i]);
  }

  function parseDelimiter() {
    return tokenize("delimiter", input[i++]);
  }

  function printAndThrowError(message) {
    const from = Math.max(0, i - 10);
    const trimmed = from > 0;
    const padding = (trimmed ? 3 : 0) + (i - from);
    const snippet = [
      (trimmed ? "..." : "") + input.slice(from, i + 1),
      " ".repeat(padding) + "^",
      " ".repeat(padding) + message,
    ].join("\n");
    console.log(snippet);
    throw new SyntaxError(message);
  }

  while (i < length) {
    if (isWhiteSpaceChar()) {
      skipWhitespace();
    } else if (isIdentifierStart()) {
      yield parseIdentifier();
    } else if (isOperator()) {
      yield parseOperator();
    } else if (isDelimiter()) {
      yield parseDelimiter();
    } else if (isNumberStart()) {
      yield parseNumber();
    } else if (isQuote()) {
      yield parseString();
    } else {
      yield printAndThrowError(`Unexpected token at position ${i}`);
    }
  }
}

export default lexer;
