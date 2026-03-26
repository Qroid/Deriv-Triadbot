import * as Blockly from 'blockly/core';

const purchase = {
  "type": "purchase",
  "message0": "Purchase %1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "PURCHASE_TYPE",
      "options": [
        // Dependent on trade_type, but we'll provide common ones
        [ "Rise", "CALL" ],
        [ "Fall", "PUT" ],
        [ "Higher", "CALL" ],
        [ "Lower", "PUT" ],
        [ "Matches", "DIGITMATCH" ],
        [ "Differs", "DIGITDIFF" ],
        [ "Even", "DIGITEVEN" ],
        [ "Odd", "DIGITODD" ],
        [ "Over", "DIGITOVER" ],
        [ "Under", "DIGITUNDER" ],
        [ "Touch", "ONETOUCH" ],
        [ "No Touch", "NOTOUCH" ],
      ]
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 330,
  "tooltip": "Purchase a contract",
  "helpUrl": ""
};

Blockly.Blocks['purchase'] = {
  init: function() {
    this.jsonInit(purchase);
  }
};
