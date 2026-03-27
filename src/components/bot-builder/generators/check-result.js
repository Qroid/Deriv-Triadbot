import { javascriptGenerator, Order } from 'blockly/javascript';

javascriptGenerator.forBlock['check_result'] = function(block) {
  var dropdown_result = block.getFieldValue('RESULT');
  var code = '(last_trade.result === \'' + dropdown_result + '\')';
  return [code, Order.ATOMIC];
};

javascriptGenerator.forBlock['contract_check_result'] = function(block) {
  var dropdown_result = block.getFieldValue('CHECK_RESULT');
  var code = '(last_trade.result === \'' + dropdown_result + '\')';
  return [code, Order.ATOMIC];
};
