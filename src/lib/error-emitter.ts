
import { EventEmitter } from 'events';
import type { SecurityRuleError } from './types';

// Augment the EventEmitter interface to be strongly typed for our specific events
interface TypedEventEmitter {
  on(event: 'permission-error', listener: (error: SecurityRuleError) => void): this;
  emit(event: 'permission-error', error: SecurityRuleError): boolean;
}

class TypedEventEmitter extends EventEmitter {}

export const errorEmitter = new TypedEventEmitter();
