import {createVerbRuleModel} from './rules-source.js';

export function createG2RuleModel(options) {
  return createVerbRuleModel({...options,type:'g2'});
}
