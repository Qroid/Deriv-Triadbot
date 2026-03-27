import { javascriptGenerator, Order } from 'blockly/javascript';

javascriptGenerator.forBlock['stake'] = function(block) {
  var value_stake = javascriptGenerator.valueToCode(block, 'STAKE', Order.ATOMIC);
  var code = 'trade.stake = ' + value_stake + ';\n';
  return code;
};

javascriptGenerator.forBlock['total_profit'] = function(block) {
  return ['totalProfit()', Order.ATOMIC];
};

javascriptGenerator.forBlock['total_loss'] = function(block) {
  return ['totalLoss()', Order.ATOMIC];
};

javascriptGenerator.forBlock['notify'] = function(block) {
  var dropdown_notification_type = block.getFieldValue('NOTIFICATION_TYPE');
  var dropdown_notification_sound = block.getFieldValue('NOTIFICATION_SOUND');
  var value_message = javascriptGenerator.valueToCode(block, 'MESSAGE', Order.ATOMIC);
  var code = 'notify(\'' + dropdown_notification_type + '\', \'' + dropdown_notification_sound + '\', ' + value_message + ');\n';
  return code;
};

javascriptGenerator.forBlock['text_join'] = function(block) {
  var variable_variable = javascriptGenerator.nameDB_.getName(block.getFieldValue('VARIABLE'), 'VARIABLE');
  var statements_stack = javascriptGenerator.statementToCode(block, 'STACK');
  var code = 'var join_parts = [];\n' + statements_stack + variable_variable + ' = join_parts.join("");\n';
  return code;
};

javascriptGenerator.forBlock['text_statement'] = function(block) {
  var value_text = javascriptGenerator.valueToCode(block, 'TEXT', Order.ATOMIC);
  var code = 'join_parts.push(' + value_text + ');\n';
  return code;
};
