import { FunctionDeclaration, Type } from '@google/genai';

export const GENERATE_ASSET_TOOL: FunctionDeclaration = {
  name: 'generateVisualAsset',
  parameters: {
    type: Type.OBJECT,
    description: 'Generates a high-quality visual asset for the user.',
    properties: {
      type: { 
        type: Type.STRING,
        description: 'The specific type of visual asset to generate (e.g., "summary card", "infographic", "receipt", "chart").'
      },
      prompt: { 
        type: Type.STRING,
        description: 'A detailed description of what the visual asset should contain.'
      },
    },
    required: ['type', 'prompt'],
  },
};

export const GENERATE_VIDEO_TOOL: FunctionDeclaration = {
  name: 'generateVideoAsset',
  parameters: {
    type: Type.OBJECT,
    description: 'Generates a cinematic video visualization of financial data or milestones.',
    properties: {
      prompt: { 
        type: Type.STRING,
        description: 'Detailed visual description for the video generation.'
      },
      aspectRatio: { 
        type: Type.STRING, 
        enum: ['16:9', '9:16'],
        description: 'The aspect ratio for the generated video output.'
      },
    },
    required: ['prompt'],
  },
};

export const INITIATE_TRANSFER_TOOL: FunctionDeclaration = {
  name: 'initiateTransfer',
  parameters: {
    type: Type.OBJECT,
    description: 'Initiates a secure funds transfer between internal bank accounts.',
    properties: {
      sourceAccount: { type: Type.STRING, description: 'The identifier or name of the source account.' },
      destinationAccount: { type: Type.STRING, description: 'The identifier or name of the destination account.' },
      amount: { type: Type.NUMBER, description: 'The numerical amount of currency to transfer.' },
    },
    required: ['sourceAccount', 'destinationAccount', 'amount'],
  },
};

export const GET_BALANCES_TOOL: FunctionDeclaration = {
  name: 'getAccountBalances',
  parameters: {
    type: Type.OBJECT,
    description: 'Retrieves the current real-time balances for all user accounts.',
    properties: {},
  },
};
