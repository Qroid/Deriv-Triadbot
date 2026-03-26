import { javascriptGenerator, Order } from 'blockly/javascript';

javascriptGenerator.forBlock['duration'] = function(block) {
  var value_duration = javascriptGenerator.valueToCode(block, 'DURATION', Order.ATOMIC);
  var dropdown_duration_unit = block.getFieldValue('DURATION_UNIT');
  var code = 'trade.duration = ' + value_duration + ';\n' +
             'trade.duration_unit = \'' + dropdown_duration_unit + '\';\n';
  return code;
};
