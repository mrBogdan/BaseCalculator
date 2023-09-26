const assert = require('node:assert');

const TOKENS = {
  PLUS: '+',
  MINUS: '-',
  OPEN_BRACKET: '(',
  CLOSE_BRACKET: ')', 
  SP: ' ',
  EMPTY: '',
};

const OPERATIONS = {
  PLUS: 'PLUS',
  MINUS: 'MINUS',
  CLOSURE_OPEN: 'CLOSURE_OPEN',
  CLOSURE_CLOSE: 'CLOSURE_CLOSE',
};

const isDigit = (char) => char.charCodeAt(0) >= '0'.charCodeAt(0) && char.charCodeAt(0) <= '9'.charCodeAt(0);
const isNumberArray = (chars) => [...chars].every(isDigit);
const isNumber = (value) => typeof value === 'number';
const toInteger = (numberList) => parseInt(numberList.join('')); 

class Stack {
  constructor() {
      this.memory = [];
  }

  push(value) {
      this.memory.push(value);
  }

  pop() {
      return this.memory.pop();
  }

  top() {
      return this.memory[this.memory.length - 1];
  }

  isEmpty() {
      return this.memory.length === 0;
  }
}

class Queue {
  constructor() {
      this.memory = [];
  }

  push(value) {
      this.memory.push(value);
  }

  pop() {
      return this.memory.shift();
  }

  top() {
      return this.memory[0];
  }

  isEmpty() {
      return this.memory.length === 0;
  }
}

class Node {
  constructor(key, parent) {
      this.key = key;
      this.children = [];
      this.value = null;
      this.parent = parent;
  }

  getValue() {
    return this.value;
  }

  getKey() {
      return this.key;
  }

  getChildren() {
      return this.children;
  }

  getParent() {
      return this.parent;
  }

  getChild(i = 0) {
    return this.getChildren()[i];
  }

  getNextChild(prev) {
    if (!prev) {
      return this.getChild(0);
    }

    const nextChildIndex = this.getChildren().indexOf(prev);
    return this.getChildren()[nextChildIndex + 1];
  }

  isRoot() {
    return false;
  }

  hasChildren() {
    return !!this.getChildren().length;
  }

  clearChildren() {
    this.children = [];
  }

  setValue(value) {
    this.value = value;
  }

  setKey(newKey) {
    this.key = newKey;
  }

  insert(node) {
      this.children.push(node);
      return node;
  }

  find(nodeKey) {
      return this.children.find(({ key }) => key === nodeKey);
  }

 
}

class Tree {
  constructor() {
      this.root = new Node('root', null);
  }

  getRoot() {
      return this.root;
  }

  getValue() {
    return this.getRoot().getValue();
  }

  getChildren() {
      return this.getRoot().getChildren();
  }

  getNextChild(prev) {
    return this.getRoot().getNextChild(prev);
  }

  isRoot() {
    return true;
  }

  hasChildren() {
    return this.getRoot().hasChildren();
  }

  insert(value, parent = this.getRoot()) {
      if (isNumberArray(value)) {
          const node = new Node(toInteger(value), parent);
          parent.insert(node);
          return parent;
      }

      switch(value) {
          case OPERATIONS.PLUS:
          case OPERATIONS.MINUS: {
              const node = new Node(value, parent);
              parent.insert(node);
              return parent;
          }
          case OPERATIONS.CLOSURE_OPEN: {
              const node = new Node(value, parent);
              parent.insert(node);
              return node;
          }
          case OPERATIONS.CLOSURE_CLOSE: {
              return parent.getParent();
          }
          default: {
              throw new Error('Unknown value!');
          }
      }
  }

  find(key) {
      return this.root.find(key);
  }

  setValue(value) {
    this.getRoot().setValue(value);
  }
}

