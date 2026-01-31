import styles from './styles/Add.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useMainContext } from '../context';
import Slider from '../components/Slider';
import MiniSlider from '../components/MiniSlider';
import FormLIGHT from '../components/FormLIGHT';
import Button from '../components/Button';
import LoadingHover from '../components/LoadingHover';
import ScrollToError from '../components/ScrollToError';
import AddPrice from '../components/AddPrice';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';

const validationSchema = Yup.object().shape({
  "category": Yup.string()
    .required("Обязательное поле"),
  "title": Yup.string()
    .required("Обязательное поле"),
  "price": Yup.string()
    .required("Обязательное поле")
});

function Edit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { sendMessage, message, setMessage, account, businessId, isBusinessOwner, loading } = useMainContext();
  const imagesDivRef = useRef();
  const [images, setImages] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [photosError, setPhotosError] = useState(null);
  const indexOfLoadedImage = useRef(-1);
  const [cardId, setCardId] = useState(null);
  const [card, setCard] = useState(null);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  const [inputs, setInputs] = useState({
    "category": {
      value: null,
      isFocused: false,
      error: null,
      label: "Категория",
      type: "select",
      choices: [
        "Розы с любовью",
        "Подарки"
      ]
    },
    "title": {
      value: null,
      isFocused: false,
      error: null,
      label: "Название",
      type: "text"
    },
    "price": {
      value: null,
      isFocused: false,
      error: null,
      label: "Цена, ₽",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' ₽',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: ' ',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0,
        integerLimit: 12,
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "oldPrice": {
      value: null,
      isFocused: false,
      error: null,
      label: "Старая цена, ₽",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' ₽',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: ' ',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0,
        integerLimit: 12,
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
  });

  const colors = [
    "Белые",
    "Красные",
    "Черные",
    "Синие",
    "Желтые", 
    "Оранжевые",
    "Розовые",
    "Микс",
    "Персиковые",
    "Красные & Белые",
    "Белые & Розовые",
    "Красные & Розовые",
    "Белые & Розовые & Персиковые",
    "Желтые & Красные & Розовые"
  ];
  const [selectedColors, setSelectedColors] = useState([]);
  const counts = ["9", "19", "29", "51", "101"];
  const [selectedCounts, setSelectedCounts] = useState([]);
  const sizes = ["50 см", "60 см", "70 см", "80 см"];
  const [selectedSizes, setSelectedSizes] = useState([]);
  const packages = ["Лента", "Коробка", "Корзина", "Подарочной упаковка", "Классика"];
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [prices, setPrices] = useState([]);

  // Запрос данных карточки при монтировании
  useEffect(() => {
    window.scrollTo({top: 0});
    if (id && !initialized) {
      sendMessage(JSON.stringify(["cards", "filter", {"_id": id}, 1]));
      setInitialized(true);
    }
  }, [id, sendMessage, initialized]);

  // Обработка сообщений от сервера
  useEffect(() => {
    if (!message) return;
    
    const currentPath = window.location.pathname;
    if (!currentPath.includes(`/${businessId}/edit/${id}`)) return;
    
    const msg = message;
    
    if (msg[0] === "cards") {
      if (msg[1] === "updated") {
        setCardId(msg[2]);
      } else if (msg[1] === 'filter') {
        if (msg[2] && msg[2][0]) {
          setCard(msg[2][0]);
        }
      } else if (msg[1] === 'deleted') {
        navigate(`/${businessId}`);
      }
    } else if (msg[0] === "images") {
      if (msg[1] === "added") {
        indexOfLoadedImage.current = msg[2];
      }
    }
    
    // Очищаем сообщение только если оно было обработано
    if ((msg[0] === "cards" && (msg[1] === "updated" || msg[1] === 'filter' || msg[1] === 'deleted')) || 
        (msg[0] === "images" && msg[1] === "added")) {
      setMessage(null);
    }
  }, [message, businessId, id, navigate, setMessage]);

  // Загрузка изображений после создания/обновления карточки
  useEffect(() => {
    if (cardId && indexOfLoadedImage.current + 1 <= images.length && images[indexOfLoadedImage.current + 1]) {
      sendMessage(JSON.stringify(["images", "add", cardId, indexOfLoadedImage.current + 1, images[indexOfLoadedImage.current + 1].file]));
    } else if (cardId) {
      setSaving(false);
      navigate(`/${businessId}/search?card_id=${cardId}`, { replace: true });
    }
  }, [cardId, images, businessId, navigate, sendMessage]);

  // Инициализация данных карточки
  useEffect(() => {
    if (card && !saving) {
      // Устанавливаем данные карточки
      setPrices(Array.isArray(card.prices) ? card.prices : []);
      setSelectedColors(card.colors || []);
      setSelectedCounts(card.counts || []);
      setSelectedSizes(card.sizes || []);
      setSelectedPackages(card.packages || []);
      
      // Обрабатываем изображения
      const processedImages = (card.images || []).map(p => {
        if (card.image_color) {
          const foundColor = card.image_color.find(s => s.index === p.index);
          if (foundColor?.color) {
            return { ...p, color: foundColor.color };
          }
          const foundCount = card.image_color.find(s => s.index === p.index);
          if (foundCount?.count) {
            return { ...p, count: foundCount.count };
          }
        }
        return p;
      });
      
      setImages(processedImages);
      
      // Обновляем inputs
      setInputs(prevState => {
        const newInputs = { ...prevState };
        Object.keys(newInputs).forEach(key => {
          const valueFromCard = card[key];
          newInputs[key] = {
            ...newInputs[key],
            value: valueFromCard || '',
            isFocused: valueFromCard !== "" && valueFromCard !== null
          };
        });
        return newInputs;
      });
      
      setSaving(false);
    }
  }, [card]);

  // Проверка прав доступа
  if (loading) return <div>Проверка прав доступа...</div>;

  if (!isBusinessOwner) {
    return (
      <div className="view">
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <h2>Доступ запрещен</h2>
          <p>У вас нет прав для редактирования товаров</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (values) => {
    if (images.length === 0) {
      setPhotosError("Добавьте хотя бы 1 фотографию");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    if (values["category"] === "Розы с любовью") {
      values["colors"] = selectedColors;
      values["counts"] = selectedCounts;
      values["packages"] = selectedPackages;
      values["sizes"] = selectedSizes;
      values["prices"] = prices;
      values["image_color"] = [];
      
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        if (image.color) {
          values["image_color"].push({index: i, color: image.color});
        }
        if (image.count) {
          values["image_color"].push({index: i, count: image.count});
        }
      }
    } else {
      delete values["colors"];
      delete values["counts"];
      delete values["packages"];
      delete values["sizes"];
      delete values["prices"];
      delete values["image_color"];
    }
    
    // Удаление изображений
    if (card?.images) {
      for (let i = 0; i < card.images.length; i++) {
        const image = card.images[i];
        const imageExists = images.some(img => {
          const imgCopy = { ...img };
          delete imgCopy.color;
          delete imgCopy.count;
          const cardImgCopy = { ...image };
          delete cardImgCopy.color;
          delete cardImgCopy.count;
          return JSON.stringify(imgCopy) === JSON.stringify(cardImgCopy);
        });
        
        if (!imageExists) {
          sendMessage(JSON.stringify(["images", "delete", image._id]));
        }
      }
    }
    
    sendMessage(JSON.stringify(["cards", "update", values, account, id, businessId]));
    setSaving(true);
  };

  // Если карточка загружена и не в процессе сохранения - показываем форму
  if (card && !saving) {
    return (
      <div className="view">
        <Formik
          initialValues={Object.keys(inputs).reduce((acc, key) => {
            acc[key] = inputs[key].value || '';
            return acc;
          }, {})}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
        {({ errors, touched, handleSubmit: formikHandleSubmit, values }) => (
          <Form>
            <div className={styles.wrapper} style={{marginBottom: 20}}>
              <Slider 
                images={images}
                imagesDivRef={imagesDivRef}
                setActiveImage={setActiveImage}
                canAdd={true}
                activeImage={activeImage}
                setImages={setImages}
                maxImagesCount={10}
                photosError={photosError}
                setPhotosError={setPhotosError}
                canChangeColor={values.category === "Розы с любовью"}
                canChangeCount={values.category === "Розы с любовью"}
              />
              {images.length > 0 && (
                <MiniSlider 
                  images={images}
                  imagesDivRef={imagesDivRef}
                  activeImage={activeImage}
                  canAdd={true}
                  setImages={setImages}
                  maxImagesCount={10}
                />
              )}
            </div>
            <div className={styles.flex20gap}>
              <FormLIGHT inputs={Object.entries(inputs).slice(1, 2)} setInputs={setInputs} errors={errors} touched={touched} />
              
              {values.category === "Розы с любовью" && (
                <>
                  <div>
                    <div style={{fontSize: 14, fontWeight: 300, paddingBottom: 10, color: "#bbb"}}>Доступные цвета</div>
                    <div style={{display: "flex", flexWrap: "wrap", gap: 10}}>
                      {colors.map((color, index) => (
                        <div 
                          key={`color${index}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px 7px",
                            borderRadius: 4,
                            background: selectedColors.includes(color) ? "#fff" : "rgb(24, 24, 26)",
                            fontSize: 14,
                            fontWeight: 300,
                            color: selectedColors.includes(color) ? "#000" : "#fff",
                            cursor: "pointer"
                          }}
                          onClick={() => {
                            if (selectedColors.includes(color)) {
                              setSelectedColors(prev => prev.filter(c => c !== color));
                            } else {
                              setSelectedColors(prev => [...prev, color]);
                            }
                          }}
                        >
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{fontSize: 14, fontWeight: 300, paddingBottom: 10, color: "#bbb"}}>Доступное количество цветов</div>
                    <div style={{display: "flex", flexWrap: "wrap", gap: 10}}>
                      {counts.map((count, index) => (
                        <div 
                          key={`count${index}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px 7px",
                            borderRadius: 4,
                            background: selectedCounts.includes(count) ? "#fff" : "rgb(24, 24, 26)",
                            fontSize: 14,
                            fontWeight: 300,
                            color: selectedCounts.includes(count) ? "#000" : "#fff",
                            cursor: "pointer"
                          }}
                          onClick={() => {
                            if (selectedCounts.includes(count)) {
                              setSelectedCounts(prev => prev.filter(c => c !== count));
                            } else {
                              setSelectedCounts(prev => [...prev, count]);
                            }
                          }}
                        >
                          {count}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{fontSize: 14, fontWeight: 300, paddingBottom: 10, color: "#bbb"}}>Доступные размеры букета</div>
                    <div style={{display: "flex", flexWrap: "wrap", gap: 10}}>
                      {sizes.map((size, index) => (
                        <div 
                          key={`size${index}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "4px 7px",
                            borderRadius: 4,
                            background: selectedSizes.includes(size) ? "#fff" : "rgb(24, 24, 26)",
                            fontSize: 14,
                            fontWeight: 300,
                            color: selectedSizes.includes(size) ? "#000" : "#fff",
                            cursor: "pointer"
                          }}
                          onClick={() => {
                            if (selectedSizes.includes(size)) {
                              setSelectedSizes(prev => prev.filter(s => s !== size));
                            } else {
                              setSelectedSizes(prev => [...prev, size]);
                            }
                          }}
                        >
                          {size}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <FormLIGHT inputs={Object.entries(inputs).slice(2)} setInputs={setInputs} errors={errors} touched={touched} />
              
              {values.category === "Розы с любовью" && (
                <AddPrice prices={prices} setPrices={setPrices} />
              )}
              
              <Button text="Сохранить" handleClick={formikHandleSubmit} />
              
              <div 
                style={{
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "#EF0E37", 
                  padding: 20, 
                  marginTop: 50,
                  cursor: "pointer"
                }} 
                onClick={() => {
                  sendMessage(JSON.stringify(["cards", "delete", account, id]));
                  setSaving(true);
                }}
              >
                Удалить карточку
              </div>
            </div>
            <ScrollToError/>
          </Form>
        )}
        </Formik>
      </div>
    );
  } 
  
  // Если в процессе сохранения - показываем лоадер
  else if (saving) {
    return <LoadingHover />;
  }
  
  // Если карточка еще не загружена - показываем загрузку
  else {
    return <div>Загрузка карточки...</div>;
  }
}

export default Edit;