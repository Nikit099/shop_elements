import styles from './styles/Add.module.css';
import { useNavigate } from 'react-router-dom';
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

function Add() {
  const navigate = useNavigate();
  const { sendMessage, message, setMessage, account, businessId } = useMainContext();
  const imagesDivRef = useRef();
  const [ images, setImages ] = useState([]);
  const [ activeImage, setActiveImage ] = useState(0);
  const [ photosError, setPhotosError ] = useState(null);
  const indexOfLoadedImage = useRef(-1);
  const [ cardId, setCardId ] = useState(null);
  const [ inputs, setInputs ] = useState({
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
        decimalLimit: 0, // количество знаков после запятой
        integerLimit: 12, // максимальное количество цифр до запятой
        allowNegative: false,
        allowLeadingZeroes: false,
      })
    },
    // "oldPrice": {
    //   value: null,
    //   isFocused: false,
    //   error: null,
    //   label: "Старая цена, ₽",
    //   type: "text",
    //   mask: createNumberMask({
    //     prefix: '',
    //     suffix: ' ₽',
    //     includeThousandsSeparator: true,
    //     thousandsSeparatorSymbol: ' ',
    //     allowDecimal: false,
    //     decimalSymbol: null,
    //     decimalLimit: 0, // количество знаков после запятой
    //     integerLimit: 12, // максимальное количество цифр до запятой
    //     allowNegative: false,
    //     allowLeadingZeroes: false,
    //   }) 
    // },
  });
  const [ saving, setSaving ] = useState(false);
  useEffect(() => {
    window.scrollTo({top: 0});
  }, [])
  const handleSubmit = (values) => {
    if (images.length === 0) {
      setPhotosError("Добавьте хотя бы 1 фотографию");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return
    }
    if (values["category"] === "Розы с любовью") {
      values["colors"] = selectedColors;
      values["counts"] = selectedCounts;
      // values["packages"] = selectedPackages;
      values["sizes"] = selectedSizes;
      values["prices"] = prices;
      values["image_color"] = [];
      for (let i = 0; i < images?.length; i++) {
        const image = images[i];
        if (image.color) {
          values["image_color"].push({index: i, color: image.color})
        }
        if (image.count) {
          values["image_color"].push({index: i, count: image.count})
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
    sendMessage(JSON.stringify(["cards", "create", values, account]));
    setSaving(true);
  }
  useEffect(() => {
    if (message && window.location.pathname === `/${businessId}/add`) {
      if (message[0] === "cards") {
        if (message[1] === "created") {
          setCardId(message[2]);
        }
      } else if (message[0] === "images") {
        if (message[1] === "added") {
          indexOfLoadedImage.current = message[2];
        }
      }
      setMessage(null);
    };
  }, [message]);
  useEffect(() => {
    if (cardId && indexOfLoadedImage.current + 1 <= images.length && images[indexOfLoadedImage.current + 1]) {
      sendMessage(JSON.stringify(["images", "add", cardId, indexOfLoadedImage.current + 1, images[indexOfLoadedImage.current + 1].file]));
    } else if (cardId) {
      setSaving(false);
      navigate(`/${businessId}/search?card_id=`  + cardId, { replace: true });
    }
  }, [cardId, indexOfLoadedImage.current])
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
  ]
  const [ selectedColors, setSelectedColors ] = useState([]);
  const counts = [
    "9",
    "19",
    "29",
    "51",
    "101"
  ]
  const [ selectedCounts, setSelectedCounts ] = useState([]);
  const sizes = [
    "50 см",
    "60 см",
    "70 см",
    "80 см"
  ]
  const [ selectedSizes, setSelectedSizes ] = useState([]);
  const packages = [
    "Лента",
    "Коробка",
    "Корзина",
    "Подарочной упаковка",
    "Классика"
  ]
  const [ selectedPackages, setSelectedPackages ] = useState([]);
  const [ prices, setPrices ] = useState([]);
  return (
    <div className="view">
      <Formik
        initialValues={{
          "category": "Розы с любовью",
          "title": "",
          "price": "",
          "oldPrice": ""
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
      {({ errors, touched, handleSubmit, values }) => (
        <Form>
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
                    canChangeColor={values.category === "Розы с любовью"}
                    canChangeCount={values.category === "Розы с любовью"}
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
          <div className={styles.flex20gap}>
            <FormLIGHT inputs={Object.entries(inputs).slice(0, 1)} setInputs={setInputs} errors={errors} touched={touched} />
            <FormLIGHT inputs={Object.entries(inputs).slice(1, 2)} setInputs={setInputs} errors={errors} touched={touched} />
            {values.category === "Розы с любовью" &&
            <>
            <div>
              <div style={{fontSize: 14, fontWeight: 300, paddingBottom: 10, color: "#bbb"}}>Доступные цвета</div>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10
              }}>
                {colors.map((color, index) => (
                  <div key={"color" + index} 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px 7px",
                        borderRadius: 4,
                        background: selectedColors.includes(color) ? "#fff" : "rgb(24, 24, 26)",
                        fontSize: 14,
                        fontWeight: 300,
                        color: selectedColors.includes(color) ? "#000" : "#fff"
                      }}
                      onClick={() => {
                        if (selectedColors.includes(color)) {
                          setSelectedColors(prevState => prevState.filter((selectedColor) => color !== selectedColor))
                        } else {
                          setSelectedColors(prevState => [...prevState, color])
                        }
                      }}
                  >
                    {color}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{fontSize: 14, fontWeight: 300, paddingBottom: 10, color: "#bbb"}}>Доступное кол-во стеблей</div>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10
              }}>
                {counts.map((count, index) => (
                  <div key={"count" + index} 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px 7px",
                        borderRadius: 4,
                        background: selectedCounts.includes(count) ? "#fff" : "rgb(24, 24, 26)",
                        fontSize: 14,
                        fontWeight: 300,
                        color: selectedCounts.includes(count) ? "#000" : "#fff"
                      }}
                      onClick={() => {
                        if (selectedCounts.includes(count)) {
                          setSelectedCounts(prevState => prevState.filter((selectedCount) => count !== selectedCount))
                        } else {
                          setSelectedCounts(prevState => [...prevState, count])
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
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10
              }}>
                {sizes.map((size, index) => (
                  <div key={"size" + index} 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px 7px",
                        borderRadius: 4,
                        background: selectedSizes.includes(size) ? "#fff" : "rgb(24, 24, 26)",
                        fontSize: 14,
                        fontWeight: 300,
                        color: selectedSizes.includes(size) ? "#000" : "#fff"
                      }}
                      onClick={() => {
                        if (selectedSizes.includes(size)) {
                          setSelectedSizes(prevState => prevState.filter((selectedSize) => size !== selectedSize))
                        } else {
                          setSelectedSizes(prevState => [...prevState, size])
                        }
                      }}
                  >
                    {size}
                  </div>
                ))}
              </div>
            </div>
            {/* <div>
              <div style={{fontSize: 14, fontWeight: 300, paddingBottom: 10, color: "#bbb"}}>Доступные упаковки</div>
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10
              }}>
                {packages.map((pckg, index) => (
                  <div key={"package" + index} 
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px 7px",
                        borderRadius: 4,
                        background: selectedPackages.includes(pckg) ? "#fff" : "rgb(24, 24, 26)",
                        fontSize: 14,
                        fontWeight: 300,
                        color: selectedPackages.includes(pckg) ? "#000" : "#fff"
                      }}
                      onClick={() => {
                        if (selectedPackages.includes(pckg)) {
                          setSelectedPackages(prevState => prevState.filter((selectedPackage) => pckg !== selectedPackage))
                        } else {
                          setSelectedPackages(prevState => [...prevState, pckg])
                        }
                      }}
                  >
                    {pckg}
                  </div>
                ))}
              </div>
            </div> */}
            </>}
            <FormLIGHT inputs={Object.entries(inputs).slice(2)} setInputs={setInputs} errors={errors} touched={touched} />
            {values.category === "Розы с любовью" &&
            <AddPrice prices={prices} setPrices={setPrices} />}
            <Button text="Сохранить" handleClick={handleSubmit} />
          </div>
          <ScrollToError/>
        </Form>
      )}
      </Formik>
      {saving && <LoadingHover />}
    </div>
  );
}

export default Add;
