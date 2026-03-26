import * as Blockly from 'blockly/core';

const duration = {
  "type": "duration",
  "message0": "Duration: %1 %2",
  "args0": [
    {
      "type": "input_value",
      "name": "DURATION",
      "check": "Number"
    },
    {
      "type": "field_dropdown",
      "name": "DURATION_UNIT",
      "options": [
        [ "Ticks", "t" ],
        [ "Seconds", "s" ],
        [ "Minutes", "m" ],
        [ "Hours", "h" ],
        [ "Days", "d" ],
      ]
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 290,
  "tooltip": "Set the trade duration",
  "helpUrl": ""
};

Blockly.Blocks['duration'] = {
  init: function() {
    this.jsonInit(duration);
  }
};
