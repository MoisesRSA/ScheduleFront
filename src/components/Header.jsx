import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Search, User, X, LogOut, MessageSquare } from 'lucide-react';
import './Header.css';

export default function Header({ searchQuery = '', onSearchChange, handleLogout }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState('Erro');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  useEffect(() => {
    // Buscar os agendamentos da API para mostrar como "Lembretes" futuros
    const fetchUpcoming = async () => {
      try {
        const res = await fetch("https://schedule-1-o6pj.onrender.com/booking/all", {
          headers: { "Authorization": "Bearer " + localStorage.getItem("my_token") }
        });
        if (res.ok) {
          const data = await res.json();
          // Filtra agendamentos do futuro e pega os 3 mais próximos
          const now = new Date();
          const upcoming = data
            .filter(b => b.startTime && new Date(b.startTime) > now)
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
            .slice(0, 3);
          
          setNotifications(upcoming);
        }
      } catch (e) {
        console.error("Notificações falharam", e);
      }
    };

    fetchUpcoming();
  }, []);

  return (
    <header className="glass-panel top-header">
      <div className="search-bar">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Buscar por pessoa ou local..."
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
        {searchQuery && (
          <button
            className="search-clear-btn"
            onClick={() => onSearchChange?.('')}
            title="Limpar pesquisa"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="header-actions">

        <button className="icon-btn" onClick={() => setShowFeedbackModal(true)} title="Enviar Feedback / Reportar Erro">
          <MessageSquare size={20} />
        </button>

        <div className="notification-container">
          <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} />
            {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown glass-card">
              <h3 className="notif-title">Lembretes Inéditos</h3>
              {notifications.length === 0 ? (
                <p className="notif-empty">Nenhum agendamento futuro por enquanto.</p>
              ) : (
                <div className="notif-list">
                  {notifications.map(n => {
                      const dataObj = new Date(n.startTime);
                      const dataFormatada = dataObj.toLocaleDateString() + ' às ' + dataObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <div key={n.id} className="notif-item">
                          <div className="notif-dot"></div>
                          <div className="notif-content">
                            <strong>{n.location || 'Sala Reservada'}</strong>
                            <span>{dataFormatada}</span>
                          </div>
                        </div>
                      );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="user-profile">
          <div className="avatar">
            {localStorage.getItem("user_picture") ? (
              <img 
                src={localStorage.getItem("user_picture")} 
                alt="Foto de perfil" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              <User size={20} />
            )}
          </div>
          <span className="user-name">
            {localStorage.getItem("user_name") || "Funcionário"}
          </span>
          
          <button className="header-logout-btn" onClick={handleLogout} title="Sair">
            <LogOut size={18} />
            <span className="logout-text">Sair</span>
          </button>
        </div>
      </div>

      {/* Modal de Feedback */}
      {showFeedbackModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
          <div className="glass-card feedback-modal" style={{ width: '400px', maxWidth: '90%', padding: '20px', borderRadius: '12px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)' }}>Enviar Feedback</h2>
              <button className="icon-btn" onClick={() => setShowFeedbackModal(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (isSendingFeedback) return;
              setIsSendingFeedback(true);
              try {
                const response = await fetch("https://formsubmit.co/ajax/ribeiromoises166@gmail.com", {
                  method: "POST",
                  headers: { 
                      "Content-Type": "application/json",
                      "Accept": "application/json"
                  },
                  body: JSON.stringify({
                      _subject: `[Feedback - ${feedbackType}] BookingFront`,
                      tipo: feedbackType,
                      mensagem: feedbackMessage,
                      usuario: localStorage.getItem("user_name") || "Anônimo",
                  })
                });
                if (response.ok) {
                  alert("✅ E-mail de feedback enviado com sucesso!");
                  setShowFeedbackModal(false);
                  setFeedbackMessage('');
                } else {
                  alert("⚠️ Erro ao enviar feedback. Tente novamente mais tarde.");
                }
              } catch (err) {
                alert("⚠️ Falha de rede. Verifique sua conexão e tente novamente.");
              } finally {
                setIsSendingFeedback(false);
              }
            }}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-light)', fontSize: '0.9rem' }}>Tipo de Mensagem</label>
                <select 
                  className="input-field" 
                  value={feedbackType} 
                  onChange={(e) => setFeedbackType(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)' }}
                >
                  <option value="Erro">Reportar Erro</option>
                  <option value="Melhoria">Sugestão de Melhoria</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-light)', fontSize: '0.9rem' }}>Sua Mensagem</label>
                <textarea 
                  className="input-field" 
                  rows="4" 
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Descreva o erro ou a melhoria..."
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-main)', resize: 'vertical' }}
                ></textarea>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={isSendingFeedback}>
                {isSendingFeedback ? 'Enviando...' : 'Enviar Mensagem'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
}
