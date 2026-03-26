import * as Blockly from 'blockly/core';

const market = {
  "type": "market",
  "message0": "Market: %1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "MARKET",
      "options": [
        [ "Volatility 10 Index", "R_10" ],
        [ "Volatility 25 Index", "R_25" ],
        [ "Volatility 50 Index", "R_50" ],
        [ "Volatility 75 Index", "R_75" ],
        [ "Volatility 100 Index", "R_100" ],
        [ "Boom 1000 Index", "BOOM1000" ],
        [ "Crash 1000 Index", "CRASH1000" ],
      ]
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 290,
  "tooltip": "Select the market to trade on",
  "helpUrl": ""
};

Blockly.Blocks['market'] = {
  init: function() {
    this.jsonInit(market);
  }
};
