import * as Blockly from 'blockly/core';

// DBot Market Definition
Blockly.Blocks['trade_definition_market'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Market:")
        .appendField(new Blockly.FieldDropdown([["Synthetic Indices", "synthetic_index"]]), "MARKET_LIST")
        .appendField(new Blockly.FieldDropdown([["Continuous Indices", "random_index"]]), "SUBMARKET_LIST")
        .appendField(new Blockly.FieldDropdown([["Volatility 10 (1s) Index", "1HZ10V"]]), "SYMBOL_LIST");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
  }
};

// DBot Trade Type Definition
Blockly.Blocks['trade_definition_tradetype'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Trade Type:")
        .appendField(new Blockly.FieldDropdown([["Digits", "digits"]]), "TRADETYPECAT_LIST")
        .appendField(new Blockly.FieldDropdown([["Over/Under", "overunder"]]), "TRADETYPE_LIST");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
  }
};

// DBot Trade Options Definition
Blockly.Blocks['trade_definition_tradeoptions'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Trade Options:")
        .appendField(new Blockly.FieldDropdown([["Normal", "normal"]]), "TRADETYPE_LIST");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
  }
};

// DBot Multiplier Definition (even if not used, needs to be defined for load)
Blockly.Blocks['trade_definition_multiplier'] = {
  init: function() {
    this.appendDummyInput().appendField("Multiplier");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
  }
};

// DBot Accumulator Definition
Blockly.Blocks['trade_definition_accumulator'] = {
  init: function() {
    this.appendDummyInput().appendField("Accumulator");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(230);
  }
};

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
