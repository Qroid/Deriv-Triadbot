import * as Blockly from 'blockly/core';

const purchase = {
  "type": "purchase",
  "message0": "Purchase %1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "PURCHASE_TYPE",
      "options": [
        [ "Rise", "CALL" ],
        [ "Fall", "PUT" ],
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
