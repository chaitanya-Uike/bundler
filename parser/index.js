import lexer from "./lexer.js";
const src = `
import { export1, export2 as alias, export3 } from "module-name";
`;

const tokens = lexer(src);

const importStatements = [];
for (const token of tokens) {
  if (token.type === "keyword" && token.value === "import") {
    const node = {};
    let nextToken = tokens.next().value;
    // default Import
    if (nextToken.type === "identifier") {
      node.type = "defaultImport";
      node.import = nextToken.value;
      eatFrom();
      node.source = getImportSource();
      importStatements.push(node);
    }
    // named import
    else if (nextToken.type === "delimiter" && nextToken.value === "{") {
      node.type = "namedImport";
      const imports = [];
      let first = true;
      nextToken = tokens.next().value;
      while (nextToken.type !== "delimiter" || nextToken.value !== "}") {
        if (!first) {
          eatComma(nextToken);
          nextToken = tokens.next().value;
        }
        expectTokenType("identifier", nextToken.type);
        imports.push(nextToken.value);
        nextToken = tokens.next().value;
        first = false;
      }
      eatFrom();
      node.source = getImportSource();
      node.imports = imports;
      importStatements.push(node);
    }
    // namespace import
    else if (nextToken.type === "operator" && nextToken.value === "*") {
      node.type = "NamespaceImport";
      eatAs();
      nextToken = tokens.next().value;
      expectTokenType("identifier", nextToken.type);
      node.identifier = nextToken.value;
      eatFrom();
      node.source = getImportSource();
      importStatements.push(node);
    }
  }
}

console.log(importStatements);

function getImportSource() {
  const token = tokens.next().value;
  expectTokenType("stringLiteral", token.type);
  return token.value;
}

function eatFrom() {
  expectToken({ type: "identifier", value: "from" }, tokens.next().value);
}

function eatAs() {
  expectToken({ type: "identifier", value: "as" }, tokens.next().value);
}

function eatComma(token) {
  expectToken({ type: "delimiter", value: "," }, token);
}

function expectToken(expected, recieved) {
  if (expected.type !== recieved.type || expected.value !== recieved.value)
    throw new SyntaxError(
      `expected "${expected.type}" token "${expected.value}" but recieved "${recieved.type}" token "${recieved.value}"`
    );
}

function expectTokenType(expectedType, recievedType) {
  if (expectedType !== recievedType)
    throw new SyntaxError(`expected token of type "${expectedType}"`);
}

const x = `
import { export1 as alias1 } from "module-name";
import { default as alias } from "module-name";
import { export1, export2 } from "module-name";
import { export1, export2 as alias2} from "module-name";
import { "string name" as alias } from "module-name";
import defaultExport, { export1} from "module-name";
import defaultExport, * as name from "module-name";
import "module-name";`;

const y = `
import defaultExport from "module-name";
import * as name from "module-name";`;
