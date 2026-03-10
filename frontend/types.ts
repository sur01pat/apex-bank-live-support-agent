
export enum ConnectionStatus {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

export interface Message {
  role: 'user' | 'agent';
  text: string;
  timestamp: number;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}