const parse = (expression) => {
  const structure = new Tree();
  let lastInsertedNode = structure.getRoot();
  let number = [];

  for(let i = 0; i < expression.length; ++ i) {
      const char = expression[i];

      switch(char) {
          case TOKENS.SP: {
              continue;
          }
          case TOKENS.PLUS: {
            if (number.length > 0) {
              structure.insert(number, lastInsertedNode);
            }

            lastInsertedNode = structure.insert(OPERATIONS.PLUS, lastInsertedNode);
            number = [];
            continue;
          }
          case TOKENS.MINUS: {
            if (number.length > 0) {
              structure.insert(number, lastInsertedNode);
            }

            lastInsertedNode = structure.insert(OPERATIONS.MINUS, lastInsertedNode);
            number = [];
            continue;
          }
          case TOKENS.OPEN_BRACKET: {
            if (number.length > 0) {
              structure.insert(number, lastInsertedNode);
            }

            lastInsertedNode = structure.insert(OPERATIONS.CLOSURE_OPEN, lastInsertedNode);
            number = [];
            continue;
          }
          case TOKENS.CLOSE_BRACKET: {
            if (number.length > 0) {
              structure.insert(number, lastInsertedNode);
            }

            lastInsertedNode = structure.insert(OPERATIONS.CLOSURE_CLOSE, lastInsertedNode);
            number = [];
            continue;
          }
      }

      number.push(char);  

      if ((i + 1) === expression.length) {
          structure.insert(number, lastInsertedNode);
          break;
      }  
  }

  return structure;
}

const execute = (structure) => {
  let leftOperand = null;
  let operation = null;
  let prevChild = null;
  let finalLoop = false;
  const visited = new Set();
  const stack = new Stack();

  stack.push(structure);
  let currentNode;

  while(!stack.isEmpty()) {
    currentNode = stack.top();

    if (currentNode.hasChildren() && !finalLoop) {
      prevChild = currentNode.getNextChild(prevChild);

      if (visited.has(prevChild) && !currentNode.isRoot()) {
        prevChild = currentNode;
        stack.pop();
        continue;
      }

      if (currentNode.isRoot() && !prevChild) {
        currentNode.getChildren().forEach((child) => {
          stack.push(child);
        });
        finalLoop = true;
      }

      if (!prevChild) {
        currentNode.setValue(leftOperand);
        leftOperand = null;
        visited.add(currentNode);
        continue;
      }

      stack.push(prevChild);
      continue;
    }

    const key = currentNode.getValue() ?? currentNode.getKey();

    if (isNumber(key)) {
      const integer = key;

      if (!operation && !leftOperand) {
        leftOperand = integer;
        visited.add(currentNode);
        continue;
      }

      if (operation && leftOperand) {
        switch(operation) {
          case OPERATIONS.PLUS: {
            leftOperand = leftOperand + integer;
            operation = null;
            visited.add(currentNode);
          }
        }
      }
    }

    switch (key) {
      case OPERATIONS.PLUS: {
        operation = OPERATIONS.PLUS;
        break;
      }
    }
   
    
    stack.pop();

    if (finalLoop && stack.top().isRoot()) {
      currentNode.setValue(leftOperand);
      stack.pop();
    }
  }  

  return structure.getValue();
}

// (1 - 2) + (1 + 1) == 2 + (-1)
// (1 - 2) - (1 - 1) == 0 - 1
// (1+(4+5+2)-3)+(6+8) == (1 + 11 - 3) + 14 == 9 + 14 == 23 
// (1+(4+5+2)-3)+(6+8) == 1 + 4 + 5 + 2 - 3 + 6 + 8 == 15 + 8 == 23

/**
* @param {string} s
* @return {number}
*/
const calculate = (s) => {
  const structure = parse(s.trim());
  return execute(structure);
};

void function test() {
  const result = calculate('1 + 1');
  
  assert.equal(result, 2);
  assert.notEqual(result, 3);
}();

void function TestWithBrackets() {
  const result = calculate('(1 + 1)');
  
  assert.equal(result, 2);
  assert.notEqual(result, 3);
}();

void function TestWithBrackets() {
  const result = calculate('(1 + 1) + 1');
  
  assert.equal(result, 3);
  assert.notEqual(result, 4);
}();

void function TestWithBrackets() {
  const result = calculate('(1 + 1) + (1 + 3)');
  
  assert.equal(result, 6);
  assert.notEqual(result, 7);
}();