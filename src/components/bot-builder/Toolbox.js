import './blocks/trade-definition';
import './blocks/market';
import './blocks/trade-type';
import './blocks/stake';
import './blocks/duration';
import './blocks/purchase';
import './blocks/check-result';

export const Toolbox = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Trade Parameters",
      colour: "#5C81A6",
      contents: [
        { kind: "block", type: "trade_definition" },
        { kind: "block", type: "market" },
        { kind: "block", type: "stake" },
        { kind: "block", type: "duration" },
      ],
    },
    {
      kind: "category",
      name: "Trade Types",
      colour: "#E30C37",
      contents: [
        {
          kind: "category",
          name: "Turbos",
          contents: [{ kind: "block", type: "trade_type" }],
        },
        {
          kind: "category",
          name: "Ups & Downs",
          contents: [{ kind: "block", type: "trade_type" }],
        },
        {
          kind: "category",
          name: "Touch & No Touch",
          contents: [{ kind: "block", type: "trade_type" }],
        },
        {
          kind: "category",
          name: "Digits",
          contents: [{ kind: "block", type: "trade_type" }],
        },
      ],
    },
    {
      kind: "category",
      name: "Actions",
      colour: "#5CA65C",
      contents: [
        { kind: "block", type: "purchase" },
      ],
    },
    {
      kind: "category",
      name: "Logic",
      colour: "#5C81A6",
      contents: [
        {
          kind: "block",
          type: "controls_if",
        },
        {
          kind: "block",
          type: "logic_compare",
        },
        {
          kind: "block",
          type: "check_result",
        },
      ],
    },
    {
      kind: "category",
      name: "Math",
      colour: "#5CA65C",
      contents: [
        {
          kind: "block",
          type: "math_number",
        },
        {
          kind: "block",
          type: "math_arithmetic",
        },
      ],
    },
  ],
};
