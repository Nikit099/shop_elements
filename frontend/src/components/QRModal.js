import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useMainContext } from '../context';
import Button from './Button';
import './styles/FixedButton.css';

const QRModal = ({ isOpen, onClose }) => {
  const { businessId } = useMainContext();

  const telegramUrl = `https://t.me/LB_assistant_order_bot?startapp=${businessId}`;
  const maxUrl = `https://max.ru/LB_assistant_order_bot?startapp=${businessId}`;

  const [copyStatus, setCopyStatus] = useState({
    telegramLink: false,
    telegramImage: false,
    maxLink: false,
    maxImage: false
  });

  useEffect(() => {
    if (isOpen) {
      // Блокируем прокрутку на body и html элементах
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.documentElement.style.overflow = 'hidden';
    } else {
      // Восстанавливаем прокрутку
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
      document.documentElement.style.overflow = 'auto';
    }

    return () => {
      // Гарантируем восстановление при размонтировании
      document.body.style.overflow = 'auto';
      document.body.style.position = 'static';
      document.body.style.width = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [isOpen]);

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(prev => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const copyQRImage = async (qrId, type) => {
    try {
      const svgElement = document.getElementById(qrId);
      if (!svgElement) return;

      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(async (blob) => {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopyStatus(prev => ({ ...prev, [type]: true }));
            setTimeout(() => {
              setCopyStatus(prev => ({ ...prev, [type]: false }));
            }, 2000);
          } catch (err) {
            console.error('Failed to copy image: ', err);
            // Fallback: show download option
            const link = document.createElement('a');
            link.download = `qr-${type}.png`;
            link.href = canvas.toDataURL();
            link.click();
          }
        });
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    } catch (err) {
      console.error('Failed to copy QR image: ', err);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        style={{
          position: "fixed", 
          left: 0, 
          top: 0, 
          width: "100vw", 
          height: "100vh",
          zIndex: 99998,
          background: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      />
      
      <div 
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 99999,
          width: "90vw",
          maxWidth: "500px",
          maxHeight: "85vh",
          background: "var(--modal-bg)",
          borderRadius: 20,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Заголовок модального окна */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px",
          borderBottom: "1px solid var(--border-color)",
          background: "var(--surface)"
        }}>
          <h2 style={{
            fontSize: 20,
            fontWeight: 500,
            color: "var(--text-primary)",
            margin: 0
          }}>
            QR-коды для заказов
          </h2>
          <div 
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              background: "var(--element-bg)",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
          >
            <img 
              src={require("./images/close.svg").default} 
              alt="close" 
              style={{ width: "60%", height: "60%" }}
            />
          </div>
        </div>

        {/* Контент модального окна с прокруткой (скроллбар скрыт) */}
        <div style={{
          overflowY: "auto",
          padding: "20px",
          flex: 1,
          scrollbarWidth: "none", /* Firefox */
          msOverflowStyle: "none", /* IE and Edge */
        }}>
          {/* Скрываем скроллбар для WebKit браузеров */}
          <style>{`
            div[style*="overflowY: auto"]::-webkit-scrollbar {
              display: none;
              width: 0;
              height: 0;
            }
            div[style*="overflowY: auto"] {
              -webkit-overflow-scrolling: touch;
            }
          `}</style>
          <div style={{ marginBottom: 20 }}>
            <p style={{
              fontSize: 14,
              fontWeight: 300,
              color: "var(--text-secondary)",
              marginBottom: 20,
              lineHeight: 1.5
            }}>
              Отсканируйте QR-код, чтобы перейти к оформлению заказа через выбранный мессенджер
            </p>
          </div>

          {/* Telegram QR Section */}
          <div style={{
            background: "var(--surface)",
            borderRadius: 15,
            padding: 20,
            marginBottom: 20,
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 15
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "linear-gradient(135deg, #0088cc 0%, #006699 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12
              }}>
                <span style={{ color: "#fff", fontSize: 18, fontWeight: 500 }}>T</span>
              </div>
              <div>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  marginBottom: 4
                }}>
                  Telegram бот
                </h3>
                <p style={{
                  fontSize: 12,
                  fontWeight: 300,
                  color: "var(--text-secondary)"
                }}>
                  Для заказов через Telegram
                </p>
              </div>
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 20
            }}>
              <div style={{
                background: "#fff",
                padding: 15,
                borderRadius: 10,
                marginBottom: 15,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
              }}>
                <QRCodeSVG
                  id="telegram-qr"
                  value={telegramUrl}
                  size={150}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div style={{
                width: "100%",
                wordBreak: "break-all",
                fontSize: 12,
                fontWeight: 300,
                color: "var(--text-secondary)",
                backgroundColor: "var(--element-bg)",
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 15,
                border: "1px solid var(--border-color)"
              }}>
                {telegramUrl}
              </div>
<div style={{
                display: "flex",
                gap: 15,
                flexDirection: "column",
                width: "100%"

              }}>
              <div style={{
                display: "flex",
                gap: 10,
                width: "100%"
              }}>
                <Button
                  text={copyStatus.telegramImage ? "Скопировано!" : "Копировать QR"}
                  handleClick={() => copyQRImage("telegram-qr", "telegramImage")}
                  style={{
                    flex: 1,
                    height: 40,
                    fontSize: 14,
                    fontWeight: 400,
                    borderRadius: 8,
                    background: "var(--gradient-blue)"
                  }}
                />
                
              </div>
              <div style={{
                display: "flex",
                gap: 10,
                width: "100%"
              }}>
               
                <Button
                  text={copyStatus.telegramLink ? "Скопировано!" : "Копировать ссылку"}
                  handleClick={() => copyToClipboard(telegramUrl, "telegramLink")}
                  style={{
                    flex: 1,
                    height: 40,
                    fontSize: 14,
                    fontWeight: 400,
                    borderRadius: 8,
                    background: "var(--surface-darker)"
                  }}
                />
              </div>
              </div>
            </div>
          </div>

          {/* Max QR Section */}
          <div style={{
            background: "var(--surface)",
            borderRadius: 15,
            padding: 20,
            marginBottom: 20,
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 15
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12
              }}>
                <span style={{ color: "#fff", fontSize: 18, fontWeight: 500 }}>M</span>
              </div>
              <div>
                <h3 style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: "var(--text-primary)",
                  marginBottom: 4
                }}>
                  Макс
                </h3>
                <p style={{
                  fontSize: 12,
                  fontWeight: 300,
                  color: "var(--text-secondary)"
                }}>
                  Для заказов через Макс
                </p>
              </div>
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginBottom: 20
            }}>
              <div style={{
                background: "#fff",
                padding: 15,
                borderRadius: 10,
                marginBottom: 15,
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
              }}>
                <QRCodeSVG
                  id="max-qr"
                  value={maxUrl}
                  size={150}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div style={{
                width: "100%",
                wordBreak: "break-all",
                fontSize: 12,
                fontWeight: 300,
                color: "var(--text-secondary)",
                backgroundColor: "var(--element-bg)",
                padding: "10px 12px",
                borderRadius: 8,
                marginBottom: 15,
                border: "1px solid var(--border-color)"
              }}>
                {maxUrl}
              </div>
