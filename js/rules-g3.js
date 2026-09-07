import {createVerbRuleModel} from './rules-source.js';

export function createG3RuleModel(options) {
  return createVerbRuleModel({...options,type:'g3'});
}
