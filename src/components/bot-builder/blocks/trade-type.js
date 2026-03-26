import * as Blockly from 'blockly/core';

const tradeType = {
  "type": "trade_type",
  "message0": "Trade Type: %1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "TRADE_TYPE",
      "options": [
        [ "Rise", "CALL" ],
        [ "Fall", "PUT" ],
        [ "Digit Over", "DIGITOVER" ],
        [ "Digit Under", "DIGITUNDER" ],
        [ "Digit Matches", "DIGITMATCH" ],
        [ "Digit Differs", "DIGITDIFF" ],
      ]
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 290,
  "tooltip": "Select the trade type",
  "helpUrl": ""
};

Blockly.Blocks['trade_type'] = {
  init: function() {
    this.jsonInit(tradeType);
  }
};
