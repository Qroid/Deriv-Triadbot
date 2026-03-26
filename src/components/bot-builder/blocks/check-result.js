import * as Blockly from 'blockly/core';

const checkResult = {
  "type": "check_result",
  "message0": "Result is %1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "RESULT",
      "options": [
        [ "Win", "win" ],
        [ "Loss", "loss" ],
      ]
    }
  ],
  "output": "Boolean",
  "colour": 210,
  "tooltip": "Check the result of the last trade",
  "helpUrl": ""
};

Blockly.Blocks['check_result'] = {
  init: function() {
    this.jsonInit(checkResult);
  }
};
