import styles from './styles/Add.module.css';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useMainContext } from '../context';
import FixedButton from '../components/FixedButton';
import Slider from '../components/Slider';
import MiniSlider from '../components/MiniSlider';
import Title from '../components/Title';
import FormLIGHT from '../components/FormLIGHT';
import CarView from '../components/CarView';
import FlexVariables from '../components/FlexVariables';
import Button from '../components/Button';
import LoadingHover from '../components/LoadingHover';
import ScrollToError from '../components/ScrollToError';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';

const validationSchema = Yup.object().shape({
  "input1": Yup.string()
    .max(100, 'Макс. длина 100')
    .required("Обязательное поле"),
  "input2": Yup.string()
    .max(100, 'Макс. длина 100')
    .required("Обязательное поле"),
  "input3": Yup.string()
    .max(350, 'Макс. длина 350')
    .required("Обязательное поле"),
  "input5": Yup.string()
    .max(100, 'Макс. длина 100')
    .required("Обязательное поле"),
});

function AddService() {

  const navigate = useNavigate();

  const { state, setState, accessToken, refreshToken, sendMessage, setLoading, postId, setPostId, message, setMessage, businessId } = useMainContext();

  const [ more, setMore ] = useState(false);
  const [ countLoadedImages, setCountLoadedImages ] = useState(null);
  const imagesDivRef = useRef();
  const [ images, setImages ] = useState([]);
  const [ activeImage, setActiveImage ] = useState(0);
  const [ photosError, setPhotosError ] = useState(null);
  const [ images2, setImages2 ] = useState([]);
  const [ activeImage2, setActiveImage2 ] = useState(null);
  const [ photosError2, setPhotosError2 ] = useState(null);
  const [ isShowInput77, setIsShowInput77 ] = useState(true);
  const [ inputs, setInputs ] = useState({
    "input1": {
      value: "Эвакуатор",
      error: null,
      label: "Категория услуги",
      type: "select",
      choices: [
        "Не выбрано",
        "Эвакуатор",
        "Деньги под залог ПТС",
        "Лизинг автомобилей",
        "Автоюрист бесплатная консультация",
        "Срочная продажа автомобиля",
        "Электронный полис е-ОСАГО",
        "Техническая гарантия на автомобили с пробегом",
        "Автокредит онлайн без первого взноса",
        "Автомобили в рассрочку",
        "Подбор автомобиля",
        "Обмен автомобиля",
        "Выкуп автомобиля",
        "Помощь на дороге",
        "Оформление переоборудования автомобилей",
        "Аукцион автомобилей с пробегом",
        "Диагностическая карта онлайн",
        "Автозапчасти",
        "Онлайн показ автомобиля",
        "Лизинг авто с пробегом",
        "Продажа с гарантией и обеспечительным платежём",
        "Онлайн комиссия",
        "ДТП Онлайн",
        "Комиссионная продажа",
        "Снятие запретов и ограничений",
        "Помощь в покупке",
        "Восстановление КБМ"
      ]
    },
    "input2": {
      value: null,
      isFocused: false,
      error: null,
      label: "Название услуги",
      type: "text",
    },
    "input1-1": {
      value: "По городу",
      error: null,
      label: "Куда выезжаете",
      type: "select",
      choices: [
        "По городу", "В области"
      ]
    },
    "input2-2": {
      value: "Лебедка",
      error: null,
      label: "Способ погрузки",
      type: "select",
      choices: [
        "Лебедка", "Манипулятор", "Сдвижная платформа", "Частичная погрузка", "Жестка цепка"
      ]
    },
    "input4-4": {
      value: "до 1.5 т",
      error: null,
      label: "Грузоподьемность",
      type: "select",
      choices: [
        "до 1.5 т", "до 2 т", "до 2.5 т", "до 3 т", "3 т и больше"
      ]
    },
    "input5-5": {
      value: "Легковые авто",
      error: null,
      label: "Что перевозите",
      type: "select",
      choices: [
        "Легковые авто", "Грузовые авто", "Автобусы, микроавтобусы", "Мотоциклы, снегоходы квадроциклы"
      ]
    },
    "input6-6": {
      value: "Да",
      error: null,
      label: "Работаете с юр.лицами",
      type: "select",
      choices: [
        "Да", "Нет"
      ]
    },
    "input7-7": {
      value: "Да",
      error: null,
      label: "Работаете с НДС",
      type: "select",
      choices: [
        "Да", "Нет"
      ]
    },
    "input3": {
      value: null,
      isFocused: false,
      error: null,
      label: "Описание",
      type: "textarea"
    },
    "input5": {
      value: null,
      isFocused: false,
      error: null,
      label: "Стоимость основной услуги, ₽",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' ₽',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: ' ',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 12, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input8-8": {
      value: "за услугу",
      error: null,
      label: "Тип стоимости",
      type: "select",
      choices: [
        "за услугу", "за час", "за км", "за метр", "за еденицу", "за день", "за кг", "за тонну", "за месяц"
      ]
    },
    "input4": {
      value: null,
      isFocused: false,
      error: null,
      label: "Место оказания услуг",
      type: "text"
    },
    "input9-9": {
      value: null,
      error: null,
      isFocused: false,
      label: "Стоимость, ₽",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' ₽',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: ' ',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 12, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input10-10": {
      value: "за услугу",
      error: null,
      label: "Тип стоимости",
      type: "select",
      choices: [
        "за услугу", "за час", "за км", "за метр", "за еденицу", "за день", "за кг", "за тонну", "за месяц"
      ]
    },
    "input11-11": {
      value: null,
      isFocused: false,
      error: null,
      label: "Введите название",
      type: "text"
    },
    "input12-12": {
      value: null,
      error: null,
      isFocused: false,
      label: "Стоимость, ₽",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' ₽',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: ' ',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 12, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input13-13": {
      value: "за услугу",
      error: null,
      label: "Тип стоимости",
      type: "select",
      choices: [
        "за услугу", "за час", "за км", "за метр", "за еденицу", "за день", "за кг", "за тонну", "за месяц"
      ]
    },
    "input14-14": {
      value: null,
      error: null,
      isFocused: false,
      label: "Контактное лицо",
      type: "text"
    },
    "input15-15": {
      value: null,
      error: null,
      isFocused: false,
      label: "Телефон",
      type: "text"
    },
  });
  const [ saving, setSaving ] = useState(false);

  useEffect(() => {
    window.scrollTo({top: 0, smooth: "behavior"});
  }, [])

  useEffect(() => {
    if (!postId) {
      setLoading(true);
      sendMessage(JSON.stringify(["posts", "create"]));
    }
  }, [postId])

  useEffect(() => {
    if (!accessToken && !refreshToken) {
      navigate(`/${businessId}/login/`, {replace: true});
    }
  }, [accessToken, refreshToken])

  const handleSubmit = (values) => {
    if (images.length === 0) {
      setPhotosError("Добавьте хотя бы 1 фотографию");
      return
    }
    images.forEach((image, index) => {
      sendMessage(JSON.stringify(["images", "add", postId, image.file, "main", index]));
    });
    images2.forEach((image, index) => {
      sendMessage(JSON.stringify(["images", "add", postId, image.file, "body", index]));
    });
    sendMessage(JSON.stringify(["posts", "update", postId, {...values, status: 1}]));
    setSaving(true);
  }

  useEffect(() => {
    if (message) {
      if (message[0] === 'posts') {
        if (message[1] === 'new') {
          navigate(`/${businessId}/posts/` + postId, {replace: true});
        }
      }
      setMessage(null);
    };
  }, [message]);

  return (
    <div className="view">
      <div className={styles.wrapper} style={{marginBottom: 20}}>
        <Slider images={images}
                imagesDivRef={imagesDivRef}
                setActiveImage={setActiveImage}
                canAdd={true}
                activeImage={activeImage}
                setImages={setImages}
                maxImagesCount={10}
                photosError={photosError}
                setPhotosError={setPhotosError}
                />
        {images.length > 0 &&
          <MiniSlider images={images}
                      imagesDivRef={imagesDivRef}
                      activeImage={activeImage}
                      canAdd={true}
                      setImages={setImages}
                      maxImagesCount={10}
                      />}
      </div>
      <Formik
        initialValues={{
          "input1": "Эвакуатор",
          "input2": "",
          "input3": "",
          "input4": "",
          "input5": "",
          "input1-1": "По городу",
          "input2-2": "Лебедка",
          "input4-4": "до 1.5 т",
          "input5-5": "Легковые авто",
          "input6-6": "Да",
          "input7-7": "Да",
          "input8-8": "за услугу",
          "input10-10": "за услугу",
          "input13-13": "за услугу",
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
      {({ errors, touched, handleSubmit, values }) => (
        <Form>
          {values.input1 === "Эвакуатор" ?
              <div className={styles.flex20gap}>
                <FormLIGHT inputs={Object.entries(inputs).slice(0, 1)} setInputs={setInputs} errors={errors} touched={touched} />
                <FormLIGHT inputs={Object.entries(inputs).slice(1, 2)} setInputs={setInputs} errors={errors} touched={touched} />
                <FormLIGHT inputs={Object.entries(inputs).slice(2, 6)} setInputs={setInputs} errors={errors} touched={touched} />
                {values["input6-6"] !== "Нет" ?
                    <FormLIGHT inputs={Object.entries(inputs).slice(6, 8)} setInputs={setInputs} errors={errors} touched={touched} />
                  :
                    <FormLIGHT inputs={Object.entries(inputs).slice(6, 7)} setInputs={setInputs} errors={errors} touched={touched} />
                }
                <FormLIGHT inputs={Object.entries(inputs).slice(8, 9)} setInputs={setInputs} errors={errors} touched={touched} />
                <FormLIGHT inputs={Object.entries(inputs).slice(9, 11)} setInputs={setInputs} errors={errors} touched={touched} />
                <FormLIGHT inputs={Object.entries(inputs).slice(11, 12)} setInputs={setInputs} errors={errors} touched={touched} />
                <div style={{fontSize: 16, marginBottom: -5}}>Прайс лист</div>
                <div style={{display: "flex", alignItems: "center", marginBottom: -15, marginTop: -5}}>
                  <div style={{fontSize: 14, fontWeight: 400}}>Срочная подача</div>
                  <div style={{padding: "0 10px", display: "flex"}}>
                    <img src={require("../components/images/plus.svg").default} alt="arrow" style={{transform: "rotate(90deg)"}} />
                  </div>
                </div>
                <FormLIGHT inputs={Object.entries(inputs).slice(12, 14)} setInputs={setInputs} errors={errors} touched={touched} />
                <div style={{display: "flex", alignItems: "center", marginBottom: -15, marginTop: -5}}>
                  <div style={{fontSize: 14, fontWeight: 400}}>Подача ко времени</div>
                  <div style={{padding: "0 10px", display: "flex"}}>
                    <img src={require("../components/images/plus.svg").default} alt="arrow" style={{transform: "rotate(90deg)"}} />
                  </div>
                </div>
                <div style={{display: "flex", alignItems: "center", marginBottom: -15}}>
                  <div style={{fontSize: 14, fontWeight: 400}}>Своя услуга</div>
                  <div style={{padding: "0 10px", display: "flex"}}>
                    <img src={require("../components/images/plus.svg").default} alt="arrow" style={{transform: "rotate(90deg)"}} />
                  </div>
                </div>
                <FormLIGHT inputs={Object.entries(inputs).slice(14, 17)} setInputs={setInputs} errors={errors} touched={touched} />
                <div style={{display: "flex", alignItems: "center", marginBottom: -10}}>
                  <div style={{fontSize: 14, fontWeight: 300}}>AutoLIGHT | Motor ComPANY</div>
                  <div style={{padding: "0 10px"}}>
                    <img src={require("../components/images/arrow-right.svg").default} alt="arrow" style={{transform: "rotate(90deg)"}} />
                  </div>
                </div>
                <FormLIGHT inputs={Object.entries(inputs).slice(17, 19)} setInputs={setInputs} errors={errors} touched={touched} />
                <Button text="Разместить" handleClick={handleSubmit} />
              </div>
            :
              <div className={styles.flex20gap}>
                <FormLIGHT inputs={Object.entries(inputs).slice(0, 1)} setInputs={setInputs} errors={errors} touched={touched} />
                <FormLIGHT inputs={Object.entries(inputs).slice(1, 2)} setInputs={setInputs} errors={errors} touched={touched} />
                {values["input6-6"] !== "Нет" ?
                    <FormLIGHT inputs={Object.entries(inputs).slice(6, 8)} setInputs={setInputs} errors={errors} touched={touched} />
                  :
                    <FormLIGHT inputs={Object.entries(inputs).slice(6, 7)} setInputs={setInputs} errors={errors} touched={touched} />
                }
                <FormLIGHT inputs={Object.entries(inputs).slice(8, 9)} setInputs={setInputs} errors={errors} touched={touched} />
                <FormLIGHT inputs={Object.entries(inputs).slice(9, 11)} setInputs={setInputs} errors={errors} touched={touched} />
                <FormLIGHT inputs={Object.entries(inputs).slice(11, 12)} setInputs={setInputs} errors={errors} touched={touched} />
                <Button text="Разместить" handleClick={handleSubmit} />
              </div>
          }
          <ScrollToError/>
        </Form>
      )}
      </Formik>
      <FixedButton />
      {saving && <LoadingHover />}
    </div>
  );
}

export default AddService;
