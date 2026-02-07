import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMainContext } from '../context';
import styles from './styles/BusinessSettings.module.css';

function BusinessSettings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, businessId, isBusinessOwner, sendMessage, message, setMessage } = useMainContext();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    logo_url: '',
    business_name: '',
    tagline: '',
    advantages: '',
    phone_number: '',
    telegram_url: '',
    whatsapp_url: '',
    address: '',
    yandex_map_url: '',
    yandex_reviews_url: '',
    call_to_action: '',
    faq: []
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});

  // Загрузка текущих настроек
  useEffect(() => {
    if (!businessId || !isBusinessOwner) {
      navigate(`/${businessId}`);
      return;
    }
    
    loadBusinessSettings();
  }, [businessId, isBusinessOwner]);

  // Обработка сообщений от сервера
useEffect(() => {
  if (!message) return;

  console.log('BusinessSettings received message:', message);

  if (message[0] === 'business_settings') {
    if (message[1] === 'get') {
      const settings = message[2];
      if (settings) {
        let faqData = settings.faq || [];
        
        setFormData({
          logo_url: settings.logo_url || '',
          business_name: settings.business_name || '',
          tagline: settings.tagline || '',
          advantages: settings.advantages || '',
          phone_number: settings.phone_number || '',
          telegram_url: settings.telegram_url || '',
          whatsapp_url: settings.whatsapp_url || '',
          address: settings.address || '',
          yandex_map_url: settings.yandex_map_url || '',
          yandex_reviews_url: settings.yandex_reviews_url || '',
          call_to_action: settings.call_to_action || '',
          faq: faqData
        });
        
        if (settings.logo_url) {
          setLogoPreview(settings.logo_url);
        }
      }
      setLoading(false);
    } else if (message[1] === 'update') {
      setSaving(false);
      alert('Настройки успешно сохранены!');
      navigate(`/${businessId}`);
    } else if (message[1] === 'upload_logo') {
      const logoUrl = message[2];
      setFormData(prev => ({ ...prev, logo_url: logoUrl }));
      setLogoPreview(logoUrl);
    }
  }

  setMessage(null);
}, [message]);

  const loadBusinessSettings = () => {
    sendMessage(JSON.stringify(['business_settings', 'get', { business_id: businessId }]));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Очищаем ошибку при изменении
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, выберите изображение');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('Размер файла не должен превышать 5MB');
      return;
    }
    
    setLogoFile(file);
    
    // Создаем preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadLogo = () => {
    if (!logoFile) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      sendMessage(JSON.stringify(['business_settings', 'upload_logo', {
        business_id: businessId,
        image_data: base64Data
      }]));
    };
    reader.readAsDataURL(logoFile);
  };

  const handleFaqChange = (index, field, value) => {
    const updatedFaq = [...formData.faq];
    if (!updatedFaq[index]) {
      updatedFaq[index] = { question: '', answer: '' };
    }
    
    updatedFaq[index][field] = value;
    
    setFormData(prev => ({ ...prev, faq: updatedFaq }));
  };

  const addFaqItem = () => {
    if (formData.faq.length >= 10) {
      alert('Максимальное количество вопросов - 10');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      faq: [...prev.faq, { question: '', answer: '' }]
    }));
  };

  const removeFaqItem = (index) => {
    const updatedFaq = [...formData.faq];
    updatedFaq.splice(index, 1);
    setFormData(prev => ({ ...prev, faq: updatedFaq }));
  };



  const validateForm = () => {
  const newErrors = {};
  
  // Проверка обязательных полей
  if (!formData.business_name.trim()) {
    newErrors.business_name = 'Название бизнеса обязательно';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSave = async () => {
  // Проверяем обязательные поля
  if (!formData.business_name.trim()) {
    setErrors({ business_name: 'Название бизнеса обязательно' });
    return;
  }
  
  setSaving(true);
  
  // Если есть новое логотип, сначала загружаем его
  if (logoFile) {
    console.log('Загружаем новое логотип перед сохранением...');
    
    try {
      // Читаем файл как base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsDataURL(logoFile);
      });
      
      // Отправляем логотип на сервер (сервер сам обновит базу данных)
      sendMessage(JSON.stringify(['business_settings', 'upload_logo', {
        business_id: businessId,
        image_data: base64Data
      }]));
      
      // Не ждем ответа - сервер обновит базу данных автоматически
      // Просто продолжаем сохранение настроек
      
    } catch (error) {
      console.error('Ошибка чтения файла:', error);
      alert('Ошибка чтения файла логотипа');
      setSaving(false);
      return;
    }
  }
  
  // Отправляем обновленные настройки (даже если логотип не менялся)
  sendMessage(JSON.stringify(['business_settings', 'update', {
    ...formData,
    business_id: businessId
  }]));
};
  const handleCancel = () => {
    navigate(`/${businessId}`);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка настроек...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        
        <h1 className={styles.title}>Настройки компании</h1>
      </div>

      <div className={styles.form}>
        {/* Секция логотипа и названия */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Основная информация</h2>
          
          <div className={styles.field}>
            <label className={`${styles.label} ${styles.required}`}>Логотип компании</label>
            <div className={styles.logoUpload}>
              <div className={styles.logoPreview}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Логотип" />
                ) : (
                  <div className={styles.logoPlaceholder}>LB</div>
                )}
              </div>
              <label className={styles.uploadButton}>
                {logoPreview ? 'Изменить логотип' : 'Загрузить логотип'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </label>
              {logoFile && !formData.logo_url && (
                <div className={styles.hint}>Логотип будет загружен при сохранении</div>
              )}
            </div>
          </div>
          
          <div className={styles.field}>
            <label className={`${styles.label} ${styles.required}`}>Название бизнеса</label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleInputChange}
              placeholder="Введите название вашего бизнеса"
              className={styles.input}
            />
            {errors.business_name && <div className={styles.error}>{errors.business_name}</div>}
            <div className={styles.hint}>Это название будет отображаться на главной странице</div>
          </div>
          
          <div className={styles.field}>
            <label className={styles.label}>Слоган или краткое описание</label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleInputChange}
              placeholder="Например: Нежность в каждом лепестке"
              className={styles.input}
            />
          </div>
        </div>

        {/* Секция преимуществ */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Преимущества</h2>
          <div className={styles.field}>
            <label className={styles.label}>Преимущества вашей компании</label>
            <textarea
              name="advantages"
              value={formData.advantages}
              onChange={handleInputChange}
              placeholder="Введите преимущества через • Например: Свежие цветы • Доставка • Гарантия • Круглосуточно"
              className={styles.textarea}
            />
            <div className={styles.hint}>Разделяйте преимущества символом • (точка с запятой)</div>
          </div>
        </div>

        {/* Секция контактов */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Контакты</h2>
          
          <div className={styles.field}>
            <label className={styles.label}>Номер телефона</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              placeholder="+7 999 123 45 67"
              className={styles.input}
            />
          </div>
          
          <div className={styles.field}>
            <label className={styles.label}>Ссылка на Telegram</label>
            <input
              type="url"
              name="telegram_url"
              value={formData.telegram_url}
              onChange={handleInputChange}
              placeholder="https://t.me/your_username"
              className={styles.input}
            />
          </div>
          
          <div className={styles.field}>
            <label className={styles.label}>Ссылка на WhatsApp</label>
            <input
              type="url"
              name="whatsapp_url"
              value={formData.whatsapp_url}
              onChange={handleInputChange}
              placeholder="https://wa.me/79991234567"
              className={styles.input}
            />
          </div>
          
          <div className={styles.field}>
            <label className={styles.label}>Адрес</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="г. Город, ул. Улица, д. Номер"
              className={styles.input}
            />
          </div>
        </div>

        {/* Секция Яндекс */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Яндекс интеграции</h2>
          
          <div className={styles.field}>
            <label className={styles.label}>Ссылка на Яндекс карты</label>
            <input
              type="url"
              name="yandex_map_url"
              value={formData.yandex_map_url}
              onChange={handleInputChange}
              placeholder="https://yandex.ru/map-widget/v1/..."
              className={styles.input}
            />
            <div className={styles.hint}>Вставьте iframe src из конструктора Яндекс карт</div>
          </div>
          
          <div className={styles.field}>
            <label className={styles.label}>Ссылка на Яндекс отзывы</label>
            <input
              type="url"
              name="yandex_reviews_url"
              value={formData.yandex_reviews_url}
              onChange={handleInputChange}
              placeholder="https://yandex.ru/sprav/widget/rating-badge/..."
              className={styles.input}
            />
            <div className={styles.hint}>Вставьте iframe src из виджета Яндекс отзывов</div>
          </div>
        </div>

        {/* Секция FAQ */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Вопросы и ответы (FAQ)</h2>
          <div className={styles.hint} style={{marginBottom: '15px'}}>
            Максимальное количество вопросов: 10. Ответы могут быть длинными, включать списки и форматирование.
          </div>
          
          {formData.faq.map((faqItem, faqIndex) => (
            <div key={faqIndex} className={styles.faqItem}>
              <div className={styles.faqHeader}>
                <div className={styles.faqQuestion}>
                  Вопрос {faqIndex + 1}
                </div>
                <button
                  type="button"
                  className={styles.removeFaqButton}
                  onClick={() => removeFaqItem(faqIndex)}
                >
                  Удалить
                </button>
              </div>
              
              <div className={styles.field}>
                <label className={styles.label}>Вопрос</label>
                <input
                  type="text"
                  value={faqItem.question || ''}
                  onChange={(e) => handleFaqChange(faqIndex, 'question', e.target.value)}
                  placeholder="Например: Почему мы?"
                  className={styles.input}
                />
              </div>
              
              <div className={styles.field}>
                <label className={styles.label}>Ответ</label>
                <textarea
                  value={faqItem.answer || ''}
                  onChange={(e) => handleFaqChange(faqIndex, 'answer', e.target.value)}
                  placeholder="Введите подробный ответ. Можно использовать HTML-теги для форматирования: <ul>, <li>, <br>, <a href='...'>ссылка</a>"
                  className={styles.textarea}
                  rows={6}
                />
                <div className={styles.hint}>
                  Подсказка: Для списка используйте &lt;ul&gt;&lt;li&gt;пункт 1&lt;/li&gt;&lt;li&gt;пункт 2&lt;/li&gt;&lt;/ul&gt;<br/>
                  Для ссылок: &lt;a href="tel:+79991234567"&gt;+7 999 123 45 67&lt;/a&gt;
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            className={styles.addFaqButton}
            onClick={addFaqItem}
            disabled={formData.faq.length >= 10}
          >
            + Добавить вопрос (осталось {10 - formData.faq.length})
          </button>
        </div>

        {/* Секция призыва к действию */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Призыв к действию</h2>
          <div className={styles.field}>
            <label className={styles.label}>Текст призыва к действию</label>
            <textarea
              name="call_to_action"
              value={formData.call_to_action}
              onChange={handleInputChange}
              placeholder="Например: Не нашли что искали? Отправьте сообщение или позвоните подберем самый подходящий букет для вашего мероприятия"
              className={styles.textarea}
            />
          </div>
        </div>

        {/* Кнопки действий */}
        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={handleCancel}
            disabled={saving}
          >
            Отмена
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BusinessSettings;