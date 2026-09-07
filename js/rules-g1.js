import {createVerbRuleModel} from './rules-source.js';

export function createG1RuleModel(options) {
  return createVerbRuleModel({...options,type:'g1'});
}
