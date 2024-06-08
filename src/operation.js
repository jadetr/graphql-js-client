import join from './join';
import SelectionSet from './selection-set';
import schemaForType from './schema-for-type';

function parseArgs(args) {
  let name;
  let variables;
  let selectionSetCallback;
  let internationalizationDirective;

  if (args.length === 4) {
    [name, variables, selectionSetCallback, internationalizationDirective] = args;
  } else if (args.length === 3 && args[2] !== undefined && args[2].indexOf('inContext')) {
    if (Object.prototype.toString.call(args[0]) === '[object String]') {
      name = args[0];
      variables = null;
    } else if (Array.isArray(args[0])) {
      variables = args[0];
      name = null;
    }

    selectionSetCallback = args[1];
    internationalizationDirective = args[2];
  } else if (args.length === 2 && args[1] !== undefined && Object.prototype.toString.call(args[1]) === '[object String]' && args[1].indexOf('inContext')) {
    selectionSetCallback = args[0];
    internationalizationDirective = args[1]; 
    name = null; 
  } else if (args.length === 2 || (args.length === 3 && args[2] === undefined)) {
    if (Object.prototype.toString.call(args[0]) === '[object String]') {
        name = args[0];
        variables = null;
    } else if (Array.isArray(args[0])) {
        variables = args[0];
        name = null;
    }
    selectionSetCallback = args[1];
    internationalizationDirective = null;
  } else {
    selectionSetCallback = args[0];
    internationalizationDirective = null;
    name = null;
  }

  return {name, variables, selectionSetCallback, internationalizationDirective};
}

class VariableDefinitions {
  constructor(variableDefinitions) {
    this.variableDefinitions = variableDefinitions ? [...variableDefinitions] : [];
    Object.freeze(this.variableDefinitions);
    Object.freeze(this);
  }

  toString() {
    if (this.variableDefinitions.length === 0) {
      return '';
    }

    return ` (${join(this.variableDefinitions)}) `;
  }
}

/**
 * Base class for {@link Query} and {@link Mutation}.
 * @abstract
 */
export default class Operation {

  /**
   * This constructor should not be invoked. The subclasses {@link Query} and {@link Mutation} should be used instead.
   */
  constructor(typeBundle, operationType, ...args) {
    const {name, variables, selectionSetCallback, internationalizationDirective} = parseArgs(args);

    this.typeBundle = typeBundle;
    this.name = name;
    this.variableDefinitions = new VariableDefinitions(variables);
    this.internationalizationDirective = internationalizationDirective;
    this.operationType = operationType;
    if (operationType === 'query') {
      this.selectionSet = new SelectionSet(typeBundle, typeBundle.queryType, selectionSetCallback);
      this.typeSchema = schemaForType(typeBundle, typeBundle.queryType);
    } else {
      this.selectionSet = new SelectionSet(typeBundle, typeBundle.mutationType, selectionSetCallback);
      this.typeSchema = schemaForType(typeBundle, typeBundle.mutationType);
    }
    Object.freeze(this);
  }

  /**
   * Whether the operation is anonymous (i.e. has no name).
   */
  get isAnonymous() {
    return !this.name;
  }

  /**
   * Returns the GraphQL query or mutation string (e.g. `query myQuery { cat { name } }`).
   *
   * @return {String} The GraphQL query or mutation string.
   */
  toString() {
    const nameString = (this.name) ? ` ${this.name}` : '';
    const internationalizationDirective = (this.internationalizationDirective ? this.internationalizationDirective : '');

    return `${this.operationType}${nameString}${this.variableDefinitions}${internationalizationDirective}${this.selectionSet}`;
  }
}
