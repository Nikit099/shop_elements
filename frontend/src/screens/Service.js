import styles from './styles/Service.module.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useMainContext } from '../context';
import FixedButton from '../components/FixedButton';
import Title from '../components/Title';
import FormLIGHT from '../components/FormLIGHT';
import Button from '../components/Button';
import Items from '../components/Items';
import LoadingHover from '../components/LoadingHover';
import MiniSlider from '../components/MiniSlider';
import CarView from '../components/CarView';
import ScrollToError from '../components/ScrollToError';
import FlexVariables from '../components/FlexVariables';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import createNumberMask from 'text-mask-addons/dist/createNumberMask';

const validationSchema = Yup.object().shape({
  "input1": Yup.string()
    .max(100, 'Макс. длина 100')
    .required("Обязательное поле"),
});

function Service() {

  const navigate = useNavigate();
  const { id } = useParams();
  const { accessToken, refreshToken, why, why2, businessId } = useMainContext();
  const [ select, setSelect ] = useState("check");
  const [ more, setMore ] = useState(false);
  const [ images2, setImages2 ] = useState([]);
  const [ activeImage2, setActiveImage2 ] = useState(null);
  const [ inputs2, setInputs2 ] = useState({
    "input1": {
      value: "1 - Республика Адыгея",
      isFocused: false,
      error: null,
      label: "Регион",
      type: "select",
      choices: [
        "1 - Республика Адыгея",
        "2 - Республика Башкортостан",
        "3 - Республика Бурятия",
        "4 - Республика Алтай",
        "5 - Республика Дагестан",
        "6 - Республика Ингушетия",
        "7 - Кабардино-Балкарская республика",
        "8 - Республика Калмыкия",
        "9 - Карачаево-Черкесская республика",
        "10 -	Республика Карелия",
        "11 -	Республика Коми",
        "12 -	Республика Марий Эл",
        "13 -	Республика Мордовия",
        "14 -	Республика Саха (Якутия)",
        "15 -	Республика Северная Осетия — Алания",
        "16 -	Республика Татарстан",
        "17 -	Республика Тыва",
        "18 -	Удмуртская республика",
        "19 -	Республика Хакасия",
        "20 -	Чеченская республика",
        "21 -	Чувашская республика",
        "22 -	Алтайский край",
        "23 -	Краснодарский край",
        "24 -	Красноярский край",
        "25 -	Приморский край",
        "26 -	Ставропольский край",
        "27 -	Хабаровский край",
        "28 -	Амурская область",
        "29 -	Архангельская область",
        "30 -	Астраханская область",
        "31 -	Белгородская область",
        "32 -	Брянская область",
        "33 -	Владимирская область",
        "34 -	Волгоградская область",
        "35 -	Вологодская область",
        "36 -	Воронежская область",
        "37	- Ивановская область",
        "38	- Иркутская область",
        "39	- Калининградская область",
        "40	- Калужская область",
        "41	- Камчатский край",
        "42	- Кемеровская область",
        "43	- Кировская область",
        "44	- Костромская область",
        "45	- Курганская область",
        "46 -	Курская область",
        "47 -	Ленинградская область",
        "48 -	Липецкая область",
        "49 -	Магаданская область",
        "50 -	Московская область",
        "51 -	Мурманская область",
        "52 -	Нижегородская область",
        "53 -	Новгородская область",
        "54 -	Новосибирская область",
        "55	- Омская область",
        "56	- Оренбургская область",
        "57	- Орловская область",
        "58	- Пензенская область",
        "59	- Пермский край",
        "60	- Псковская область",
        "61	- Ростовская область",
        "62	- Рязанская область",
        "63	- Самарская область",
        "64	- Саратовская область",
        "65	- Сахалинская область",
        "66	- Свердловская область",
        "67	- Смоленская область",
        "68	- Тамбовская область",
        "69	- Тверская область",
        "70	- Томская область",
        "71	- Тульская область",
        "72	- Тюменская область",
        "73	- Ульяновская область",
        "74	- Челябинская область",
        "75	- Забайкальский край",
        "76	- Ярославская область",
        "77	- Москва",
        "78	- Санкт-Петербург",
        "79	- Еврейская автономная область",
        "83	- Ненецкий автономный округ",
        "86	- Ханты-Мансийский автономный округ - Югра",
        "87	- Чукотский автономный округ",
        "89	- Ямало-Ненецкий автономный округ",
        "91	- Республика Крым",
        "92	- Севастополь",
      ]
    },
    "input2": {
      value: null,
      isFocused: false,
      error: null,
      label: "VIN или номер кузова",
      type: "text"
    },
    "input3": {
      value: null,
      isFocused: false,
      error: null,
      label: "Госномер",
      type: "text"
    },
    "input4": {
      value: null,
      isFocused: false,
      error: null,
      label: "Марка",
      type: "text"
    },
    "input5": {
      value: null,
      isFocused: false,
      error: null,
      label: "Модель",
      type: "text"
    },
    "input6": {
      value: null,
      isFocused: false,
      error: null,
      label: "Год выпуска",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' г',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input7": {
      value: null,
      isFocused: false,
      error: null,
      label: "Поколение",
      type: "text"
    },
    "input8": {
      value: null,
      isFocused: false,
      error: null,
      label: "Модификация",
      type: "text"
    },
    "input9": {
      value: "Седан",
      isFocused: false,
      error: null,
      label: "Кузов",
      type: "select",
      choices: [
        "Седан", "Универсал", "Хэтчбек", "Лифтбек", "Купе", "Лимузин", "Кабриолет"
      ]
    },
    "input10": {
      value: "Левый",
      isFocused: false,
      error: null,
      label: "Руль",
      type: "select",
      choices: [
        "Левый", "Правый"
      ]
    },
    "input11": {
      value: null,
      isFocused: false,
      error: null,
      label: "Пробег",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' км',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      }),
      choices: [
        "км", "мили"
      ],
      selectChoice: "км"
    },
    "input12": {
      value: "Оригинал",
      isFocused: false,
      error: null,
      label: "ПТС",
      type: "select",
      choices: [
        "Оригинал", "Электронный", "Дубликат", "Нет ПТС"
      ]
    },
    "input13": {
      value: null,
      isFocused: false,
      error: null,
      label: "Владельцев по ПТС",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: '',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
  });
  const [ inputs3, setInputs3 ] = useState({
    "input1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Место составления",
      type: "text"
    },
    "input2": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата составления",
      type: "text"
    },
    "input3": {
      value: null,
      isFocused: false,
      error: null,
      label: "Номер телефона",
      type: "text"
    },
    "input4": {
      value: null,
      isFocused: false,
      error: null,
      label: "ФИО",
      type: "text"
    },
    "input5": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата рождения",
      type: "text"
    },
    "input6": {
      value: null,
      isFocused: false,
      error: null,
      label: "Паспорт серия / номер",
      type: "text"
    },
    "input7": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата выдачи",
      type: "text"
    },
    "input8": {
      value: null,
      isFocused: false,
      error: null,
      label: "Кем выдан",
      type: "text"
    },
    "input9": {
      value: null,
      isFocused: false,
      error: null,
      label: "Адрес регистрации",
      type: "text"
    },
    "input10": {
      value: null,
      isFocused: false,
      error: null,
      label: "Номер телефона",
      type: "text"
    },
    "input11": {
      value: null,
      isFocused: false,
      error: null,
      label: "ФИО",
      type: "text"
    },
    "input12": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата рождения",
      type: "text"
    },
    "input13": {
      value: null,
      isFocused: false,
      error: null,
      label: "Паспорт серия / номер",
      type: "text"
    },
    "input14": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата выдачи",
      type: "text"
    },
    "input15": {
      value: null,
      isFocused: false,
      error: null,
      label: "Кем выдан",
      type: "text"
    },
    "input16": {
      value: null,
      isFocused: false,
      error: null,
      label: "Адрес регистрации",
      type: "text"
    },
    "input17": {
      value: "Легковой",
      isFocused: false,
      error: null,
      label: "Тип ТС",
      type: "select",
      choices: [
        "Легковой", "Грузовой"
      ]
    },
    "input18": {
      value: null,
      isFocused: false,
      error: null,
      label: "VIN номер",
      type: "text"
    },
    "input19": {
      value: null,
      isFocused: false,
      error: null,
      label: "Марка",
      type: "text"
    },
    "input20": {
      value: null,
      isFocused: false,
      error: null,
      label: "Модель",
      type: "text"
    },
    "input21": {
      value: null,
      isFocused: false,
      error: null,
      label: "Год выпуска",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' г',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input22": {
      value: null,
      isFocused: false,
      error: null,
      label: "Пробег, км",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' км',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input23": {
      value: null,
      isFocused: false,
      error: null,
      label: "Модель / номер двигателя",
      type: "text"
    },
    "input24": {
      value: null,
      isFocused: false,
      error: null,
      label: "Мощность, л.с.",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' л.с.',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input25": {
      value: null,
      isFocused: false,
      error: null,
      label: "Объём, л",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' л',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input26": {
      value: null,
      isFocused: false,
      error: null,
      label: "Номер шасси, рамы",
      type: "text"
    },
    "input27": {
      value: null,
      isFocused: false,
      error: null,
      label: "Номер кузова",
      type: "text"
    },
    "input28": {
      value: "Седан",
      isFocused: false,
      error: null,
      label: "Кузов",
      type: "select",
      choices: [
        "Седан", "Универсал", "Хэтчбек", "Лифтбек", "Купе", "Лимузин", "Кабриолет"
      ]
    },
    "input29": {
      value: null,
      isFocused: false,
      error: null,
      label: "Цвет",
      type: "text"
    },
    "input30": {
      value: null,
      isFocused: false,
      error: null,
      label: "ПТС серия / номер",
      type: "text"
    },
    "input31": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата выдачи",
      type: "text"
    },
    "input32": {
      value: null,
      isFocused: false,
      error: null,
      label: "Кем выдан",
      type: "text"
    },
    "input33": {
      value: null,
      isFocused: false,
      error: null,
      label: "Госномер",
      type: "text"
    },
    "input34": {
      value: null,
      isFocused: false,
      error: null,
      label: "СТС серия / номер",
      type: "text"
    },
    "input35": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата выдачи",
      type: "text"
    },
    "input36": {
      value: null,
      isFocused: false,
      error: null,
      label: "Кем выдан",
      type: "text"
    },
    "input37": {
      value: null,
      isFocused: false,
      error: null,
      label: "Стоимость ТС",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' ₽',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input38": {
      value: "13.04.2023",
      isFocused: true,
      error: null,
      label: "к Договору купли-продажи автомобиля от",
      type: "text"
    },
    "input39": {
      value: "Паспорт транспортного средства",
      isFocused: false,
      error: null,
      label: "Паспорт транспортного средства",
      type: "radio"
    },
    "input40": {
      value: "СТС",
      isFocused: false,
      error: null,
      label: "СТС",
      type: "radio"
    },
    "input41": {
      value: "Сервисная книжка",
      isFocused: false,
      error: null,
      label: "Сервисная книжка",
      type: "radio"
    },
    "input42": {
      value: "Страховка",
      isFocused: false,
      error: null,
      label: "Страховка",
      type: "radio"
    },
    "input43": {
      value: null,
      isFocused: false,
      error: null,
      label: "",
      type: "text"
    },
  });
  const [ inputs4, setInputs4 ] = useState({
    "input1": {
      value: "Водительское удостоверение",
      error: null,
      label: "Документ",
      type: "select",
      choices: [
        "Водительское удостоверение",
        "Свидетельство о регистрации СТС"
      ]
    },
    "input2": {
      value: "00 AA 000000",
      isFocused: true,
      error: null,
      label: "Введите номер документа",
      type: "text"
    },
    "input2-2": {
      value: "00 00 000000",
      isFocused: true,
      error: null,
      label: "Введите номер свидетельства",
      type: "text"
    },
    "input3": {
      value: "A 000 AA 000",
      isFocused: true,
      error: null,
      label: "Гос. номер",
      type: "text"
    },
  });
  const [ inputs5, setInputs5 ] = useState({
    "input1": {
      value: "1 - Республика Адыгея",
      isFocused: false,
      error: null,
      label: "Регион регистрации ТС",
      type: "select",
      choices: [
        "1 - Республика Адыгея",
        "2 - Республика Башкортостан",
        "3 - Республика Бурятия",
        "4 - Республика Алтай",
        "5 - Республика Дагестан",
        "6 - Республика Ингушетия",
        "7 - Кабардино-Балкарская республика",
        "8 - Республика Калмыкия",
        "9 - Карачаево-Черкесская республика",
        "10 -	Республика Карелия",
        "11 -	Республика Коми",
        "12 -	Республика Марий Эл",
        "13 -	Республика Мордовия",
        "14 -	Республика Саха (Якутия)",
        "15 -	Республика Северная Осетия — Алания",
        "16 -	Республика Татарстан",
        "17 -	Республика Тыва",
        "18 -	Удмуртская республика",
        "19 -	Республика Хакасия",
        "20 -	Чеченская республика",
        "21 -	Чувашская республика",
        "22 -	Алтайский край",
        "23 -	Краснодарский край",
        "24 -	Красноярский край",
        "25 -	Приморский край",
        "26 -	Ставропольский край",
        "27 -	Хабаровский край",
        "28 -	Амурская область",
        "29 -	Архангельская область",
        "30 -	Астраханская область",
        "31 -	Белгородская область",
        "32 -	Брянская область",
        "33 -	Владимирская область",
        "34 -	Волгоградская область",
        "35 -	Вологодская область",
        "36 -	Воронежская область",
        "37	- Ивановская область",
        "38	- Иркутская область",
        "39	- Калининградская область",
        "40	- Калужская область",
        "41	- Камчатский край",
        "42	- Кемеровская область",
        "43	- Кировская область",
        "44	- Костромская область",
        "45	- Курганская область",
        "46 -	Курская область",
        "47 -	Ленинградская область",
        "48 -	Липецкая область",
        "49 -	Магаданская область",
        "50 -	Московская область",
        "51 -	Мурманская область",
        "52 -	Нижегородская область",
        "53 -	Новгородская область",
        "54 -	Новосибирская область",
        "55	- Омская область",
        "56	- Оренбургская область",
        "57	- Орловская область",
        "58	- Пензенская область",
        "59	- Пермский край",
        "60	- Псковская область",
        "61	- Ростовская область",
        "62	- Рязанская область",
        "63	- Самарская область",
        "64	- Саратовская область",
        "65	- Сахалинская область",
        "66	- Свердловская область",
        "67	- Смоленская область",
        "68	- Тамбовская область",
        "69	- Тверская область",
        "70	- Томская область",
        "71	- Тульская область",
        "72	- Тюменская область",
        "73	- Ульяновская область",
        "74	- Челябинская область",
        "75	- Забайкальский край",
        "76	- Ярославская область",
        "77	- Москва",
        "78	- Санкт-Петербург",
        "79	- Еврейская автономная область",
        "83	- Ненецкий автономный округ",
        "86	- Ханты-Мансийский автономный округ - Югра",
        "87	- Чукотский автономный округ",
        "89	- Ямало-Ненецкий автономный округ",
        "91	- Республика Крым",
        "92	- Севастополь",
      ]
    },
    "input2": {
      value: "Не выбрано",
      error: null,
      label: "Вид транспортного средства",
      type: "select",
      choices: [
        "Не выбрано", "Легковые", "Грузовые"
      ]
    },
    "input3": {
      value: null,
      isFocused: false,
      error: null,
      label: "Мощность л.с",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' л.с.',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input4": {
      value: null,
      isFocused: false,
      error: null,
      label: "Период владения, мес.",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' мес.',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input5": {
      value: "Не выбрано",
      error: null,
      label: "Повышающий коэффициент на дорогие автомобили",
      type: "select",
      choices: [
        "Не выбрано", "Коэфициент не применяется", "Коэфициент применяется"
      ]
    },
  });
  const [ inputs6, setInputs6 ] = useState({
    "input1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Наименование подразделения ГИБДД",
      type: "text"
    },
    "input2": {
      value: null,
      isFocused: false,
      error: null,
      label: "ФИО заявителя (или его представителя по доверенности)",
      type: "text"
    },
    "input3": {
      value: why,
      isFocused: false,
      error: null,
      label: "Причина обращения",
      type: "text",
      handleClick: () => {
        navigate("/page/1");
      }
    },
    "input4": {
      value: null,
      isFocused: false,
      error: null,
      label: "Государственный регистрационный знак № (при наличии)",
      type: "text"
    },
    "input5": {
      value: null,
      isFocused: false,
      error: null,
      label: "Идентификационный номер (VIN)",
      type: "text"
    },
    "input6": {
      value: null,
      isFocused: false,
      error: null,
      label: "Марка ТС",
      type: "text"
    },
    "input7": {
      value: null,
      isFocused: false,
      error: null,
      label: "Модель ТС",
      type: "text"
    },
    "input8": {
      value: "Легковой",
      isFocused: false,
      error: null,
      label: "Наименование (тип ТС)",
      type: "select",
      choices: [
        "Легковой", "Грузовой"
      ]
    },
    "input9": {
      value: null,
      isFocused: false,
      error: null,
      label: "Цвет кузова",
      type: "text"
    },
    "input10": {
      value: "B",
      isFocused: false,
      error: null,
      label: "Категория ТС",
      type: "select",
      choices: [
        "A", "B", "C", "D", "Прицеп"
      ]
    },
    "input11": {
      value: null,
      isFocused: false,
      error: null,
      label: "Год изготовления ТС",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' г',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input12": {
      value: "Отсутствует",
      isFocused: true,
      error: null,
      label: "Шасси (рама) №",
      type: "text"
    },
    "input13": {
      value: "Левый",
      isFocused: false,
      error: null,
      label: "Рулевое расположение",
      type: "select",
      choices: [
        "Левое", "Правое"
      ]
    },
    "input14": {
      value: null,
      isFocused: false,
      error: null,
      label: "Кузов (кабина, прицеп) №",
      type: "text"
    },
    "input15": {
      value: null,
      isFocused: false,
      error: null,
      label: "Тип привода",
      type: "text"
    },
    "input16": {
      value: null,
      isFocused: false,
      error: null,
      label: "Тип двигателя",
      type: "text"
    },
    "input17": {
      value: null,
      isFocused: false,
      error: null,
      label: "Тип трансмиссии",
      type: "text"
    },
    "input18": {
      value: null,
      isFocused: false,
      error: null,
      label: "Разрешённая максимальная масса",
      type: "text"
    },
    "input19": {
      value: null,
      isFocused: false,
      error: null,
      label: "Масса без нагрузки",
      type: "text"
    },
    "input20": {
      value: null,
      isFocused: false,
      error: null,
      label: "Паспорт ТС, серия / номер",
      type: "text"
    },
    "input21": {
      value: null,
      isFocused: false,
      error: null,
      label: "Паспорт ТС, дата выдачи",
      type: "text"
    },
    "input22": {
      value: "Cерия, номер, дата выдачи",
      isFocused: true,
      error: null,
      label: "Регистрационный документ ТС (СТС)",
      type: "text"
    },
    "input23": {
      value: null,
      isFocused: false,
      error: null,
      label: "ФИО заявителя или наименование юридического лица",
      type: "text"
    },
    "input24": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата и место рождения или дата регистрации юридического лица",
      type: "text"
    },
    "input25": {
      value: null,
      isFocused: false,
      error: null,
      label: "Документ удостоверяющий личность (только для физ. лиц)",
      type: "text"
    },
    "input26": {
      value: null,
      isFocused: false,
      error: null,
      label: "Серия / номер",
      type: "text"
    },
    "input27": {
      value: null,
      isFocused: false,
      error: null,
      label: "Кем выдан",
      type: "text"
    },
    "input28": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата выдачи",
      type: "text"
    },
    "input29": {
      value: null,
      isFocused: false,
      error: null,
      label: "Гражданство",
      type: "text"
    },
    "input30": {
      value: "Мужской",
      isFocused: false,
      error: null,
      label: "Пол",
      type: "select",
      choices: [
        "Мужской", "Женский"
      ]
    },
    "input31": {
      value: null,
      isFocused: false,
      error: null,
      label: "ИНН",
      type: "text"
    },
    "input32": {
      value: null,
      isFocused: false,
      error: null,
      label: "Адрес места жительства или адрес регистрации юридического лица",
      type: "text"
    },
    "input33": {
      value: null,
      isFocused: false,
      error: null,
      label: "Телефон",
      type: "text"
    },
    "input34": {
      value: null,
      isFocused: false,
      error: null,
      label: "Еmail",
      type: "text"
    },
    "input35": {
      value: "Без представителя, заявление подаётся собственником лично",
      isFocused: false,
      error: null,
      label: "Без представителя, заявление подаётся собственником лично",
      type: "radio"
    },
    "input36": {
      value: "Используется представитель",
      isFocused: false,
      error: null,
      label: "Используется представитель",
      type: "radio"
    },
    "input37": {
      value: null,
      isFocused: false,
      error: null,
      label: "ФИО представителя или наименование юридического лица",
      type: "text"
    },
    "input38": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата рождения представителя или дата регистрации юридического лица",
      type: "text"
    },
    "input39": {
      value: null,
      isFocused: false,
      error: null,
      label: "Документ удостоверяющий личность (только для физ. лиц)",
      type: "text"
    },
    "input40": {
      value: null,
      isFocused: false,
      error: null,
      label: "Серия / номер",
      type: "text"
    },
    "input41": {
      value: null,
      isFocused: false,
      error: null,
      label: "Кем выдан",
      type: "text"
    },
    "input42": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата выдачи",
      type: "text"
    },
    "input43": {
      value: null,
      isFocused: false,
      error: null,
      label: "Адрес места жительства представителя или адрес юр. лица",
      type: "text"
    },
    "input44": {
      value: null,
      isFocused: false,
      error: null,
      label: "Телефон представителя",
      type: "text"
    },
    "input45": {
      value: "когда, кем выдана, номер",
      isFocused: true,
      error: null,
      label: "Данные доверенности",
      type: "text"
    },
  });
  const [ inputs7, setInputs7 ] = useState({
    "input1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Наименование подразделения ГИБДД",
      type: "text"
    },
    "input2": {
      value: null,
      isFocused: false,
      error: null,
      label: "ФИО заявителя ",
      type: "text"
    },
    "input3": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата рождения",
      type: "text"
    },
    "input4": {
      value: null,
      isFocused: false,
      error: null,
      label: "Место рождения",
      type: "text"
    },
    "input5": {
      value: null,
      isFocused: false,
      error: null,
      label: "Адрес проживания",
      type: "text"
    },
    "input6": {
      value: "Паспорт",
      error: null,
      label: "Документ удостоверяющий личность (только для физ. лиц)",
      type: "select",
      choices: [
        "Паспорт"
      ]
    },
    "input7": {
      value: null,
      isFocused: false,
      error: null,
      label: "Серия, номер",
      type: "text"
    },
    "input8": {
      value: null,
      isFocused: false,
      error: null,
      label: "Кем выдан",
      type: "text"
    },
    "input9": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата выдачи",
      type: "text"
    },
    "input10": {
      value: null,
      isFocused: false,
      error: null,
      label: "Телефон",
      type: "text"
    },
    "input11": {
      value: null,
      isFocused: false,
      error: null,
      label: "СНИЛС",
      type: "text"
    },
    "input13": {
      value: null,
      isFocused: false,
      error: null,
      label: "Причина обращения",
      type: "text"
    },
    "input14": {
      value: why2,
      isFocused: false,
      error: null,
      label: "в/у в связи с",
      type: "text",
      handleClick: () => {
        navigate("/page/2");
      }
    },
    "input15": {
      value: null,
      isFocused: false,
      error: null,
      label: "К заявлению прилагаю",
      type: "text"
    },
    "input16": {
      value: null,
      isFocused: false,
      error: null,
      label: "Данные в/у",
      type: "text"
    },
    "input17": {
      value: null,
      isFocused: false,
      error: null,
      label: "Кем выдано в/у",
      type: "text"
    },
    "input18": {
      value: "B",
      isFocused: false,
      error: null,
      label: "Категория ТС",
      type: "select",
      choices: [
        "A", "B", "C", "D", "Прицеп"
      ]
    },
    "input19": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата выдачи в/у",
      type: "text"
    },
    "input20": {
      value: null,
      isFocused: false,
      error: null,
      label: "Особые отметки в/у",
      type: "text"
    },
  });
  const [ inputs8, setInputs8 ] = useState({
    "input1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Взамен ПТС 52 МС 531370",
      type: "text"
    },
    "input2": {
      value: null,
      isFocused: false,
      error: null,
      label: "1. Идентификационный номер (VIN)",
      type: "text"
    },
    "input3": {
      value: null,
      isFocused: false,
      error: null,
      label: "2. Марка / Модель ТС",
      type: "text"
    },
    "input5": {
      value: "Легковой",
      isFocused: false,
      error: null,
      label: "3. Наименование (тип ТС)",
      type: "select",
      choices: [
        "Легковой", "Грузовой"
      ]
    },
    "input6": {
      value: "B",
      isFocused: false,
      error: null,
      label: "4. Категория ТС",
      type: "select",
      choices: [
        "A", "B", "C", "D", "Прицеп"
      ]
    },
    "input7": {
      value: null,
      isFocused: false,
      error: null,
      label: "5. Год изготовления ТС",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' г',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    "input8": {
      value: null,
      isFocused: false,
      error: null,
      label: "6. Модель / № двигателя",
      type: "text"
    },
    "input9": {
      value: "Отсутствует",
      isFocused: true,
      error: null,
      label: "7. Шасси (рама) №",
      type: "text"
    },
    "input10": {
      value: null,
      isFocused: false,
      error: null,
      label: "8. Кузов (кабина, прицеп) №",
      type: "text"
    },
    "input11": {
      value: null,
      isFocused: false,
      error: null,
      label: "9. Цвет кузова (кабины, прицепа)",
      type: "text"
    },
    "input12": {
      value: null,
      isFocused: false,
      error: null,
      label: "10. Мощность двигателя",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' л.с.',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 4, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      }),
      choices: [
        "л.с.", "кВт"
      ],
      selectChoice: "л.с."
    },
    "input13": {
      value: null,
      isFocused: false,
      error: null,
      label: "11. Объем двигателя",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' см3',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 9, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      }),
    },
    "input14": {
      value: "Дизельный",
      isFocused: false,
      error: null,
      label: "12. Тип двигателя",
      type: "select",
      choices: [
        "Дизельный", "Бензиновый", "Электрический"
      ]
    },
    "input15": {
      value: "Первый",
      isFocused: false,
      error: null,
      label: "13. Экологический класс",
      type: "select",
      choices: [
        "Первый", "Второй", "Третий"
      ]
    },
    "input16": {
      value: null,
      isFocused: false,
      error: null,
      label: "14. Разрешенная максимальная масса",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' кг',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 9, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      }),
    },
    "input17": {
      value: null,
      isFocused: false,
      error: null,
      label: "15. Масса без нагрузки",
      type: "text",
      mask: createNumberMask({
        prefix: '',
        suffix: ' кг',
        includeThousandsSeparator: true,
        thousandsSeparatorSymbol: '',
        allowDecimal: false,
        decimalSymbol: null,
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 9, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      }),
    },
    "input18": {
      value: null,
      isFocused: false,
      error: null,
      label: "16. Организация-изготовитель ТС (страна)",
      type: "text"
    },
    "input19": {
      value: null,
      isFocused: false,
      error: null,
      label: "17. Одобрение типа ТС №",
      type: "text"
    },
    "input20": {
      value: null,
      isFocused: false,
      error: null,
      label: "18. Страна вывоза ТС",
      type: "text"
    },
    "input21": {
      value: null,
      isFocused: false,
      error: null,
      label: "19. Серия, № ТД, ТПО",
      type: "text"
    },
    "input22": {
      value: null,
      isFocused: false,
      error: null,
      label: "20. Таможенные ограничения",
      type: "text"
    },
    "input23": {
      value: null,
      isFocused: false,
      error: null,
      label: "21. Наименование (ф.и.о.) собственника ТС",
      type: "text"
    },
    "input24": {
      value: null,
      isFocused: false,
      error: null,
      label: "22. Адрес",
      type: "text"
    },
    "input25": {
      value: null,
      isFocused: false,
      error: null,
      label: "23. Наименование организации, выдавшей паспорт",
      type: "text"
    },
    "input26": {
      value: null,
      isFocused: false,
      error: null,
      label: "24. Адрес",
      type: "text"
    },
    "input27": {
      value: null,
      isFocused: false,
      error: null,
      label: "25. Дата выдачи паспорта",
      type: "text"
    },
    "input28": {
      value: null,
      isFocused: false,
      error: null,
      label: "Взамен ПТС 52 МС 531370    (Узнать какие есть особые отметки)",
      type: "text"
    },
    "input29": {
      value: null,
      isFocused: false,
      error: null,
      label: "Наименование (ф.и.о.) собственника",
      type: "text"
    },
    "input30": {
      value: null,
      isFocused: false,
      error: null,
      label: "Адрес",
      type: "text"
    },
    "input31": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата продажи (передачи)",
      type: "text"
    },
    "input32": {
      value: null,
      isFocused: false,
      error: null,
      label: "Док-т на право собственности",
      type: "text"
    },
    "input33": {
      value: null,
      isFocused: false,
      error: null,
      label: "СТС серия / номер",
      type: "text"
    },
    "input34": {
      value: null,
      isFocused: false,
      error: null,
      label: "Государственный регистрационный знак",
      type: "text"
    },
    "input35": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата регистрации",
      type: "text"
    },
    "input36": {
      value: null,
      isFocused: false,
      error: null,
      label: "Выдано ГИБДД",
      type: "text"
    },
    "input37": {
      value: null,
      isFocused: false,
      error: null,
      label: "Отметка о снятии с учёта",
      type: "text"
    },
    "input38": {
      value: null,
      isFocused: false,
      error: null,
      label: "Дата снятия учёта",
      type: "text"
    },
  });
  const [ inputs12, setInputs12 ] = useState({
    "input1": {
      value: "Оригинал",
      isFocused: false,
      error: null,
      label: "ПТС",
      type: "select",
      choices: [
        "Оригинал", "Электронный", "Дубликат", "Нет ПТС"
      ]
    },
    "input2": {
      value: null,
      isFocused: false,
      error: null,
      label: "Владельцев по ПТС",
      type: "text"
    },
    "input3": {
      value: "КАСКО до 23.03.2024 (Дата окончания страховки)",
      isFocused: false,
      error: null,
      label: "Страховка",
      type: "select",
      choices: [
        "ОСАГО", "КАСКО", "Отсутствует"
      ]
    },
    "input4": {
      value: "В наличии",
      isFocused: false,
      error: null,
      label: "Статус",
      type: "select",
      choices: [
        "В наличии", "Отсутствует"
      ]
    },
    "input5": {
      value: "Личный автомобиль",
      isFocused: false,
      error: null,
      label: "Вид объявления",
      type: "select",
      choices: [
        "Личный автомобиль", "Автомобиль приобретён на продажу", "Комиссионная продажа", "Онлайн", "Услуга 250р"
      ]
    },

    "input1-1": {
      value: "ABS Антиблокировочная система",
      isFocused: false,
      error: null,
      label: "ABS Антиблокировочная система",
      type: "radio"
    },
    "input2-1": {
      value: "EBD Распределения усилия тормоза",
      isFocused: false,
      error: null,
      label: "EBD Распределения усилия тормоза",
      type: "radio"
    },
    "input3-1": {
      value: "BAS Вспомогательное торможение",
      isFocused: false,
      error: null,
      label: "BAS Вспомогательное торможение",
      type: "radio"
    },
    "input4-1": {
      value: "DMS Система выбора режима движения",
      isFocused: false,
      error: null,
      label: "DMS Система выбора режима движения",
      type: "radio"
    },
    "input5-1": {
      value: "ESP Система стабилизации",
      isFocused: false,
      error: null,
      label: "ESP Система стабилизации",
      type: "radio"
    },
    "input6-1": {
      value: "ТСS Антипробуксовочная система",
      isFocused: false,
      error: null,
      label: "ТСS Антипробуксовочная система",
      type: "radio"
    },
    "input7-1": {
      value: "Не выбрано",
      error: null,
      label: "Круиз-контроль",
      type: "select",
      choices: [
        "Не выбрано", "Пассивный", "Адаптивный"
      ]
    },
    "input8-1": {
      value: "Система помощи при парковке",
      isFocused: false,
      error: null,
      label: "Система помощи при парковке",
      type: "select",
      choices: [
        "Парктроник задний", "Парктроник передний", "Комбинированный парктроник"
      ]
    },
    "input9-1": {
      value: "Камера",
      isFocused: false,
      error: null,
      label: "Камера",
      type: "select",
      choices: [
        "360*", "Передняя", "Задняя"
      ]
    },
    "input10-1": {
      value: "Система автомотической парковки",
      isFocused: false,
      error: null,
      label: "Система автомотической парковки",
      type: "radio"
    },
    "input11-1": {
      value: "Автопилот",
      isFocused: false,
      error: null,
      label: "Автопилот",
      type: "radio"
    },
    "input12-1": {
      value: "Помощь при старте в гору",
      isFocused: false,
      error: null,
      label: "Помощь при старте в гору",
      type: "radio"
    },
    "input13-1": {
      value: "Помощь при спуске",
      isFocused: false,
      error: null,
      label: "Помощь при спуске",
      type: "radio"
    },
    "input14-1": {
      value: "Контроль за полосой движения",
      isFocused: false,
      error: null,
      label: "Контроль за полосой движения",
      type: "radio"
    },
    "input15-1": {
      value: "Контроль слепых зон",
      isFocused: false,
      error: null,
      label: "Контроль слепых зон",
      type: "radio"
    },
    "input16-1": {
      value: "Распознавание дорожных знаков",
      isFocused: false,
      error: null,
      label: "Распознавание дорожных знаков",
      type: "radio"
    },
    "input17-1": {
      value: "Предотвращения столкновения",
      isFocused: false,
      error: null,
      label: "Предотвращения столкновения",
      type: "radio"
    },
    "input18-1": {
      value: "Датчик усталости водителя",
      isFocused: false,
      error: null,
      label: "Датчик усталости водителя",
      type: "radio"
    },
    "input19-1": {
      value: "Система Ночного видения",
      isFocused: false,
      error: null,
      label: "Система Ночного видения",
      type: "radio"
    },
    "input20-1": {
      value: "Обнаружение пешеходов",
      isFocused: false,
      error: null,
      label: "Обнаружение пешеходов",
      type: "radio"
    },
    "input21-1": {
      value: "Датчик дождя",
      isFocused: false,
      error: null,
      label: "Датчик дождя",
      type: "radio"
    },
    "input22-1": {
      value: "Бортовой компьютер",
      isFocused: false,
      error: null,
      label: "Бортовой компьютер",
      type: "radio"
    },
    "input23-1": {
      value: "Не выбрано",
      error: null,
      label: "Фары",
      type: "select",
      choices: [
        "Не выбрано", "Галогеновые", "Светодиодные", "Ксеноновые", "Биксеноновые", "Лазерные"
      ]
    },
    "input24-1": {
      value: "Противотуманные фары",
      isFocused: false,
      error: null,
      label: "Противотуманные фары",
      type: "radio"
    },
    "input25-1": {
      value: "Дневные ходовые огни",
      isFocused: false,
      error: null,
      label: "Дневные ходовые огни",
      type: "radio"
    },
    "input26-1": {
      value: "Датчик света",
      isFocused: false,
      error: null,
      label: "Датчик света",
      type: "radio"
    },
    "input27-1": {
      value: "Автоматический дальний свет",
      isFocused: false,
      error: null,
      label: "Автоматический дальний свет",
      type: "radio"
    },
    "input28-1": {
      value: "Адаптивное освещение",
      isFocused: false,
      error: null,
      label: "Адаптивное освещение",
      type: "radio"
    },
    "input29-1": {
      value: "Автоматический корректор фар",
      isFocused: false,
      error: null,
      label: "Автоматический корректор фар",
      type: "radio"
    },
    "input30-1": {
      value: "Омыватели фар",
      isFocused: false,
      error: null,
      label: "Омыватели фар",
      type: "radio"
    },
    "input31-1": {
      value: "Кожа",
      isFocused: false,
      error: null,
      label: "Материал салона",
      type: "select",
      choices: [
        "Кожа", "Ткань", "Велюр", "Комбинированный", "Искуственная кожа", "Алькантара"
      ]
    },
    "input32-1": {
      value: "Да",
      isFocused: false,
      error: null,
      label: "Салон перетянут",
      type: "select",
      choices: [
        "Да", "Нет"
      ]
    },
    "input33-1": {
      value: "Отличное",
      isFocused: false,
      error: null,
      label: "Состояние салона",
      type: "select",
      choices: [
        "Отличное", "Хорошее", "Среднее", "Плохое"
      ]
    },
    "input34-1": {
      value: "Наличие люка",
      isFocused: false,
      error: null,
      label: "Наличие люка",
      type: "radio"
    },
    "input35-1": {
      value: "Панорамная крыша",
      isFocused: false,
      error: null,
      label: "Панорамная крыша",
      type: "radio"
    },
    "input36-1": {
      value: "Кондиционер",
      isFocused: false,
      error: null,
      label: "Управление климатом",
      type: "select",
      choices: [
        "Кондиционер", "Климат-контроль однозонный", "Двухзонный", "Многозонный"
      ]
    },
    "input37-1": {
      value: "Отделка потолка в чёрный цвет",
      isFocused: false,
      error: null,
      label: "Отделка потолка в чёрный цвет",
      type: "radio"
    },
    "input38-1": {
      value: "Сиденья с массажем",
      isFocused: false,
      error: null,
      label: "Сиденья с массажем",
      type: "radio"
    },
    "input39-1": {
      value: "Третий ряд сидений",
      isFocused: false,
      error: null,
      label: "Третий ряд сидений",
      type: "radio"
    },
    "input40-1": {
      value: "2",
      isFocused: false,
      error: null,
      label: "Количество мест",
      type: "select",
      choices: [
        "2", "3", "4", "5", "6", "7", "8", "9"
      ]
    },
    "input41-1": {
      value: "Сиденья водителя",
      isFocused: false,
      error: null,
      label: "Вентиляция сидений",
      type: "select",
      choices: [
        "Сиденья водителя", "Передних сидений", "Задних сидений"
      ]
    },
    "input42-1": {
      value: "Сиденья водителя",
      isFocused: false,
      error: null,
      label: "Электроподогрев",
      type: "select",
      choices: [
        "Сиденья водителя", "Передних сидений", "Задних сидений"
      ]
    },
    "input43-1": {
      value: "Сиденья водителя",
      isFocused: false,
      error: null,
      label: "Электропривод",
      type: "select",
      choices: [
        "Сиденья водителя", "Передних сидений", "Задних сидений"
      ]
    },
    "input44-1": {
      value: "Сиденья водителя",
      isFocused: false,
      error: null,
      label: "Память настроек",
      type: "select",
      choices: [
        "Сиденья водителя", "Передних сидений", "Задних сидений"
      ]
    },
    "input45-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Доводчик дверей",
      type: "radio"
    },
    "input46-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Розетка 220V",
      type: "radio"
    },
    "input47-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Открытие багажника без помощи рук",
      type: "radio"
    },
    "input48-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Зеркала в цвет кузова",
      type: "radio"
    },
    "input49-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Зеркало с повторением поворота",
      type: "radio"
    },
    "input50-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Электроподогрев зеркал",
      type: "radio"
    },
    "input51-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Память настроек зеркал",
      type: "radio"
    },
    "input52-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Остекление с защитой от ультрафиолета",
      type: "radio"
    },
    "input53-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Подогрев лобового стекла",
      type: "radio"
    },
    "input54-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Подогрев заднего стекла",
      type: "radio"
    },
    "input55-1": {
      value: "Без тонировки",
      isFocused: false,
      error: null,
      label: "Тонировка",
      type: "select",
      choices: [
        "Без тонировки", "Полная", "Задняя часть"
      ]
    },
    "input56-1": {
      value: "Нет",
      isFocused: false,
      error: null,
      label: "Электрические стеклоподьемники",
      type: "select",
      choices: [
        "Нет", "Передние", "Задние", "Все"
      ]
    },
    "input57-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Электроподогрев зоны стеклоочистителей",
      type: "radio"
    },
    "input58-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Электроподогрев форсунок стеклоомывателей",
      type: "radio"
    },
    "input59-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Кожаный руль",
      type: "radio"
    },
    "input60-1": {
      value: "Гидравлический (ГУР)",
      isFocused: false,
      error: null,
      label: "Усилитель руля",
      type: "select",
      choices: [
        "Гидравлический (ГУР)", "Электрический (ЭУР)", "Электрогидравлический (ЭГУР)"
      ]
    },
    "input61-1": {
      value: "По высоте",
      isFocused: false,
      error: null,
      label: "Регулировка руля",
      type: "select",
      choices: [
        "По высоте", "По вылету", "Электрорегулировка"
      ]
    },
    "input62-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Память настроек рулевой колонки",
      type: "radio"
    },
    "input63-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Управление на руле",
      type: "radio"
    },
    "input64-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Подрулевые лепестки",
      type: "radio"
    },
    "input65-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Электроподогрев руля",
      type: "radio"
    },
    "input66-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Электронная приборная панель",
      type: "radio"
    },
    "input67-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Проекционный дисплей",
      type: "radio"
    },
    "input68-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Система “старт-стоп”",
      type: "radio"
    },
    "input69-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Многофункциональный дисплей",
      type: "radio"
    },
    "input70-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Встроенная навигация",
      type: "radio"
    },
    "input71-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Видео-регистартор",
      type: "radio"
    },
    "input72-1": {
      value: "Полный комплект",
      isFocused: false,
      error: null,
      label: "Комплектация ключей",
      type: "select",
      choices: [
        "Один ключ", "Два ключа", "Полный комплект"
      ]
    },
    "input73-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Центральный замок",
      type: "radio"
    },
    "input74-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Сигнализация",
      type: "radio"
    },
    "input75-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Бесключевой доступ",
      type: "radio"
    },
    "input76-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "ЭРА-ГЛОНАСС",
      type: "radio"
    },
    "input77-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "CarPlay",
      type: "radio"
    },
    "input78-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Android Auto",
      type: "radio"
    },
    "input79-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Яндекс Авто",
      type: "radio"
    },
    "input80-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Мультимедиа система с ЖК-экраном",
      type: "radio"
    },
    "input81-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Мультимедиа система для задних пассажиров",
      type: "radio"
    },
    "input82-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Беспроводная зарядка для смартфона",
      type: "radio"
    },
    "input83-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Навигационная система",
      type: "radio"
    },
    "input84-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Голосовое управление",
      type: "radio"
    },
    "input85-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "USB",
      type: "radio"
    },
    "input86-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "AUX",
      type: "radio"
    },
    "input87-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Bluetooth",
      type: "radio"
    },
    "input88-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Радио",
      type: "radio"
    },
    "input89-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Аудиосистема",
      type: "select",
      choices: [
        "2 колонки", "4 колонки", "6 колонок", "8+ колонок"
      ]
    },
    "input90-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Савбуфер",
      type: "radio"
    },
    "input91-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Фаркоп",
      type: "radio"
    },
    "input92-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Защита картера",
      type: "radio"
    },
    "input93-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Рейлинги на крыше",
      type: "radio"
    },
    "input94-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Обвес кузова",
      type: "radio"
    },
    "input95-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Бронированный кузов",
      type: "radio"
    },
    "input96-1": {
      value: "Активная",
      isFocused: false,
      error: null,
      label: "Подвеска",
      type: "select",
      choices: [
        "Активная", "Спортивная", "Пневмоподвеска"
      ]
    },
    "input97-1": {
      value: "Штампованные",
      isFocused: false,
      error: null,
      label: "Тип дисков",
      type: "select",
      choices: [
        "Штампованные", "Литые", "Кованные", "Сборные"
      ]
    },
    "input98-1": {
      value: "13\”",
      isFocused: false,
      error: null,
      label: "Радиус дисков",
      type: "select",
      choices: [
        "13\”", "14\”", "15\”", "16\”"
      ]
    },
    "input99-1": {
      value: "Зимняя",
      isFocused: false,
      error: null,
      label: "Тип резины",
      type: "select",
      choices: [
        "Зимняя", "Летняя", "Всесезонная"
      ]
    },
    "input100-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Профиль шин",
      type: "text"
    },
    "input101-1": {
      value: "Изношенная шина 1.6 мм",
      isFocused: false,
      error: null,
      label: "Износ резины высота протектора",
      type: "select",
      choices: [
        "Изношенная шина 1.6 мм", "Средний износ 4 мм", "Новая шина 8 мм"
      ]
    },
    "input102-1": {
      value: "Полноразмерное",
      isFocused: false,
      error: null,
      label: "Запасное колесо",
      type: "select",
      choices: [
        "Полноразмерное", "Докатка"
      ]
    },
    "input103-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Датчик давления в шинах",
      type: "radio"
    },
    "input104-1": {
      value: null,
      isFocused: false,
      error: null,
      label: "Зимние шины в комплекте",
      type: "radio"
    },
    "input105-1": {
      value: "1",
      isFocused: false,
      error: null,
      label: "Общее количество",
      type: "select",
      choices: [
        "1", "2", "3", "Отсутствуют"
      ]
    },
    "input106-1": {
      value: "Есть",
      isFocused: false,
      error: null,
      label: "Водителя",
      type: "select",
      choices: [
        "Нет", "Есть", "Неисправен"
      ]
    },
    "input107-1": {
      value: "Есть",
      isFocused: false,
      error: null,
      label: "Пассажира",
      type: "select",
      choices: [
        "Нет", "Есть", "Неисправен"
      ]
    },
    "input108-1": {
      value: "Есть",
      isFocused: false,
      error: null,
      label: "Боковые",
      type: "select",
      choices: [
        "Нет", "Есть", "Неисправен"
      ]
    },
    "input109-1": {
      value: "Есть",
      isFocused: false,
      error: null,
      label: "Коленные",
      type: "select",
      choices: [
        "Нет", "Есть", "Неисправен"
      ]
    },
    "input110-1": {
      value: "Есть",
      isFocused: false,
      error: null,
      label: "Шторки",
      type: "select",
      choices: [
        "Нет", "Есть", "Неисправен"
      ]
    }
  });
  const [variables, setVariables] = useState([
    {
      value: "check",
      label: "Проверить"
    },
    {
      value: "pay",
      label: "Оплатить"
    }
  ]);
  const [ damages, setDamages ] = useState([]);
  const [ saving, setSaving ] = useState(false);

  useEffect(() => {
    window.scrollTo({top: 0, smooth: "behavior"});
  }, [])

  useEffect(() => {
    setInputs6((prevState) => {
      return {
        ...prevState,
        "input3": {
          ...prevState["input3"],
          isFocused: prevState["input3"].value ? true : false
        },
      };
    });
  }, [why])

  useEffect(() => {
    setInputs7((prevState) => {
      return {
        ...prevState,
        "input14": {
          ...prevState["input14"],
          isFocused: prevState["input14"].value ? true : false
        },
      };
    });
  }, [why2])

  useEffect(() => {
    if (!accessToken && !refreshToken) {
      navigate(`/${businessId}/login`, {replace: true});
    }
  }, [accessToken, refreshToken])

  const handleSubmit = (values) => {
    alert(JSON.stringify(values))
  }



  return (
    <div className={styles.view}>
      {id === "1" &&
      <div style={{display: "flex", flexFlow: "column", height: "100vh", justifyContent: "center"}}>
        <Title text={`Проверь истории автомобиля`}/>
        <div className={styles.vinsearch}>
          <img src={require("../components/images/search-input.svg").default} alt="search"/>
          <input type="text" placeholder="Укажите госномер, VIN или номер кузова" />
        </div>
        <span className={styles.example}>Пример отчёта</span>
        <Button text="Проверить авто" style={{marginTop: 20}} />
      </div>
      }
      {id === "2" &&
      <>
        <Title text="Оценка стоимости автомобиля"/>
        <Formik
          initialValues={{
            "input1": "1 - Республика Адыгея",
            "input2": "",
            "input3": "",
            "input4": "",
            "input5": "",
            "input6": "",
            "input7": "",
            "input8": "",
            "input9": "Седан",
            "input10": "Левый",
            "input11": "",
            "input12": "Оригинал",
            "input13": ""
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
        {({ errors, touched, handleSubmit }) => (
          <Form>
            <div className={styles.flex20gap}>
              <FormLIGHT inputs={Object.entries(inputs2).slice(0, 1)} setInputs={setInputs2} errors={errors} touched={touched} />
              <FormLIGHT inputs={Object.entries(inputs2).slice(1, 3)} setInputs={setInputs2} errors={errors} touched={touched} />
              <FormLIGHT inputs={Object.entries(inputs2).slice(3, 11)} setInputs={setInputs2} errors={errors} touched={touched} />
              <FormLIGHT inputs={Object.entries(inputs2).slice(11)} setInputs={setInputs2} errors={errors} touched={touched} />
              <Items items={[
                {
                  label: "Оценка автомобиля",
                  value: "450 000 - 520 000 ₽"
                },
                {
                  label: "Средняя стоимость",
                  value: "499 000 ₽"
                },
              ]} />
            </div>
            <ScrollToError/>
          </Form>
        )}
        </Formik>
      </>
      }
      {id === "3" &&
      <>
        <Title text="Договор купли-продажи"/>
        <Formik
          initialValues={{
            "input1": "",
            "input2": "",
            "input3": "",
            "input4": "",
            "input5": "",
            "input6": "",
            "input7": "",
            "input8": "",
            "input9": "",
            "input10": "",
            "input11": "",
            "input12": "",
            "input13": "",
            "input14": "",
            "input15": "",
            "input16": "",
            "input17": "Легковой",
            "input18": "",
            "input19": "",
            "input20": "",
            "input21": "",
            "input22": "",
            "input23": "",
            "input24": "",
            "input25": "",
            "input26": "",
            "input27": "",
            "input28": "Седан",
            "input29": "",
            "input30": "",
            "input31": "",
            "input32": "",
            "input33": "",
            "input34": "",
            "input35": "",
            "input36": "",
            "input37": "",
            "input38": "13.04.2023",
            "input39": "",
            "input40": "",
            "input41": "",
            "input42": "",
            "input43": "",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
        {({ errors, touched, handleSubmit }) => (
          <Form>
            <div className={styles.flex20gap}>
              <Button text="Скачать пустой бланк" small={true} />
              <FormLIGHT title="Дата и место составления" inputs={Object.entries(inputs3).slice(0, 2)} setInputs={setInputs3} errors={errors} touched={touched} />
              <FormLIGHT title="Текущий владелец транспортного средства" inputs={Object.entries(inputs3).slice(2, 9)} setInputs={setInputs3} errors={errors} touched={touched} />
              <FormLIGHT title="Покупатель транспортного средства" inputs={Object.entries(inputs3).slice(9, 16)} setInputs={setInputs3} errors={errors} touched={touched} />
              <FormLIGHT title="Транспортное средство" inputs={Object.entries(inputs3).slice(16, 22)} setInputs={setInputs3} errors={errors} touched={touched} />
              <FormLIGHT title="Двигатель" inputs={Object.entries(inputs3).slice(22, 25)} setInputs={setInputs3} errors={errors} touched={touched} />
              <FormLIGHT title="Кузов" inputs={Object.entries(inputs3).slice(25, 29)} setInputs={setInputs3} errors={errors} touched={touched} />
              <FormLIGHT title="Паспорт транспортного средства ПТС" inputs={Object.entries(inputs3).slice(29, 33)} setInputs={setInputs3} errors={errors} touched={touched} />
              <FormLIGHT title="Свидетельство регистрации СТС" inputs={Object.entries(inputs3).slice(33, 36)} setInputs={setInputs3} errors={errors} touched={touched} />
              <FormLIGHT inputs={Object.entries(inputs3).slice(36, 37)} setInputs={setInputs3} errors={errors} touched={touched} />
            </div>
            <div style={{marginTop: 20}}>
              <Title text="Акт приёма-передачи"/>
            </div>
            <div className={styles.flex20gap}>
              <FormLIGHT inputs={Object.entries(inputs3).slice(37, 38)} setInputs={setInputs3} errors={errors} touched={touched} />
              <FormLIGHT title="Одновременно с автомобилем, Продавец передал, а покупатель принял следующие документы на автомобиль" inputs={Object.entries(inputs3).slice(38, 42)} setInputs={setInputs3} errors={errors} touched={touched} />
              <FormLIGHT title="А так же следующие запасные части и аксессуары автомобиля" inputs={Object.entries(inputs3).slice(42)} setInputs={setInputs3} errors={errors} touched={touched} />
              <div style={{
                display: "flex",
                alignItems: "center",
                marginTop: -15
              }}>
                <img src={require("../components/images/plus.svg").default} alt="plus" />
                <span style={{fontSize: 13, fontWeight: 300}}>Добавить строку</span>
              </div>
              <div style={{display: "flex", gap: "10px"}}>
                <Button text="Скачать пустой бланк" />
                <Button text="Скачать договор" />
              </div>
            </div>
            <ScrollToError/>
          </Form>
        )}
        </Formik>
      </>
      }
      {id === "4" &&
      <>
        <Title text="Проверить и оплатить штрафы ГИБДД"/>
        <FlexVariables variables={variables} select={select} setSelect={setSelect} />
        {select == "check" &&
        <>
          <Button text="Выбрать автомобиль" small={true} style={{ margin: "20px 0 20px 0" }} />
          <Formik
            initialValues={{
              "input1": "Водительское удостоверение",
              "input2": "00 AA 000000",
              "input2-2": "00 00 000000",
              "input3": "A 000 AA 000"
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
          {({ errors, touched, handleSubmit, values }) => (
            <Form>
              <div className={styles.flex20gap}>
                {values.input1 === "Водительское удостоверение" &&
                  <FormLIGHT inputs={Object.entries(inputs4).slice(0, 2)} setInputs={setInputs4} errors={errors} touched={touched} />}
                {values.input1 === "Свидетельство о регистрации СТС" &&
                  <FormLIGHT inputs={Object.entries(inputs4).filter((i) => i[0] !== "input2")} setInputs={setInputs4} errors={errors} touched={touched} />}
                <Button text="Проверить штрафы" handleClick={handleSubmit} />
              </div>
              <ScrollToError/>
            </Form>
          )}
          </Formik>
        </>}
      </>
      }
      {id === "5" &&
      <>
        <Title text="Калькулятор транспортного налога"/>
        <Formik
          initialValues={{
            "input1": "1 - Республика Адыгея",
            "input2": "Не выбрано",
            "input3": "",
            "input4": "",
            "input5": "Не выбрано",
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
        {({ errors, touched, handleSubmit }) => (
          <Form>
            <div className={styles.flex20gap}>
              <FormLIGHT inputs={Object.entries(inputs5).slice(0, 5)} setInputs={setInputs5} errors={errors} touched={touched} />
              <Button text="Рассчитать" handleClick={handleSubmit} />
              <Items items={[
                {
                  label: "Налоговая ставка",
                  value: "150,00 руб/л.с."
                },
                {
                  label: "Сумма налога",
                  value: "39 900,00 ₽"
                },
              ]} />
            </div>
            <ScrollToError/>
          </Form>
        )}
        </Formik>
      </>
      }
      {id === "6" &&
      <>
        <Title text="Заявление в ГИБДД"/>
        <Formik
          initialValues={{
            "input1": "",
            "input3": why,
            "input12": "Отсутствует",
            "input45": "когда, кем выдана, номер",
            "input8": "Легковой", 
            "input10": "B", 
            "input13": "Левое", 
            "input22": "Cерия, номер, дата выдачи",
            "input30": "Мужской"
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
        {({ errors, touched, handleSubmit }) => (
          <Form>
            <div className={styles.flex20gap}>
              <FormLIGHT inputs={Object.entries(inputs6).slice(0, 3)} setInputs={setInputs6} errors={errors} touched={touched} />
              <FormLIGHT title="Информация о транспортном средстве (номерном агрегате)" inputs={Object.entries(inputs6).slice(3, 22)} setInputs={setInputs6} errors={errors} touched={touched} />
              <FormLIGHT title="Сведения владельца транспортного средства" inputs={Object.entries(inputs6).slice(22, 34)} setInputs={setInputs6} errors={errors} touched={touched} />
              <FormLIGHT title="Представитель владельца транспортного средства" inputs={Object.entries(inputs6).slice(34, 36)} setInputs={setInputs6} errors={errors} touched={touched} />
              <FormLIGHT inputs={Object.entries(inputs6).slice(36)} setInputs={setInputs6} errors={errors} touched={touched} />
              <div>Бланк заявления в ГИБДД печатайте обязательно на одном листе А4 с двух сторон</div>
              <div style={{display: "flex", gap: "10px"}}>
                <Button text="Скачать заявление" />
                <Button text="Сохранить" />
              </div>
            </div>
            <ScrollToError/>
          </Form>
        )}
        </Formik>
      </>
      }
      {id === "7" &&
      <>
        <Title text="Заявление на замену водительского удостоверения"/>
        <Formik
          initialValues={{
            "input1": "",
            "input14": why2,
            "input6": "Паспорт",
            "input18": "B"
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
        {({ errors, touched, handleSubmit }) => (
          <Form>
            <div className={styles.flex20gap} style={{marginTop: 10}}>
              <FormLIGHT inputs={Object.entries(inputs7).slice(0, 1)} setInputs={setInputs7} errors={errors} touched={touched} />
              <FormLIGHT title="Информация заявителя" inputs={Object.entries(inputs7).slice(1, 11)} setInputs={setInputs7} errors={errors} touched={touched} />
              <FormLIGHT inputs={Object.entries(inputs7).slice(11, 15)} setInputs={setInputs7} errors={errors} touched={touched} />
              <FormLIGHT title="Данные водительского удостоверения" inputs={Object.entries(inputs7).slice(15)} setInputs={setInputs7} errors={errors} touched={touched} />
              <Button text="Скачать заявление" />
            </div>
            <ScrollToError/>
          </Form>
        )}
        </Formik>
      </>
      }
      {id === "8" &&
      <>
        <Title text="Электронный ПТС"/>
        <Formik
          initialValues={{
            "input1": "",
            "input5": "Легковой",
            "input6": "B",
            "input9": "Отсутствует",
            "input14": "Дизельный",
            "input15": "Первый"
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
        {({ errors, touched, handleSubmit }) => (
          <Form>
            <div className={styles.flex20gap} style={{marginTop: 10}}>
              <FormLIGHT title="1-я Страница" inputs={[]} setInputs={setInputs8} errors={errors} touched={touched} />
              <FormLIGHT title="Особые метки" inputs={Object.entries(inputs8).slice(0,1)} setInputs={setInputs8} errors={errors} touched={touched} />
              <FormLIGHT inputs={Object.entries(inputs8).slice(1,26)} setInputs={setInputs8} errors={errors} touched={touched} />
              <FormLIGHT title="2, 3, 4-я Страница" inputs={[]} setInputs={setInputs8} errors={errors} touched={touched} />
              <FormLIGHT title="Место записи •1 •2 •3 •4" inputs={[]} setInputs={setInputs8} errors={errors} touched={touched} />
              <FormLIGHT title="Особые метки" inputs={Object.entries(inputs8).slice(26,27)} setInputs={setInputs8} errors={errors} touched={touched} />
              <FormLIGHT inputs={Object.entries(inputs8).slice(27, 31)} setInputs={setInputs8} errors={errors} touched={touched} />
              <FormLIGHT title="Свидетельство о регистрации ТС" inputs={Object.entries(inputs8).slice(31)} setInputs={setInputs8} errors={errors} touched={touched} />
              <Button text="Скачать" />
            </div>
            <ScrollToError/>
          </Form>
        )}
        </Formik>
      </>
      }
      {id === "12" &&
      <>
        <Title text="Акт осмотра"/>
        <Formik
          initialValues={{
            "input1": "Оригинал",
            "input3": "КАСКО до 23.03.2024 (Дата окончания страховки)",
            "input4": "В наличии",
            "input5": "Личный автомобиль"
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
        {({ errors, touched, handleSubmit }) => (
          <Form>
            <div className={styles.flex20gap} style={{marginTop: 10}}>
              <FormLIGHT title="Комплект документов" inputs={Object.entries(inputs12).slice(0, 3)} setInputs={setInputs12} errors={errors} touched={touched} />
              <div className={styles.strangeInput} onClick={() => setMore(true)}>
                <div>
                  Дополнительные опции
                </div>
                <div>
                  <img src={require("../components/images/arrow-right.svg").default} alt="" />
                </div>
              </div>
              <FormLIGHT inputs={Object.entries(inputs12).slice(3, 4)} setInputs={setInputs12} errors={errors} touched={touched} />
              <div className={styles.title} style={{marginBottom: -10}}>Осмотр кузова</div>
              <CarView onlyView={false} carId="1234" damages={damages} businessId={businessId} />
              {damages.length > 0 &&
              <div>
                <div className={styles.title}>Повреждения кузова</div>
                <div className={styles.texts}>
                  <div className={styles.label}>
                    <div>Название детали</div>
                    <div>Повреждения</div>
                    <div>Ремонт</div>
                  </div>
                  {damages.map((damage, index) => (
                    <div className={styles.text} key={index}>
                      <div>{damage.type}</div>
                      <div>{damage.input1}</div>
                      <div>{damage.input3} {damage.input4} {damage.input5}</div>
                    </div>
                  ))}
                </div>
              </div>}
              <div>
                <div className={styles.title}>Фотографии кузова</div>
                <MiniSlider images={images2}
                            activeImage={activeImage2}
                            setActiveImage={setActiveImage2}
                            canAdd={true}
                            setImages={setImages2}
                            maxImagesCount={30}
                            canDelete={true}
                            style={{backgroundColor: "#000", padding: "5px 0 20px 0"}}
                            />
              </div>
              <div className={styles.title}>Оценка автомобиля: 450 000 - 520 000 ₽<br/>Средняя стоимость автомобиля: 499 000 ₽</div>
              <FormLIGHT inputs={Object.entries(inputs12).slice(4, 5)} setInputs={setInputs12} errors={errors} touched={touched} />
              {more &&
              <div className={styles.moreWrapper}>
                <div className={styles.more}>
                  <div className={styles.header}>
                    <div onClick={() => setMore(false)}>Отменить</div>
                    <div onClick={() => setMore(false)}>Готово</div>
                  </div>
                  <Title text="Дополнительные опции" />
                  <div className={styles.flex20gap}>
                    <FormLIGHT title="Вспомогательные системы" inputs={Object.entries(inputs12).slice(5, 27)} setInputs={setInputs12} errors={errors} touched={touched} />
                    <FormLIGHT title="Фары" inputs={Object.entries(inputs12).slice(27, 35)} setInputs={setInputs12} errors={errors} touched={touched} />
                    <FormLIGHT title="Салон" inputs={Object.entries(inputs12).slice(35, 52)} setInputs={setInputs12} errors={errors} touched={touched} />
                    <FormLIGHT title="Боковые зеркала" inputs={Object.entries(inputs12).slice(52, 56)} setInputs={setInputs12} errors={errors} touched={touched} />
                    <FormLIGHT title="Стёкла" inputs={Object.entries(inputs12).slice(56, 63)} setInputs={setInputs12} errors={errors} touched={touched} />
                    <FormLIGHT title="Руль и центральная панель" inputs={Object.entries(inputs12).slice(63, 76)} setInputs={setInputs12} errors={errors} touched={touched} />
                    <FormLIGHT title="Сохранность автомобиля" inputs={Object.entries(inputs12).slice(76, 81)} setInputs={setInputs12} errors={errors} touched={touched} />
                    <FormLIGHT title="Мультимедия" inputs={Object.entries(inputs12).slice(81, 95)} setInputs={setInputs12} errors={errors} touched={touched} />
                    <FormLIGHT title="Кузов" inputs={Object.entries(inputs12).slice(95, 101)} setInputs={setInputs12} errors={errors} touched={touched} />
                    <FormLIGHT title="Колёса" inputs={Object.entries(inputs12).slice(101, 109)} setInputs={setInputs12} errors={errors} touched={touched} />
                    <FormLIGHT title="Подушка безопасности" inputs={Object.entries(inputs12).slice(109)} setInputs={setInputs12} errors={errors} touched={touched} />
                  </div>
                </div>
              </div>}
            </div>
            <ScrollToError/>
          </Form>
        )}
        </Formik>
      </>
      }
      <FixedButton />
      {saving && <LoadingHover />}
    </div>
  );
}

export default Service;
