import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['trade_definition'] = function(block) {
  var statements_trade_options = javascriptGenerator.statementToCode(block, 'TRADE_OPTIONS');
  var code = 'var trade = {};\n' + statements_trade_options + 'return trade;\n';
  return code;
};
