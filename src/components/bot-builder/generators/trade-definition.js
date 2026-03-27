import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['trade_definition'] = function(block) {
  var statements_trade_options = javascriptGenerator.statementToCode(block, 'TRADE_OPTIONS');
  var code = 'function tradeDefinition() {\n  var trade = {};\n' + statements_trade_options + '  return trade;\n}\n';
  return code;
};

javascriptGenerator.forBlock['trade_definition_market'] = function(block) {
  var market = block.getFieldValue('MARKET_LIST');
  var symbol = block.getFieldValue('SYMBOL_LIST');
  return 'trade.market = \'' + market + '\';\ntrade.symbol = \'' + symbol + '\';\n';
};

javascriptGenerator.forBlock['trade_definition_tradetype'] = function(block) {
  var cat = block.getFieldValue('TRADETYPECAT_LIST');
  var type = block.getFieldValue('TRADETYPE_LIST');
  return 'trade.trade_type_cat = \'' + cat + '\';\ntrade.trade_type = \'' + type + '\';\n';
};

javascriptGenerator.forBlock['trade_definition_tradeoptions'] = function(block) {
  return '';
};

javascriptGenerator.forBlock['trade_definition_multiplier'] = function(block) {
  return '';
};

javascriptGenerator.forBlock['trade_definition_accumulator'] = function(block) {
  return '';
};
