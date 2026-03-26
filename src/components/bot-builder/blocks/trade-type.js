import * as Blockly from 'blockly/core';

const tradeType = {
  "type": "trade_type",
  "message0": "Trade Type: %1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "TRADE_TYPE",
      "options": [
        // Ups & Downs
        [ "Rise/Fall", "rise_fall" ],
        [ "Higher/Lower", "higher_lower" ],
        // Digits
        [ "Matches/Differs", "matches_differs" ],
        [ "Even/Odd", "even_odd" ],
        [ "Over/Under", "over_under" ],
        // Touch & No Touch
        [ "Touch/No Touch", "touch_no_touch" ],
        // Turbos
        [ "Turbos", "turbos" ],
      ]
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 290,
  "tooltip": "Select the trade type from Deriv Options",
  "helpUrl": ""
};

Blockly.Blocks['trade_type'] = {
  init: function() {
    this.jsonInit(tradeType);
  }
};
