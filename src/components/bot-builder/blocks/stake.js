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
