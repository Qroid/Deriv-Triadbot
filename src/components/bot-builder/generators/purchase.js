import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['purchase'] = function(block) {
  var dropdown_purchase_type = block.getFieldValue('PURCHASE_TYPE');
  var code = 'purchase(\'' + dropdown_purchase_type + '\');\n';
  return code;
};

javascriptGenerator.forBlock['trade_again'] = function(block) {
  return 'tradeAgain();\n';
};

javascriptGenerator.forBlock['before_purchase'] = function(block) {
  var branch = javascriptGenerator.statementToCode(block, 'BEFOREPURCHASE_STACK');
  return 'function beforePurchase() {\n' + branch + '}\n';
};

javascriptGenerator.forBlock['after_purchase'] = function(block) {
  var branch = javascriptGenerator.statementToCode(block, 'AFTERPURCHASE_STACK');
  return 'function afterPurchase() {\n' + branch + '}\n';
};
