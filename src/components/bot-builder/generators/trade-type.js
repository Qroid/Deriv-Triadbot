import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['trade_type'] = function(block) {
  var dropdown_trade_type = block.getFieldValue('TRADE_TYPE');
  var code = 'trade.trade_type = \'' + dropdown_trade_type + '\';\n';
  return code;
};
