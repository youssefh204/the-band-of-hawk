// components/CertificateManager.jsx
import { useState, useEffect } from 'react';
import api from '../apis/workshopClient';

export default function CertificateManager() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/certificates/my-certificates');
      if (res.data.success) {
        setCertificates(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch certificates:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCertificate = async (workshopId) => {
    try {
      setLoading(true);
      const res = await api.post('/certificates/generate', { workshopId });
      if (res.data.success) {
        setMessage('✅ Certificate generated successfully!');
        fetchCertificates();
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setLoading(false);
    }
  };

  const sendCertificateEmail = async (workshopId) => {
    try {
      setLoading(true);
      const res = await api.post('/certificates/send-email', { workshopId });
      if (res.data.success) {
        setMessage('📧 Certificate sent to your email!');
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to send certificate email');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
        <div className="text-white text-center">Loading certificates...</div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">🎓 My Certificates</h3>
      
      {message && (
        <div className={`p-3 rounded-lg mb-4 ${
          message.includes('✅') || message.includes('📧') 
            ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
            : 'bg-red-500/20 border border-red-500/30 text-red-300'
        }`}>
          {message}
        </div>
      )}

      <div className="space-y-4">
        {certificates.length > 0 ? (
          certificates.map((cert) => (
            <div key={cert._id} className="bg-white/10 rounded-xl p-4 border border-white/20">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-white font-semibold">{cert.workshopName}</h4>
                  <p className="text-white/60 text-sm">
                    Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                  </p>
                  <p className="text-white/50 text-xs">
                    Certificate ID: {cert.certificateId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => sendCertificateEmail(cert.workshopId._id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
                  >
                    📧 Email
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-white/60 text-center py-8">
            <div className="text-4xl mb-2">🎓</div>
            <div>No certificates yet</div>
            <div className="text-sm mt-1">Complete workshops to earn certificates!</div>
          </div>
        )}
      </div>
    </div>
  );
}