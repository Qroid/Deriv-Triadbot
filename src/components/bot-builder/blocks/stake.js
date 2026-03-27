import * as Blockly from 'blockly/core';

const stake = {
  "type": "stake",
  "message0": "Stake: %1",
  "args0": [
    {
      "type": "input_value",
      "name": "STAKE",
      "check": "Number"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 290,
  "tooltip": "Set the stake amount",
  "helpUrl": ""
};

Blockly.Blocks['stake'] = {
  init: function() {
    this.jsonInit(stake);
  }
};

// Support for DBot specific blocks found in XML
Blockly.Blocks['total_profit'] = {
  init: function() {
    this.appendDummyInput().appendField("Total Profit");
    this.setOutput(true, "Number");
    this.setColour(210);
  }
};

Blockly.Blocks['total_loss'] = {
  init: function() {
    this.appendDummyInput().appendField("Total Loss");
    this.setOutput(true, "Number");
    this.setColour(210);
  }
};

Blockly.Blocks['notify'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Notify")
        .appendField(new Blockly.FieldDropdown([["Success", "success"], ["Error", "error"], ["Info", "info"], ["Warn", "warn"]]), "NOTIFICATION_TYPE")
        .appendField(new Blockly.FieldDropdown([["Silent", "silent"], ["Earned Money", "earned-money"]]), "NOTIFICATION_SOUND");
    this.appendValueInput("MESSAGE").setCheck("String").appendField("Message");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
  }
};

// Text Join with variable (DBot style)
Blockly.Blocks['text_join'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Set")
        .appendField(new Blockly.FieldVariable("text"), "VARIABLE")
        .appendField("to join");
    this.appendStatementInput("STACK").setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
  }
};

Blockly.Blocks['text_statement'] = {
  init: function() {
    this.appendValueInput("TEXT").setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(160);
  }
};
