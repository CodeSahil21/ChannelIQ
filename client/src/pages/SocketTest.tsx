import React, { useState } from 'react';
import { useSocket } from '../hooks/useSocket';

export const SocketTest: React.FC = () => {
  const { socket, isConnected, joinGroup, sendMessage, sendTyping } = useSocket();
  const [groupId, setGroupId] = useState('');
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (log: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${log}`]);
  };

  const handleJoinGroup = () => {
    if (!groupId) return;
    joinGroup(groupId, (response) => {
      addLog(response.success ? `Joined group ${groupId}` : `Failed: ${response.error}`);
    });
  };

  const handleSendMessage = () => {
    if (!message || !groupId) return;
    sendMessage({
      groupId,
      type: 'TEXT',
      content: message
    }, (response) => {
      addLog(response.success ? `Message sent: ${response.messageId}` : `Failed: ${response.error}`);
      if (response.success) setMessage('');
    });
  };

  const handleTyping = (isTyping: boolean) => {
    if (!groupId) return;
    sendTyping(groupId, isTyping);
    addLog(`Typing: ${isTyping}`);
  };

  React.useEffect(() => {
    if (!socket) return;

    socket.on('message:persisted', (msg: any) => {
      addLog(`New message: ${msg.content} from ${msg.sender.fullName}`);
    });

    socket.on('typing:updated', (data: any) => {
      addLog(`${data.fullName} ${data.isTyping ? 'is typing...' : 'stopped typing'}`);
    });

    return () => {
      socket.off('message:persisted');
      socket.off('typing:updated');
    };
  }, [socket]);

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h1>Socket.IO Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <strong>Status: </strong>
        <span style={{ color: isConnected ? 'green' : 'red' }}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Group ID"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button onClick={handleJoinGroup} disabled={!isConnected}>
          Join Group
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => handleTyping(true)}
          onBlur={() => handleTyping(false)}
          style={{ marginRight: '10px', padding: '5px', width: '300px' }}
        />
        <button onClick={handleSendMessage} disabled={!isConnected || !message}>
          Send Message
        </button>
      </div>

      <div>
        <h3>Logs:</h3>
        <div style={{ 
          border: '1px solid #ccc', 
          padding: '10px', 
          height: '300px', 
          overflowY: 'scroll',
          backgroundColor: '#f9f9f9'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px', fontSize: '12px' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};