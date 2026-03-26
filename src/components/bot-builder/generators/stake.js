import { javascriptGenerator, Order } from 'blockly/javascript';

javascriptGenerator.forBlock['stake'] = function(block) {
  var value_stake = javascriptGenerator.valueToCode(block, 'STAKE', Order.ATOMIC);
  var code = 'trade.stake = ' + value_stake + ';\n';
  return code;
};
