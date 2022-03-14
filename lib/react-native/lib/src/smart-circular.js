/* The MIT License (MIT)

Copyright (c) 2015 Danilo Augusto <daniloaugusto.ita16@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE. */

import _ from 'lodash';

/* Used to store the path until the JSON element concerned. This way the JSON source will be modifiable when we
 take an element from the queue. "result" is the JSON being constructed, the JSON to be returned with circular references
 transformed */
const ObjectEditor = function ObjectEditor(result, path) {
  this.result = result;
  this.path = path;
};

// Function to replace a JSON of path by "replacer"
ObjectEditor.prototype.editObject = function editObject(replacer) {
  // The first call to this function (from the JSON root) shouldn't modify our result
  if (this.path.length === 0) return;

  // We construct the steps necessary to get to the concerned JSON from the root
  const arrayOfSteps = this.path.slice(1, this.path.length - 1).split('][');

  // Recursive function that finds and replaces the JSON of path
  (function auxFindElementToReplace(pointerResult, array, innerReplacer) {
    const nextStep = array[0];

    // When we arrive to the JSON of path
    if (array.length === 1) {
      pointerResult[nextStep] = innerReplacer;

      // We stop going into our JSON
      return;
    }

    // We go to the next step, deleting it from our array, calling auxFindElementToReplace again
    pointerResult = pointerResult[nextStep];
    array.shift();
    auxFindElementToReplace(pointerResult, array, innerReplacer);
  })(this.result, arrayOfSteps, replacer);
};

const FoundObject = (value, path) => {
  this.value = value;
  this.path = path;
};

// To construct path leading to sub-JSON in a friendly-user way
FoundObject.prototype.makePathName = function makePathName() {
  const steps = this.path.slice(1, this.path.length - 1).split('][');

  let str = '$';

  // eslint-disable-next-line no-restricted-syntax
  for (const index in steps) {
    if (_.has(steps, index)) {
      str += isNaN(steps[index]) // eslint-disable-line
        ? '.' + steps[index] // eslint-disable-line
        : '[' + steps[index] + ']'; // eslint-disable-line
    }
  }

  return str;
};

// Main function to travel through the JSON and transform the circular references and personalized replacements
const removeCircularReferences = function removeCircularReferences(
  object,
  customizer
) {
  const foundStack = []; // Stack to keep track of discovered objects
  const queueOfModifiers = []; // Necessary to change our JSON as we take elements from the queue (BFS algorithm)
  const queue = []; // queue of JSON elements, following the BFS algorithm

  // We instantiate our result root.
  const result = _.isArray(object) ? [] : {};

  // We first put all the JSON source in our queues
  queue.push(object);
  queueOfModifiers.push(new ObjectEditor(object, ''));

  let positionStack;
  let nextInsertion;

  // BFS algorithm
  while (queue.length > 0) {
    // JSON to be modified and its editor
    let value = queue.shift();
    const editor = queueOfModifiers.shift();
    // The path that leads to this JSON, so we can build other paths from it
    const { path } = editor;

    // We first attempt to make any personalized replacements
    // If customizer doesn't affect the value, customizer(value) returns undefined and we jump this if
    if (customizer !== undefined) {
      // By using this variable, customizer(value) is called only once.
      const customizedValue = customizer(value, path);

      if (customizedValue !== undefined) value = customizedValue;
    }

    if (typeof value === 'object') {
      positionStack = _.chain(foundStack).map('value').indexOf(value).value();

      // If the value has already been discovered, we only fix its circular reference
      if (positionStack !== -1) {
        nextInsertion = foundStack[positionStack].makePathName();
      } else {
        // At the first time we discover a certain value, we put it in the stack
        foundStack.push(new FoundObject(value, path));

        nextInsertion = value;

        // eslint-disable-next-line no-restricted-syntax
        for (const component in value) {
          if (_.has(value, component)) {
            queue.push(value[component]);
            const newPath = path + '[' + component + ']'; // eslint-disable-line
            queueOfModifiers.push(new ObjectEditor(result, newPath));
          }
        }
      }
    }
    // If it's an elementary value, it can't be circular, so we just put this value in our JSON result.
    else {
      nextInsertion = value;
    }

    editor.editObject(nextInsertion);
  }

  return result;
};

export default removeCircularReferences;
