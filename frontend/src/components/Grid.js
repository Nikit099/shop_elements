import styles from './styles/Grid.module.css';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { useEffect, useState } from 'react';
import GosNumber from '../components/GosNumber';


function Grid({ items: initialItems, navigate, businessId }) {

  const [ items, setItems ] = useState([]);

  useEffect(() => {
    if (items.length == 0 && initialItems.length > 0) {
      setItems(prevState => {
        const combinedList = [...prevState]; // Копируем текущее состояние в новый список
  
        initialItems.forEach(item => {
          let randomIndex;
          let isValidIndex = false;
  
          // Повторяем пока не найдем допустимый индекс
          while (!isValidIndex) {
            // Выбираем случайный индекс из всех доступных списков
            randomIndex = Math.floor(Math.random() * (combinedList.length + 1)); // +1 для возможности создания нового списка
  
            // Проверяем, чтобы предыдущий или следующий список не был одинаковой длины
            const isPreviousSameLength = randomIndex > 0 && combinedList[randomIndex - 1]?.length === combinedList[randomIndex]?.length;
  
            // Проверяем, что combinedList[randomIndex] существует и что он не имеет одинаковой длины с соседними списками
            if (randomIndex < combinedList.length && !isPreviousSameLength && combinedList[randomIndex]) {
              // Добавляем элемент в существующий список, если индекс меньше длины combinedList и нет одинаковой длины рядом
              if (combinedList[randomIndex].length <= 2) {
                combinedList[randomIndex].push(item);
                isValidIndex = true;
              }
            } else if (randomIndex === combinedList.length) {
              // Если индекс равен длине combinedList, создаем новый список с одним элементом
              combinedList.push([item]);
              isValidIndex = true;
            }
          }
        });
  
        console.log(combinedList);
  
        return combinedList; // Обновляем состояние posts
      });
    }
  }, [initialItems, items]);

  return (
    <div className={styles.grid}>
      {items.map((l, index) => (
        <div key={index}>
          {(l.length > 0 && l.length === 3) &&
          <div className={styles.line}>
            {l.map((item, index) => (
            <div className={styles.cellSmall} onClick={() => navigate( `/${businessId}/posts/` + item._id)} key={item._id}>
              <div className={styles.image}>
                {item.images &&
                <LazyLoadImage
                  alt="item"
                  src={item.images[0].file}
                  placeholderSrc={item.images[0].file_lazy}/>}
                {item.input1 === "Автомобили" && "input3_" in item &&
                <div style={{position: "absolute", bottom: 0, right: 0, zIndex: 1}}>
                  <GosNumber number={"м555мм"} region={"95"} size={.35} />
                </div>}
              </div>
              <div className={styles.information}>
              <div className={styles.title}>{item.input1 === "Автомобили" ? item.input39 : item.input5}</div>
                <div className={styles.price}>{item.input1 === "Автомобили" ? `${item.input5} ${item.input6}, ${item.input7}, ${item.input17}` : item.input2 }</div>
              </div>
            </div>))}
          </div>}
          {(l.length > 0 && l.length === 1) &&
          <div>
            {l.map((item, index) => (
            <div className={styles.cellBig} onClick={() => navigate(`/${businessId}/posts/` +  item._id)} key={item._id}>
              <div className={styles.image}>
                {item.images &&
                <LazyLoadImage
                  alt="item"
                  src={item.images[0].file}
                  placeholderSrc={item.images[0].file_lazy}/>}
                {item.input1 === "Автомобили" && "input3_" in item &&
                <div style={{position: "absolute", bottom: "5%", right: "4%", zIndex: 999}}>
                  <GosNumber number={"м555мм"} region={"95"} size={.7} />
                </div>}
              </div>
              <div className={styles.information}>
              <div className={styles.title}>{item.input1 === "Автомобили" ? item.input39 : item.input5}</div>
                <div className={styles.price}>{item.input1 === "Автомобили" ? `${item.input5} ${item.input6}, ${item.input7}, ${item.input17}` : item.input2 }</div>
              </div>
            </div>))}
          </div>}
          {(l.length > 0 && l.length === 2) &&
          <div className={styles.line}>
            {l.map((item, index) => (
            <div className={styles.cellMiddle} onClick={() => navigate(`/${businessId}/posts/` + item._id)} key={item._id}>
              <div className={styles.image}>
                {item.images &&
                <LazyLoadImage
                  alt="item"
                  src={item.images[0].file}
                  placeholderSrc={item.images[0].file_lazy}/>}
                {item.input1 === "Автомобили" && "input3_" in item &&
                <div style={{position: "absolute", bottom: 0, right: 0, zIndex: 1}}>
                  <GosNumber number={"м555мм"} region={"95"} size={.45} />
                </div>}
              </div>
              <div className={styles.information}>
                <div className={styles.title}>{item.input1 === "Автомобили" ? item.input39 : item.input5}</div>
                <div className={styles.price}>{item.input1 === "Автомобили" ? `${item.input5} ${item.input6}, ${item.input7}, ${item.input17}` : item.input2 }</div>
              </div>
            </div>))}
          </div>}
        </div>
      ))}
    </div>
  );
}

export default Grid;
