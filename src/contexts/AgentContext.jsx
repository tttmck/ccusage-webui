import { createContext, useContext, useState } from 'react';

const AgentContext = createContext({ agent: 'all', setAgent: () => {} });

export function AgentProvider({ children }) {
  const [agent, setAgent] = useState('all');
  return (
    <AgentContext.Provider value={{ agent, setAgent }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  return useContext(AgentContext);
}
