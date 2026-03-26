import * as Blockly from 'blockly/core';

const tradeDefinition = {
  "type": "trade_definition",
  "message0": "Trade Definition %1 %2",
  "args0": [
    {
      "type": "input_dummy"
    },
    {
      "type": "input_statement",
      "name": "TRADE_OPTIONS"
    }
  ],
  "colour": 230,
  "tooltip": "Define the parameters for your trade",
  "helpUrl": ""
};

Blockly.Blocks['trade_definition'] = {
  init: function() {
    this.jsonInit(tradeDefinition);
  }
};
