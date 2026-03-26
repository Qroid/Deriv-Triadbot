import { javascriptGenerator } from 'blockly/javascript';

javascriptGenerator.forBlock['purchase'] = function(block) {
  var dropdown_purchase_type = block.getFieldValue('PURCHASE_TYPE');
  var code = 'purchase(\'' + dropdown_purchase_type + '\');\n';
  return code;
};