<div style={{
                display: "flex",
                gap: 15,
                flexDirection: "column",
                width: "100%"

              }}>
              <div style={{
                display: "flex",
                gap: 10,
                width: "100%"
              }}>
                <Button
                  text={copyStatus.maxImage ? "Скопировано!" : "Копировать QR"}
                  handleClick={() => copyQRImage("max-qr", "maxImage")}
                  style={{
                    flex: 1,
                    height: 40,
                    fontSize: 14,
                    fontWeight: 400,
                    borderRadius: 8,
                    background: "var(--gradient-red)"
                  }}
                />
                
              </div>
              <div style={{
                display: "flex",
                gap: 10,
                width: "100%"
              }}>
                
                <Button
                  text={copyStatus.maxLink ? "Скопировано!" : "Копировать ссылку"}
                  handleClick={() => copyToClipboard(maxUrl, "maxLink")}
                  style={{
                    flex: 1,
                    height: 40,
                    fontSize: 14,
                    fontWeight: 400,
                    borderRadius: 8,
                    background: "var(--surface-darker)"
                  }}
                />
              </div>
              </div>
            </div>
          </div>

          <div style={{
            fontSize: 11,
            fontWeight: 300,
            color: "var(--text-tertiary)",
            textAlign: "center",
            paddingTop: 20,
            borderTop: "1px solid var(--border-color)",
            marginTop: 10
          }}>
            QR-коды автоматически обновляются при изменении бизнес-идентификатора
          </div>
        </div>
      </div>
    </>
  );
};

export default QRModal;
