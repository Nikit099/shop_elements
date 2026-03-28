import styles from './styles/Slider.module.css';
import { useRef, useEffect, useState } from 'react';
import GosNumber from './GosNumber';
import { LazyLoadImage } from 'react-lazy-load-image-component';

function Slider({ images, imagesDivRef, setActiveImage, canAdd, activeImage, setImages, maxImagesCount, photosError, setPhotosError, category, canChangeColor, canChangeCount }) {

  const imagesCountDivRef = useRef();
  const imagesScrollBarDivRef = useRef();

  const [ sliderPosition, setSliderPosition ] = useState(0);

  const handleScroll = () => {
    if (imagesDivRef.current) {
      const scrollLeft = imagesDivRef.current.scrollLeft;
      const offsetWidth = window.innerWidth;
      const scrollPosition = Math.max(0, (scrollLeft / offsetWidth).toFixed(0)) + 1;
      if (imagesCountDivRef.current) {
        imagesCountDivRef.current.innerHTML = `${scrollPosition}/${images.length}`
      };
      setSliderPosition(scrollLeft / imagesDivRef.current.scrollWidth * 100);
      if (imagesScrollBarDivRef.current) {
        imagesScrollBarDivRef.current.style.width = `${100/images.length}%`;
        imagesScrollBarDivRef.current.style.margin = `0 0 0 ${scrollLeft / imagesDivRef.current.scrollWidth * 100}%`;
      };
      for (var i in images) {
        if (Number(i) + 1 == scrollPosition) {
          setActiveImage(i);
        };
      };
    };
  };

  useEffect(() => {
    if (imagesDivRef.current && images.length > 0) {
      imagesDivRef.current.addEventListener('scroll', handleScroll);
    };
    if (imagesCountDivRef.current) {
      const text = imagesCountDivRef.current.innerHTML;
      const slashIndex = text.indexOf('/');

      if (slashIndex !== -1) {
        const firstPart = text.slice(0, slashIndex + 1);
        const secondPart = `${images.length}`;
        imagesCountDivRef.current.innerHTML = firstPart + secondPart;
      }
    };
    if (imagesScrollBarDivRef.current) {
      imagesScrollBarDivRef.current.style.width = `${100/images.length}%`;
      imagesScrollBarDivRef.current.style.margin = `0 0 0 ${sliderPosition}%`;
    };
    return () => {
      if (imagesDivRef.current && images.length > 0) {
        imagesDivRef.current.removeEventListener('scroll', handleScroll);
      };
    };
  }, [images]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, maxImagesCount - images.length);
    
    if (files.length === 0) {
      return;
    }

    // Валидация файлов
    const validFiles = [];
    const invalidFiles = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    files.forEach(file => {
      // Проверка формата
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      
      if (!validImageTypes.includes(file.type)) {
        invalidFiles.push({ file, reason: 'Неверный формат файла. Допустимы: JPG, PNG, WebP, GIF' });
        return;
      }
      
      // Проверка размера
      if (file.size > maxFileSize) {
        invalidFiles.push({ file, reason: `Файл слишком большой (${(file.size / (1024 * 1024)).toFixed(1)}MB). Максимум: 10MB` });
        return;
      }
      
      validFiles.push(file);
    });
    
    // Показываем ошибки для невалидных файлов
    if (invalidFiles.length > 0) {
      const errorMessages = invalidFiles.map(f => f.reason).join(', ');
      setPhotosError(`Ошибка загрузки: ${errorMessages}`);
      return;
    }
    
    if (validFiles.length === 0) {
      return;
    }

    // Создаем промисы для каждой загрузки файла
    const loadPromises = validFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          resolve({ file: e.target.result, name: file.name, size: file.size, type: file.type });
        };
        
        reader.onerror = () => {
          resolve(null); // Возвращаем null при ошибке
        };
        
        reader.readAsDataURL(file);
      });
    });

    // Ожидаем завершения всех загрузок
    Promise.all(loadPromises).then(results => {
      const validResults = results.filter(result => result !== null);
      
      // Добавляем уникальный идентификатор для каждого изображения
      const newImages = validResults.map(result => ({
        ...result,
        id: Date.now() + Math.random().toString(36).substr(2, 9) // уникальный ID
      }));
      
      // Добавляем только новые изображения, проверяя на дубликаты по размеру и имени
      setImages((prevImages) => {
        const currentImageKeys = new Set(
          prevImages.map(img => `${img.name || ''}-${img.size || 0}`)
        );
        
        const filteredNewImages = newImages.filter(newImg => 
          !currentImageKeys.has(`${newImg.name || ''}-${newImg.size || 0}`)
        );
        
        return [...prevImages, ...filteredNewImages];
      });
      
      setPhotosError(null);
      
      // Прокручиваем к последнему добавленному изображению
      if (imagesDivRef.current && validResults.length > 0) {
        setTimeout(() => {
          imagesDivRef.current.scrollLeft = imagesDivRef.current.scrollWidth;
        }, 100);
      }
    }).catch(error => {
      console.error('Error loading images:', error);
      setPhotosError('Ошибка при загрузке изображений');
    });
  };

  const handleRemoveImage = () => {
    setImages(images.filter((_, index) => index != activeImage));
    imagesDivRef.current.scrollLeft = window.innerWidth * activeImage;
  }

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

  const counts = [
    "9",
    "19",
    "29",
    "51",
    "101"
  ]

  return (
    <div className={styles.imagesWrapper} style={!canAdd ? {borderTopLeftRadius: 25, borderTopRightRadius: 25} : null}>
      { !canAdd ?
          <div className={styles.images} ref={imagesDivRef}>
            {images.map((image, index) => (
              <div className={styles.image} key={index} id={"post_img" + index}>
                <LazyLoadImage src={image.file} placeholderSrc={image.file_lazy} alt="" />
              </div>
            ))}
          </div>
        :
          ( images.length > 0 ?
              <div className={styles.images} ref={imagesDivRef}>
                {images.map((image, index) => (
                  <div className={styles.image} key={index}>
                    <img src={image.file} alt="" />
                    {image.color &&
                    <div style={{
                      position: "absolute",
                      left: 10,
                      top: 10,
                      borderRadius: 9,
                      padding: 5,
                      background: "#000",
                      fontSize: 14,
                      fontWeight: 300
                    }}>{image.color}</div>}
                    {image.count &&
                    <div style={{
                      position: "absolute",
                      left: 10,
                      top: 10,
                      borderRadius: 9,
                      padding: 5,
                      background: "#000",
                      fontSize: 14,
                      fontWeight: 300
                    }}>{image.count}</div>}
                  </div>
                ))}
              </div>
            :
              <div className={styles.addImage} ref={imagesDivRef} onClick={() => document.getElementById('photo-input').click()}>
                <div><img src={require("./images/plus2.svg").default} alt="plus"/></div>
                <div>Добавить фотографии</div>
                <div className={styles.smallText}>Максимальное количество фотографий {maxImagesCount} шт.</div>
                {photosError && <div className={styles.error}>{photosError}</div>}
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
          )
      }
      {images.length > 1 &&
      <div className={styles.count}>
        <div ref={imagesCountDivRef}>1/{images.length}</div>
      </div>}
      {images.length > 1 &&
      <div className={styles.scrollbar}>
        <div ref={imagesScrollBarDivRef}></div>
      </div>}
      {(canAdd && images.length > 0) &&
        <div className={styles.removeImage} onClick={handleRemoveImage}>
          <img src={require("./images/remove.svg").default} alt="remove"/>
        </div>}
      {(canChangeColor && images.length > 0) &&
        <div className={styles.removeImage} style={{right: 55, display: "flex", alignItems: "center", justifyContent: "center"}} onClick={() => {
          if (canChangeColor) {
            document.getElementById(`color`).focus();
          }
        }}>
          <img src={require("./images/settings.svg").default} style={{width: "70%"}} alt=""/>
          <select id="color" style={{opacity: 0, width: 0, height: 0, margin: 0, padding: 0}} onChange={(e) => {
            setImages(prevState => [...prevState.map((image, index) => {
              if (index === Number(activeImage)) {
                return {
                  ...image,
                  color: e.target.value === "Не выбрано" ? null : e.target.value
                };
              }
              return image;
            })])
          }}>
            <option>Не выбрано</option>
            {colors.map((color, index) => (
              <option value={color} key={index}>{color}</option>
            ))}
          </select>
        </div>}
      {(canChangeCount && images.length > 0) &&
        <div className={styles.removeImage} style={{right: 100, display: "flex", alignItems: "center", justifyContent: "center"}} onClick={() => {
          if (canChangeCount) {
            document.getElementById(`count`).focus();
          }
        }}>
          <img src={require("./images/settings.svg").default} style={{width: "70%"}} alt=""/>
          <select id="count" style={{opacity: 0, width: 0, height: 0, margin: 0, padding: 0}} onChange={(e) => {
            setImages(prevState => [...prevState.map((image, index) => {
              if (index === Number(activeImage)) {
                return {
                  ...image,
                  count: e.target.value === "Не выбрано" ? null : e.target.value
                };
              }
              return image;
            })])
          }}>
            <option>Не выбрано</option>
            {counts.map((count, index) => (
              <option value={count} key={index}>{count}</option>
            ))}
          </select>
        </div>}
    </div>
  );
}

export default Slider;
