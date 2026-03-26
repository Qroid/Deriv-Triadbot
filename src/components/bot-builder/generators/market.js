import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['market'] = function(block) {
  var dropdown_market = block.getFieldValue('MARKET');
  var code = 'trade.market = \'' + dropdown_market + '\';\n';
  return code;
};
