import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  pageVariants, fadeInUp, RefreshIndicator
} from '../components/shared';
import { plannerQuestions, plannerResponses } from '../data/trafficData';
import './AICityPlanner.css';

export default function AICityPlanner() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello. I am UrbanFlow AI Planner. I can analyze traffic data, suggest optimizations, and simulate infrastructure changes. How can I assist with your city planning today?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (text) => {
    if (!text.trim()) return;
    
    // Add user message
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking and response
    setTimeout(() => {
      let responseData = plannerResponses.default;
      
      // Exact match for predefined questions
      if (plannerResponses[text]) {
        responseData = plannerResponses[text];
      }

      setMessages([...newMessages, { role: 'assistant', structuredData: responseData }]);
      setIsTyping(false);
    }, 2000);
  };

  return (
    <motion.div
      className="page-container planner-container"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="page-hero" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div className="ai-avatar-large">
            <span>🧠</span>
          </div>
          <div>
            <h1>AI City Planner</h1>
            <p>Conversational generative AI for urban infrastructure and traffic optimization</p>
          </div>
        </div>
      </div>

      <div className="quick-questions">
        {plannerQuestions.map((q, i) => (
          <button 
            key={i} 
            className="question-pill"
            onClick={() => handleSend(q)}
            disabled={isTyping}
          >
            {q}
          </button>
        ))}
      </div>

      <div className="chat-interface glass-card">
        <div className="chat-messages">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                className={`chat-message-wrapper ${msg.role}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {msg.role === 'assistant' && (
                  <div className="ai-avatar-small">🧠</div>
                )}
                
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.content && <p>{msg.content}</p>}
                  
                  {msg.structuredData && (
                    <div className="structured-response">
                      <div className="response-section">
                        <div className="section-title">🔍 Root Cause Analysis</div>
                        <ul>
                          {msg.structuredData.rootCause.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="response-section">
                        <div className="section-title">💡 Optimization Recommendations</div>
                        <ul>
                          {msg.structuredData.recommendations.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="response-section">
                        <div className="section-title">🚌 Public Transport Suggestions</div>
                        <ul>
                          {msg.structuredData.publicTransport.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="response-section">
                        <div className="section-title">🏗️ Infrastructure Recommendations</div>
                        <ul>
                          {msg.structuredData.infrastructure.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div 
              className="chat-message-wrapper assistant"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            >
              <div className="ai-avatar-small">🧠</div>
              <div className="chat-bubble assistant thinking">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            className="chat-input"
            placeholder="Ask about traffic patterns, infrastructure, or specific road links..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
            disabled={isTyping}
          />
          <button 
            className="btn btn-primary send-btn"
            onClick={() => handleSend(inputValue)}
            disabled={!inputValue.trim() || isTyping}
          >
            Send 🚀
          </button>
        </div>
      </div>
    </motion.div>
  );
}
